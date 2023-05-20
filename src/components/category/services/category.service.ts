import { Inject, Injectable, Logger } from '@nestjs/common';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import {
  CategoryRepositoryToken,
  CategoryRepository,
} from '../repos/category.repository';
import { Category } from '../interfaces/category.interface';
import { User } from 'src/components/user/interfaces/user.interface';
import { UserService } from 'src/components/user/services/user.service';
import { Types } from 'mongoose';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
@Injectable()
export class CategoryService {
  constructor(
    @Inject(CategoryRepositoryToken)
    private CategoryRepository: CategoryRepository,
    private readonly userService: UserService,
  ) {}

  async create(category: Category, userId: string): Promise<Category> {
    Logger.log('CategoryService->userId is: ', userId);
    const createdCategory = await this.CategoryRepository.create(category);
    await this.userService.addCategoryToUser(
      userId,
      new Types.ObjectId(createdCategory.id),
    ); // Method which adds the category ID to the user who created it

    return createdCategory;
  }

  async findAll(): Promise<Category[]> {
    return await this.CategoryRepository.findAll();
  }

  async findOne(id: string): Promise<Category> {
    return await this.CategoryRepository.findOne(id);
  }

  async update(id: string, category: UpdateCategoryDto): Promise<Category> {
    return await this.CategoryRepository.update(id, category);
  }

  async delete(categoryId: string, userId: string): Promise<Category> {
    return await this.CategoryRepository.delete(categoryId, userId);
  }

  // async createDefaultCategory(userId: string): Promise<Category> {
  //   return await this.CategoryRepository.createDefaultCategory(userId);
  // }
}

//after creating new expense, we add it's id to the user
// async addExpenseToCategory(
//   categoryId: string,
//   expenseId: Types.ObjectId,
// ): Promise<void> {
//   await this.CategoryRepository.addExpenseToCategory(categoryId, expenseId);
// }
// //after creating new alert, we add it's id to the user
// async addAlertToCategory(
//   categoryId: string,
//   alertId: Types.ObjectId,
// ): Promise<void> {
//   await this.CategoryRepository.addAlertToCategory(categoryId, alertId);
// }

// //fetch expenses of  a user
// async findExpensesOfCategory(categoryId: string): Promise<Expense[]> {
//   return await this.CategoryRepository.findExpensesOfCategory(categoryId);
// }

// //fetch alerts of  a user
// async findAlertsOfCategory(categoryId: string): Promise<Alert[]> {
//   return await this.CategoryRepository.findAlertsOfCategory(categoryId);
// }
