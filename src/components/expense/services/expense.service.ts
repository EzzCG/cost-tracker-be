import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common';

import { Expense } from '../schemas/expense.schema';
import { CreateExpenseDto } from '../dtos/expense.create.dto';
import { UpdateExpenseDto } from '../dtos/expense.update.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @Inject(UserRepositoryToken) private userRepository: UserRepository,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const session = await this.expenseModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const categoryName = createExpenseDto.category;
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        userId,
        session,
      );
      delete createExpenseDto.category;
      const expense = {
        ...createExpenseDto,
        userId: userId,
        categoryId: categId,
      };
      const createdExpense = new this.expenseModel(expense);

      await this.userRepository.addExpenseToUser(
        userId,
        new Types.ObjectId(createdExpense._id),
        session,
      ); // Method which adds the category ID to the user who created it

      await this.categoryRepository.addExpenseToCategory(
        expense.categoryId,
        new Types.ObjectId(createdExpense._id),
        session,
      );

      await createdExpense.save({ session });
      await session.commitTransaction();
      return createdExpense;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
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
    await this.expenseModel
      .updateMany(
        { categoryId: oldCategoryId },
        { $set: { categoryId: newCategoryId } },
      )
      .session(session);
  }

  async delete(id: string): Promise<Expense> {
    const session = await this.expenseModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const deletedExpense = await this.expenseModel
        .findByIdAndRemove(id)
        .session(session)
        .exec();
      if (!deletedExpense) {
        throw new NotFoundException(`Expense with ID '${id}' not found`);
      }

      await this.userRepository.deleteExpenseFromUser(
        deletedExpense.userId,
        id,
        session,
      );

      await this.categoryRepository.deleteExpenseFromCategory(
        id,
        deletedExpense.categoryId,
        session,
      );

      await session.commitTransaction();
      return deletedExpense;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      session.endSession();
    }
  }

  async deleteAllExpensesOfUserId(userId: string, session: any): Promise<void> {
    await this.expenseModel
      .deleteMany({ userId: userId })
      .session(session)
      .exec();
  }
}
