import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as cron from 'node-cron';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import { CreateAlertDto } from '../dtos/alert.create.dto';
import { UpdateAlertDto } from '../dtos/alert.update.dto';
import { Alert } from '../schemas/alert.schema.';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel('Alert') private readonly alertModel: Model<Alert>,
    @Inject(forwardRef(() => UserRepositoryToken))
    private userRepository: UserRepository,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
  ) {
    cron.schedule('* * 1 * *', this.resetAllTriggeredAt.bind(this));
  }

  //a function that  resets all the alerts triggered_at to 0
  async resetAllTriggeredAt(): Promise<void> {
    const alerts = await this.alertModel.updateMany(
      {},
      { $set: { triggered_at: null, status: 'Active' } },
    );
  }

  async create(createAlertDto: CreateAlertDto, userId: string): Promise<Alert> {
    const session = await this.alertModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const categoryName = createAlertDto.categoryId;
      Logger.log('categoryName: ' + categoryName);
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        userId,
        session,
      );
      Logger.log('categId: ' + categId);

      delete createAlertDto.categoryId; //remove the category field because it doesn't belong in the schema
      const alert = {
        ...createAlertDto,
        userId: userId,
        categoryId: categId,
      };
      const createdAlert = new this.alertModel(alert);
      await this.userRepository.addAlertToUser(
        userId,
        new Types.ObjectId(createdAlert.id),
        session,
      ); // Method which adds the category ID to the user who created it

      await this.categoryRepository.addAlertToCategory(
        alert.categoryId,
        new Types.ObjectId(createdAlert.id),
        session,
      );
      await createdAlert.save({ session });
      await session.commitTransaction();

      const catg = await this.categoryRepository.findOne(categId);
      await this.reevaluateAlerts(catg, catg.current_value, session); //we check if anything triggers the alert immediately

      return createdAlert;
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error.code === 11000) {
        throw new ConflictException(
          'You already have an alert with the name ' + createAlertDto.name,
        );
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      session.endSession();
    }
  }

  async findAll(): Promise<Alert[]> {
    return await this.alertModel.find().exec();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id).exec();
    if (!alert) {
      throw new NotFoundException(`Alert with ID '${id}' not found`);
    }
    return alert;
  }

  async getAlerts(
    month: number,
    year: number,
    userId: string,
  ): Promise<Expense[]> {
    // Define the start and end date for the month
    const startDate = new Date(year, month - 1);
    const endDate =
      month == 12 ? new Date(+year + 1, 0) : new Date(year, month % 12);

    // we retrieve all alerts for the user
    const alerts = await this.alertModel.aggregate([
      {
        // we filter for alerts from this user
        $match: { userId: userId },
      },
      {
        // we join with the categories collection, extracting the category by its id and saving it as categoryData
        $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$categoryId' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
          as: 'categoryData',
        },
      },
      // we open up the array of categoryData
      { $unwind: '$categoryData' },
      {
        // ew crreate a new field for the dates this alert was triggered this month
        $addFields: {
          wasTriggeredInMonth: {
            //we use filter operator to loop through the array triggered_history and create the new array
            //which with elements that match the condition
            $filter: {
              input: '$triggered_history',
              as: 'date', //for each element of triggered_history.filter((date)=> )
              cond: {
                // we check if the date is within this month
                $and: [
                  { $gte: ['$$date', startDate] },
                  { $lt: ['$$date', endDate] },
                ],
              },
            },
          },
        },
      },
      // we get the first element from the array of triggered dates this month and save it dateTriggeredAt
      {
        $addFields: {
          dateTriggeredAt: { $arrayElemAt: ['$wasTriggeredInMonth', 0] },
        },
      },
      // { $project: { _id: 1, dateTriggeredAt: 1 } },
      {
        // we set the status based on whether it was triggered this month
        $addFields: {
          status: {
            $cond: [
              { $eq: [{ $size: '$wasTriggeredInMonth' }, 0] }, //if size equals to 0, it's active, otherwise it's triggered
              'Active',
              'Triggered',
            ],
          },
        },
      },
      // { $project: { _id: 1, dateTriggeredAt: 1 } },
      {
        // Project the desired fields
        $project: {
          _id: 0,
          alert: '$name',
          category: '$categoryData.name',
          condition: {
            $concat: ['Spending ', '$condition', ' ', { $toString: '$amount' }],
          },
          status: '$status',
          date: {
            // Format the date if it exists
            $cond: [
              { $eq: ['$dateTriggeredAt', null] },
              'Not Triggered',
              {
                $dateToString: {
                  format: '%d-%m-%Y',
                  date: '$dateTriggeredAt',
                },
              },
            ],
          },
        },
      },
    ]);

    return alerts;
  }

  async update(
    id: string,
    alertDto: UpdateAlertDto,
    userId: string,
  ): Promise<Alert> {
    const session = await this.alertModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const categoryName = alertDto.categoryId;
      Logger.log('categoryName: ' + categoryName);
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        userId,
        session,
      );
      Logger.log('categId: ' + categId);

      delete alertDto.categoryId; //remove the category field because it doesn't belong in the schema
      alertDto = {
        ...alertDto,
        categoryId: categId,
      };
      let updatedAlert: any = { ...alertDto };
      const alert = await this.alertModel
        .findByIdAndUpdate(id, updatedAlert, {
          new: true,
          runValidators: true,
        })
        .session(session)
        .exec();

      const catg = await this.categoryRepository.findOne(alert.categoryId);
      await this.reevaluateAlerts(catg, catg.current_value, session); //we check if anything triggers the alert immediately

      await session.commitTransaction();
      return alert;
    } catch (error) {
      await session.abortTransaction();
      throw error; // don't return the error, throw it so it can be handled by your error handling middleware
    } finally {
      session.endSession();
    }
  }

  async reevaluateAlerts(category: Category, catgNewVal: number, session: any) {
    const alerts = await this.alertModel
      .find({ categoryId: category.id })
      .session(session)
      .exec();

    // Logger.log('Alerts: ', alerts);
    for (const alert of alerts) {
      let newStatus;
      let shouldUpdate = false;
      Logger.log('catgNewVal: ', catgNewVal);
      Logger.log('alert.amount: ', alert.amount);

      switch (alert.condition) {
        case 'greater than':
          newStatus = catgNewVal > alert.amount ? 'Triggered' : 'Active';
          shouldUpdate = catgNewVal > alert.amount;
          break;
        case 'less than':
          newStatus = catgNewVal < alert.amount ? 'Triggered' : 'Active';
          shouldUpdate = catgNewVal < alert.amount;
          break;
        case 'equal to':
          newStatus = catgNewVal == alert.amount ? 'Triggered' : 'Active';
          shouldUpdate = catgNewVal == alert.amount;
          break;
        default:
          throw new Error(`Invalid alert condition: ${alert.condition}`);
      }

      if (alert.status !== newStatus) {
        alert.status = newStatus;
        Logger.log('newStatus');

        // If the alert has been triggered, update the triggered_at and history fields
        if (shouldUpdate && newStatus === 'Triggered') {
          const now = new Date();
          alert.triggered_at = now;
          alert.triggered_history.push(now);
        } else if (!shouldUpdate && newStatus === 'Active') {
          Logger.log('back to active');
          alert.triggered_at = null;
          // Remove the last entry from triggered_history
          if (alert.triggered_history.length > 0) {
            alert.triggered_history.pop();
          }
        }

        await alert.save({ session });
      }
    }
  }

  async delete(id: string): Promise<Alert> {
    const session = await this.alertModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const deletedAlert = await this.alertModel
        .findByIdAndRemove(id)
        .session(session)
        .exec();

      if (!deletedAlert) {
        throw new NotFoundException(`Alert with ID '${id}' not found`);
      }
      await this.userRepository.deleteAlertFromUser(
        deletedAlert.userId,
        id,
        session,
      );

      await this.categoryRepository.deleteAlertFromCategory(
        id,
        deletedAlert.categoryId,
        session,
      );

      await session.commitTransaction();
      return deletedAlert;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      session.endSession();
    }
  }

  async deleteAllAlertsOfUserId(userId: string, session: any): Promise<void> {
    await this.alertModel
      .deleteMany({ userId: userId })
      .session(session)
      .exec();
  }

  async deleteAllAlertsOfCategoryId(
    catgId: string,
    session: any,
  ): Promise<string[]> {
    //retrieve alerts with matching catg id to delete them from user later

    const alerts = await this.alertModel
      .find({ categoryId: catgId })
      .session(session)
      .exec();

    const alertIds = alerts.map((alert) => alert.id);
    await this.alertModel
      .deleteMany({ categoryId: catgId })
      .session(session)
      .exec();
    return alertIds;
  }
}
