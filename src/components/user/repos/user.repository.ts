import { Types } from 'mongoose';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { CreateUserDto } from '../dtos/user.create.dto';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findOne(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  create(user: CreateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
  deleteAlertFromUser(
    userId: string,
    alertId: string,
    session: any,
  ): Promise<User>;
  deleteCategoryFromUser(
    userId: string,
    catgId: string,
    session: any,
  ): Promise<User>;
  deleteExpenseFromUser(
    userId: string,
    expenseId: string,
    session: any,
  ): Promise<User>;
  addCategoryToUser(
    userId: string,
    categoryId: Types.ObjectId,
    session: any,
  ): Promise<void>;
  addExpenseToUser(
    userId: string,
    categoryId: Types.ObjectId,
    session: any,
  ): Promise<void>;
  addAlertToUser(
    userId: string,
    categoryId: Types.ObjectId,
    session: any,
  ): Promise<void>;
  findCategoriesOfUser(userId: string): Promise<Category[]>;
  findExpensesOfUser(userId: string): Promise<Expense[]>;
  findAlertsOfUser(userId: string): Promise<Alert[]>;
}

export const UserRepositoryToken = Symbol('UserRepositoyToken');
