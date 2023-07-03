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
import { Category } from 'src/components/category/schemas/category.schema';

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
    const startDate = new Date(year, month - 1); // month starts at zero, so dec is 0
    const endDate =
      month == 12 ? new Date(+year + 1, 0) : new Date(year, month % 12); // month % 12 will give 0 for December

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
          condition: {
            $concat: ['Spending ', '$condition', ' ', { $toString: '$amount' }],
          },
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

  async reevaluateAlerts(category: Category, catgNewVal: number, session: any) {
    const alerts = await this.alertModel
      .find({ categoryId: category.id })
      .session(session)
      .exec();

    Logger.log('Alerts: ', alerts);
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
