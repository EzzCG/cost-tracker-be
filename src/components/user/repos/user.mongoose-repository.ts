import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  checkEmailExists,
  checkEmailFound,
  checkIdType,
  checkUserFound,
  hashPw,
} from './user.error-checks';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { AlertService } from 'src/components/alert/services/alert.service';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import { CreateUserDto } from '../dtos/user.create.dto';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';
import { UserRepository } from './user.repository';
@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
    @Inject(forwardRef(() => AlertService))
    private alertService: AlertService,
    @Inject(forwardRef(() => ExpenseService))
    private expenseService: ExpenseService,
  ) {}

  async create(user: CreateUserDto): Promise<User> {
    const session = await this.userModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      await checkEmailExists(user.email, this.userModel); //email check
      const hashedPassword = await hashPw(user.password); //PW hashing

      const createdUser = new this.userModel({
        //we create new user
        ...user,
        password: hashedPassword,
      });

      const savedUser = await createdUser.save({ session }); //we save user in db

      const defaultCategory = //we create a defaultCategory for user
        await this.categoryRepository.createDefaultCategory(
          savedUser.id,
          session,
        );
      if (!defaultCategory) {
        throw new NotFoundException(`Default category could not be created`);
      }

      savedUser.categories.push(defaultCategory); //we add the category to the array of categories
      await savedUser.save({ session }); // use session here

      await session.commitTransaction();

      return savedUser;
    } catch (error) {
      await session.abortTransaction();
      throw error; // don't return the error, throw it so it can be handled by your error handling middleware
    } finally {
      session.endSession();
    }
  }

  async addCategoryToUser(
    userId: string,
    categoryId: Types.ObjectId,
    session: any,
  ): Promise<void> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $push: { categories: categoryId } })
      .session(session)
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    await checkIdType(id);

    const user = await this.userModel.findById(id).exec();
    await checkUserFound(user, id);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email }).exec();
    await checkEmailFound(user, email);
    return user;
  }

  async update(id: string, userNew: UpdateUserDto): Promise<User> {
    await checkIdType(id);

    if (userNew.email) {
      await checkEmailExists(userNew.email, this.userModel);
    }

    let updatedUser: any = { ...userNew };
    if (userNew.password) {
      updatedUser.password = await hashPw(userNew.password);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updatedUser, { new: true })
      .exec();
    await checkUserFound(user, id);

    return user;
  }

  async delete(id: string): Promise<User> {
    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      await checkIdType(id);

      await this.categoryRepository.deleteAllCategoriesOfUserId(id, session); // Delete all categories of the user
      await this.alertService.deleteAllAlertsOfUserId(id, session);
      await this.expenseService.deleteAllExpensesOfUserId(id, session);

      const user = await this.userModel
        .findByIdAndRemove(id)
        .session(session)
        .exec();
      await checkUserFound(user, id);

      await session.commitTransaction();

      return user;
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.messageerror.message);
      }
    } finally {
      // End the session
      session.endSession();
    }
  }

  async deleteAlertFromUser(
    userId: string,
    alertId: string,
    session: any,
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $pull: { alerts: alertId } })
      .session(session)
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
    return user;
  }

  async deleteCategoryFromUser(
    userId: string,
    categId: string,
    session: any,
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $pull: { categories: categId } })
      .session(session)
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
    return user;
  }

  async deleteExpenseFromUser(
    userId: string,
    expenseId: string,
    session: any,
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $pull: { expenses: expenseId } })
      .session(session)
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
    return user;
  }

  async addExpenseToUser(
    userId: string,
    expenseId: Types.ObjectId,
    session: any,
  ): Promise<void> {
    const user = this.userModel
      .findByIdAndUpdate(userId, { $push: { expenses: expenseId } })
      .session(session)
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
  }

  async addAlertToUser(
    userId: string,
    alertId: Types.ObjectId,
    session: any,
  ): Promise<void> {
    const user = this.userModel
      .findByIdAndUpdate(userId, { $push: { alerts: alertId } })
      .session(session)
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
  }

  async findCategoriesOfUser(userId: string): Promise<Category[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('categories')
      .exec();
    return user.categories;
  }

  async findExpensesOfUser(userId: string): Promise<Expense[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('expenses')
      .exec();
    return user.expenses;
  }

  async findAlertsOfUser(userId: string): Promise<Alert[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('alerts')
      .exec();
    return user.alerts;
  }
}
