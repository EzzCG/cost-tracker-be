import { Injectable, Inject, NotFoundException } from '@nestjs/common';

import { Expense } from '../schemas/expense.schema';
import { CreateExpenseDto } from '../dtos/CreateExpenseDTO';
import { UpdateExpenseDto } from '../dtos/UpdateExpenseDTO';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @Inject(UserRepositoryToken) private userRepository: UserRepository,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const session = await this.expenseModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const createdExpense = new this.expenseModel(createExpenseDto);
      await this.userRepository.addExpenseToUser(
        userId,
        new Types.ObjectId(createdExpense._id),
        session,
      ); // Method which adds the category ID to the user who created it

      await createdExpense.save();
      await session.commitTransaction();
      return createdExpense;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(): Promise<Expense[]> {
    return await this.expenseModel.find().exec();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID '${id}' not found`);
    }
    return expense;
  }

  async findAllExpensesOfCategory(categoryId: string): Promise<Expense[]> {
    const expenses = await this.expenseModel
      .find({ categoryId: categoryId })
      .exec();
    if (!expenses) {
      throw new NotFoundException(
        `No expenses found for category with id ${categoryId}`,
      );
    }

    return expenses;
  }

  async update(id: string, expenseDto: UpdateExpenseDto): Promise<Expense> {
    let updatedExpense: any = { ...expenseDto };
    const expense = await this.expenseModel
      .findByIdAndUpdate(id, updatedExpense, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!expense) {
      throw new NotFoundException(`Expense with ID '${id}' not found`);
    }

    return expense;
  }

  async updateToUnCategorized(
    oldCategoryId: string,
    newCategoryId: string,
    session: any,
  ): Promise<void> {
    await this.expenseModel.updateMany(
      { categoryId: oldCategoryId },
      { $set: { categoryId: newCategoryId } },
      { session },
    );
  }

  async delete(id: string): Promise<Expense> {
    const deletedExpense = await this.expenseModel.findByIdAndRemove(id).exec();
    if (!deletedExpense) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return deletedExpense;
  }
}
