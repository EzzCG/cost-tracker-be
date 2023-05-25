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

@Injectable()
export class AlertService {
  constructor(
    @InjectModel('Alert') private readonly alertModel: Model<Alert>,
    @Inject(forwardRef(() => UserRepositoryToken))
    private userRepository: UserRepository,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
  ) {}

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
        new Types.ObjectId(createdAlert._id),
        session,
      ); // Method which adds the category ID to the user who created it

      await this.categoryRepository.addAlertToCategory(
        alert.categoryId,
        new Types.ObjectId(createdAlert._id),
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

    const alertIds = alerts.map((alert) => alert._id);
    await this.alertModel
      .deleteMany({ categoryId: catgId })
      .session(session)
      .exec();
    return alertIds;
  }
}
