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
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { Alert } from '../schemas/alert.schema.';
import {
  CategoryRepositoryToken,
  CategoryRepository,
} from 'src/components/category/repos/category.repository';
import { CreateAlertDto } from '../dtos/alert.create.dto';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import { UpdateAlertDto } from '../dtos/alert.update.dto';
import * as cron from 'node-cron';

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
      const categoryName = createAlertDto.category;
      Logger.log('categoryName: ' + categoryName);
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        userId,
        session,
      );
      Logger.log('categId: ' + categId);

      delete createAlertDto.category; //remove the category field because it doesn't belong in the schema
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
    const startDate = new Date(month + '/01/' + year);
    const endMonth = month == 12 ? 1 : month + 1; //if conditon incase of dec
    const endDate = new Date(endMonth + '/01/' + year);

    // In MongoDB, months are 0-indexed, so January is 0, February is 1, etc. Therefore, subtract 1 from month for the startDate.
    // Also, the endDate should be the start of the next month, so if the month is 12 (December), reset it to 0 (January) and increment the year by 1.
    // If the month is not December, simply increment it by 1.

    const alerts = await this.alertModel.aggregate([
      {
        $match: {
          userId: userId,
          $or: [
            // Either the alert was triggered within the month, or it is still active
            { triggered_at: { $gte: startDate, $lt: endDate } },
            { status: 'Active' },
          ],
        },
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$categoryId' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
          as: 'categoryData',
        },
      },
      {
        $unwind: '$categoryData',
      },
      {
        $project: {
          _id: 0,
          alert: '$name',
          category: '$categoryData.name',
          condition: '$condition',
          status: '$status',
          date: {
            $dateToString: { format: '%d-%m-%Y', date: '$triggered_at' },
          },
        },
      },
    ]);

    return alerts;
  }

  async update(id: string, alertDto: UpdateAlertDto): Promise<Alert> {
    let updatedAlert: any = { ...alertDto };
    const alert = await this.alertModel
      .findByIdAndUpdate(id, updatedAlert, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!alert) {
      throw new NotFoundException(`Expense with ID '${id}' not found`);
    }

    return alert;
  }

  //function that updates the triggered date
  async updateTriggeredAtDate(
    categoryId: string,
    catgCurrentValue: number,
    added: number,
    session: any,
  ): Promise<void> {
    // Find all alerts with matching categoryId
    const alerts = await this.alertModel
      .find({ categoryId })
      .session(session)
      .exec();

    Logger.log('alerts', alerts);
    if (!alerts) {
      // No alerts found for this categoryId
      return;
    }

    let finalValue: number;
    if (added != 0) {
      finalValue = catgCurrentValue + added;
    }

    // Iterate over each alert and update if necessary
    for (let alert of alerts) {
      let shouldUpdate = false;
      switch (alert.condition) {
        case 'greater than':
          Logger.log('alert', alert.name);

          Logger.log('finalValue', finalValue);
          Logger.log('alert.amount', alert.amount);
          if (finalValue > alert.amount) {
            shouldUpdate = true;
          }
          break;
        case 'less than':
          if (finalValue < alert.amount) {
            shouldUpdate = true;
          }
          break;
        case 'equal to':
          if (finalValue == alert.amount) {
            shouldUpdate = true;
          }
          break;
        default:
          throw new Error(
            `Unexpected condition value '${alert.condition}' for alert with ID '${alert._id}'`,
          );
      }

      if (shouldUpdate) {
        const now = new Date();
        alert.triggered_at = now;
        alert.triggered_history.push(now);
        if (added != 0) {
          alert.status = 'Triggered';
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
