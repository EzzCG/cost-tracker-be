import { Injectable, Inject, NotFoundException } from '@nestjs/common';

import { Expense } from '../interfaces/expense.interface';
import { CreateExpenseDto } from '../dtos/CreateExpenseDTO';
import { UpdateExpenseDto } from '../dtos/UpdateExpenseDTO';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'src/components/user/services/user.service';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    private readonly userService: UserService,
  ) {}

  async create(expense: Expense, userId: string): Promise<Expense> {
    const createdExpense = new this.expenseModel(expense);
    await this.userService.addExpenseToUser(
      userId,
      new Types.ObjectId(createdExpense._id),
    ); // Method which adds the category ID to the user who created it

    return createdExpense.save();
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

  async delete(id: string): Promise<Expense> {
    const deletedExpense = await this.expenseModel.findByIdAndRemove(id).exec();
    if (!deletedExpense) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return deletedExpense;
  }
}
