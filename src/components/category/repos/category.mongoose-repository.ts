import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Req,
  forwardRef,
} from '@nestjs/common';
// import {
//   checkIdType,
//   checkUserFound,
//   checkEmailFound,
//   hashPw,
// } from './user.error-checks';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import { CreateCategoryDto } from '../dtos/CreateCategoryDTO';
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

@Injectable()
export class MongooseCategoryRepository implements CategoryRepository {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @Inject(forwardRef(() => ExpenseService))
    private expenseService: ExpenseService,
    @Inject(forwardRef(() => UserRepositoryToken))
    private userRepository: UserRepository,
  ) {}

  async create(categoryDto: Category): Promise<Category> {
    Logger.log('CategoryRepo->categoryDto is: ', categoryDto);

    const createdCategory = new this.categoryModel(categoryDto);
    //we check not to create a category with the same name
    try {
      return await createdCategory.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'You already have a category with this name.',
        );
      }
      throw error;
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
    //we find the defaultCategory of the user
    const defaultCategory = await this.categoryModel.findOne({
      userId: userId,
      name: 'Uncategorized',
    });

    const deletedCategory = await this.categoryModel
      .findByIdAndRemove(categoryId)
      .exec();
    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }

    // find all expenses with the category to be deleted
    const expenses = await this.expenseService.findAllExpensesOfCategory(
      categoryId,
    );

    if (expenses.length > 0) {
      await this.expenseService.updateToUnCategorized(
        categoryId,
        defaultCategory.id,
      );
    }

    return deletedCategory;
  }

  async deleteAllByUserId(userId: string, session: any): Promise<void> {
    await this.categoryModel
      .deleteMany({ userId: userId })
      .session(session)
      .exec();
  }

  async createDefaultCategory(userId: string, session: any): Promise<Category> {
    Logger.log('createDefaultCategory-> userId: ', userId);
    const defaultCategory = new this.categoryModel({
      userId: userId,
      name: 'Uncategorized',
      maxValue: 0,
      minValue: 0,
    });
    Logger.log('createDefaultCategory-> defaultCategory: ', defaultCategory);
    // this.userRepository.addCategoryToUser(userId, defaultCategory._id);

    return await defaultCategory.save({ session }); // use session
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
