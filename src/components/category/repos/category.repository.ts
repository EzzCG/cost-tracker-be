import { Expense } from 'src/components/expense/schemas/expense.schema';
import { CreateCategoryDto } from '../dtos/CreateCategoryDTO';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import { Category } from '../schemas/category.schema';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Types } from 'mongoose';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findOne(id: string): Promise<Category>;
  findOneByName(name: string, userId: string): Promise<string>;
  update(id: string, Category: UpdateCategoryDto): Promise<Category>;
  create(Category: CreateCategoryDto): Promise<Category>;
  delete(categoryId: string, userId: string): Promise<Category>;
  deleteAlertFromCategory(
    alertId: string,
    categoryId: string,
    session: any,
  ): Promise<Category>;
  deleteAllCategoriesOfUserId(userId: string, session: any): Promise<void>;
  createDefaultCategory(userId: string, session: any): Promise<Category>;
  addAlertToCategory(
    categoryId: string,
    alertId: Types.ObjectId,
    session: any,
  ): Promise<void>;
  findAlertsOfCategory(categoryId: string): Promise<Alert[]>;
}

export const CategoryRepositoryToken = Symbol('CategoryRepositoryToken');

/*
  // addExpenseToCategory(
  //   categoryId: string,
  //   expenseId: Types.ObjectId,
  // ): Promise<void>;
  // addAlertToCategory(
  //   categoryId: string,
  //   alertId: Types.ObjectId,
  // ): Promise<void>;*/
// findExpensesOfCategory(categoryId: string): Promise<Expense[]>;
// findAlertsOfCategory(categoryId: string): Promise<Alert[]>;
