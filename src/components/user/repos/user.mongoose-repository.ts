import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  checkIdType,
  checkEmailExists,
  checkUserFound,
  checkEmailFound,
  hashPw,
} from './user.error-checks';

import { UserRepository } from './user.repository';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, startSession } from 'mongoose';
import { CreateUserDto } from '../dtos/user.create.dto';
import * as bcrypt from 'bcrypt';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { CategoryService } from 'src/components/category/services/category.service';
import { MongooseCategoryRepository } from 'src/components/category/repos/category.mongoose-repository';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
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
      // Logger.log('defaultCategory');

      savedUser.categories.push(defaultCategory); //we add the category to the array of categories
      await savedUser.save({ session }); // use session here
      // Logger.log('added default to user');

      await session.commitTransaction();
      // Logger.log('commit transaction');

      return savedUser;
    } catch (error) {
      // Logger.log('Caught error, aborting transaction', error);
      await session.abortTransaction();
      throw error; // don't return the error, throw it so it can be handled by your error handling middleware
    } finally {
      session.endSession();
      // Logger.log('Ended session');
    }
  }

  async addCategoryToUser(
    userId: string,
    categoryId: Types.ObjectId,
  ): Promise<void> {
    Logger.log('addCategoryToUser-> userId: ', userId);
    Logger.log('addCategoryToUser-> categoryId: ', categoryId);
    await this.userModel
      .findByIdAndUpdate(userId, { $push: { categories: categoryId } })
      .exec();
    Logger.log('addCategoryToUser-> END: ');
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

      await this.categoryRepository.deleteAllByUserId(id, session); // Delete all categories of the user

      const user = await this.userModel.findByIdAndRemove(id).exec();
      await checkUserFound(user, id);

      await session.commitTransaction();

      return user;
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  }

  async addExpenseToUser(
    userId: string,
    expenseId: Types.ObjectId,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { $push: { expenses: expenseId } })
      .exec();
  }

  async addAlertToUser(userId: string, alertId: Types.ObjectId): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { $push: { alerts: alertId } })
      .exec();
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
