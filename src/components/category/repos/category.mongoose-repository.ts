import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Req,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
// import {
//   checkIdType,
//   checkUserFound,
//   checkEmailFound,
//   hashPw,
// } from './user.error-checks';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from '../dtos/category.update.dto';
import { CreateCategoryDto } from '../dtos/category.create.dto';
import { Category } from '../schemas/category.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import { create } from 'domain';
import { async } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { AlertService } from 'src/components/alert/services/alert.service';

@Injectable()
export class MongooseCategoryRepository implements CategoryRepository {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @Inject(forwardRef(() => ExpenseService))
    private expenseService: ExpenseService,
    @Inject(forwardRef(() => UserRepositoryToken))
    private userRepository: UserRepository,
    @Inject(forwardRef(() => AlertService))
    private alertService: AlertService,
  ) {}

  async create(categoryDto: Category): Promise<Category> {
    const session = await this.categoryModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    Logger.log('CategoryRepo->categoryDto is: ', categoryDto);

    const createdCategory = new this.categoryModel(categoryDto);
    //we check not to create a category with the same name
    try {
      await this.userRepository.addCategoryToUser(
        createdCategory.userId,
        new Types.ObjectId(createdCategory.id),
        session,
      ); // Method which adds the category ID to the user who created it
      await createdCategory.save({ session });

      await session.commitTransaction();

      return createdCategory;
    } catch (error) {
      if (error.code === 11000) {
        await session.abortTransaction();
        throw new ConflictException(
          'You already have a category with the name ' + createdCategory.name,
        );
        throw error;
      }
    } finally {
      session.endSession();
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return category;
  }
  @UseGuards(AuthGuard)
  async findOneByName(name: string, userId: string): Promise<string> {
    const category = await this.categoryModel
      .findOne({ name: name, userId: userId })
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with name '${name}' not found`);
    }
    return category._id;
  }

  async update(id: string, categoryDto: UpdateCategoryDto): Promise<Category> {
    let updatedCategory: any = { ...categoryDto };
    const category = await this.categoryModel
      .findByIdAndUpdate(id, updatedCategory, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  async delete(categoryId: string, userId: string): Promise<Category> {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const deletedCategory = await this.categoryModel
        .findByIdAndRemove(categoryId, { session })
        .exec();
      if (!deletedCategory) {
        throw new NotFoundException(
          `Category with ID '${categoryId}' not found`,
        );
      }

      // //we find the defaultCategory of the user
      // const defaultCategory = await this.categoryModel.findOne({
      //   userId: userId,
      //   name: 'Uncategorized',
      // });

      // // find all expenses with the category to be deleted
      // const expenses = await this.expenseService.findAllExpensesOfCategory(
      //   categoryId,
      // );

      // if (expenses.length > 0) {
      //   await this.expenseService.updateToUnCategorized(
      //     categoryId,
      //     defaultCategory.id,
      //     session,
      //   );
      // }

      await this.userRepository.deleteCategoryFromUser(
        userId,
        deletedCategory.id,
        session,
      );

      const deletedAlertIds =
        await this.alertService.deleteAllAlertsOfCategoryId(
          deletedCategory.id,
          session,
        );

      for (const alertId of deletedAlertIds) {
        await this.userRepository.deleteAlertFromUser(userId, alertId, session);
      }
      await session.commitTransaction();

      return deletedCategory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteAllCategoriesOfUserId(
    userId: string,
    session: any,
  ): Promise<void> {
    await this.categoryModel
      .deleteMany({ userId: userId })
      .session(session)
      .exec();
  }

  async deleteAlertFromCategory(
    alertId: string,
    categoryId: string,
    session: any,
  ): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $pull: { alerts: alertId } },
        { session },
      )
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }
    return category;
  }

  async createDefaultCategory(userId: string, session: any): Promise<Category> {
    Logger.log('createDefaultCategory-> userId: ', userId);
    const defaultCategory = new this.categoryModel({
      userId: userId,
      name: 'uncategorized',
      maxValue: 0,
      minValue: 0,
    });
    Logger.log('createDefaultCategory-> defaultCategory: ', defaultCategory);
    // this.userRepository.addCategoryToUser(userId, defaultCategory._id);

    return await defaultCategory.save({ session }); // use session
  }

  async addAlertToCategory(
    categoryId: string,
    alertId: Types.ObjectId,
    session: any,
  ): Promise<void> {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $push: { alerts: alertId } },
        { session },
      )
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }
  }

  async findAlertsOfCategory(categoryId: string): Promise<Alert[]> {
    const category = await this.categoryModel
      .findById(categoryId)
      .populate('alerts')
      .exec();
    return category.alerts;
  }
}

// async addExpenseToCategory(
//   categoryId: string,
//   expenseId: Types.ObjectId,
// ): Promise<void> {
//   await this.categoryModel
//     .findByIdAndUpdate(categoryId, { $push: { expenses: expenseId } })
//     .exec();
// }

// async addAlertToCategory(
//   categoryId: string,
//   alertId: Types.ObjectId,
// ): Promise<void> {
//   await this.categoryModel
//     .findByIdAndUpdate(categoryId, { $push: { alerts: alertId } })
//     .exec();
// }

// async findExpensesOfCategory(categoryId: string): Promise<Expense[]> {
//   const category = await this.categoryModel
//     .findById(categoryId)
//     .populate('expenses')
//     .exec();
//   return category.expenses;
// }

// async findAlertsOfCategory(categoryId: string): Promise<Alert[]> {
//   const category = await this.categoryModel
//     .findById(categoryId)
//     .populate('alerts')
//     .exec();
//   return category.alerts;
// }
