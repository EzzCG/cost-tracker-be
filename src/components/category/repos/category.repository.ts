import { Expense } from 'src/components/expense/schemas/expense.schema';
import { CreateCategoryDto } from '../dtos/category.create.dto';
import { UpdateCategoryDto } from '../dtos/category.update.dto';
import { Category } from '../schemas/category.schema';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Types } from 'mongoose';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findOne(id: string): Promise<Category>;
  findOneByName(name: string, userId: string, session: any): Promise<string>;
  update(id: string, Category: UpdateCategoryDto): Promise<Category>;
  create(Category: CreateCategoryDto): Promise<Category>;
  delete(categoryId: string, userId: string): Promise<Category>;
  deleteAlertFromCategory(
    alertId: string,
    categoryId: string,
    session: any,
  ): Promise<Category>;
  deleteExpenseFromCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    amount: number,
    date: Date,
    session: any,
  ): Promise<void>
  deleteAllCategoriesOfUserId(userId: string, session: any): Promise<void>;
  createDefaultCategory(userId: string, session: any): Promise<Category>;
  addAlertToCategory(
    categoryId: string,
    alertId: Types.ObjectId,
    session: any,
  ): Promise<void>;
  addExpenseToCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    amount: number,
    date: Date,
    session: any,
  ): Promise<void>;
  updateExpenseInCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    existingAmount: number,
    Updatedamount: number,
    date: Date,
    session: any,
  ): Promise<void>;
  findAlertsOfCategory(categoryId: string): Promise<Alert[]>;
  findExpensesOfCategory(categoryId: string): Promise<Expense[]>;
}

export const CategoryRepositoryToken = Symbol('CategoryRepositoryToken');
