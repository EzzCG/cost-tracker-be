import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { Expense } from '../schemas/expense.schema';
import { CreateExpenseDto } from '../dtos/expense.create.dto';
import { UpdateExpenseDto } from '../dtos/expense.update.dto';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
import { Attachment } from 'src/components/attachment/schemas/attachment.schema';
import { AttachmentService } from 'src/components/attachment/services/attachment.service';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @Inject(UserRepositoryToken) private userRepository: UserRepository,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
    @Inject(forwardRef(() => AttachmentService))
    private attachmentService: AttachmentService,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const session = await this.expenseModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    try {
      const categoryName = createExpenseDto.categoryId;
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        userId,
        session,
      );
      delete createExpenseDto.categoryId;

      const dateInstance = new Date(createExpenseDto.date);
      delete createExpenseDto.date;
      const expense = {
        ...createExpenseDto,
        date: dateInstance,
        userId: userId,
        categoryId: categId,
      };
      const createdExpense = new this.expenseModel(expense);

      await this.userRepository.addExpenseToUser(
        userId,
        new Types.ObjectId(createdExpense.id),
        session,
      ); // Method which adds the expense ID to the user who created it

      await this.categoryRepository.addExpenseToCategory(
        expense.categoryId,
        new Types.ObjectId(createdExpense.id),
        createdExpense.amount,
        createdExpense.date,
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

  async getOverview(
    month: number,
    year: number,
    userId: string,
  ): Promise<Expense[]> {
    const startDate = new Date(month + '/01/' + year);
    const endMonth = month == 12 ? 1 : month + 1; //if conditon incase of dec
    const endDate = new Date(endMonth + '/01/' + year);

    const expenses = await this.expenseModel.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$categoryId' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
          as: 'categoryData',
        },
      },
      {
        $unwind: '$categoryData',
      },
      {
        $project: {
          _id: 0,
          date: { $dateToString: { format: '%d-%m-%Y', date: '$date' } },
          concept: '$concept',
          category: '$categoryData.name',
          totalAmount: '$amount',
        },
      },
    ]);

    return expenses;
  }

  async getCategories(
    month: number,
    year: number,
    userId: string,
  ): Promise<Expense[]> {
    const startDate = new Date(month + '/01/' + year);
    const endMonth = month == 12 ? 1 : month + 1; //if conditon incase of dec
    const endDate = new Date(endMonth + '/01/' + year);

    const expenses = await this.expenseModel.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$categoryId' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
          as: 'categoryData',
        },
      },
      {
        $unwind: '$categoryData',
      },
      {
        $group: {
          _id: '$categoryData.name',
          total: { $sum: '$amount' },
          min: { $first: '$categoryData.minValue' },
          max: { $first: '$categoryData.maxValue' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalAmount: '$total',
          min: '$min',
          max: '$max',
          status: {
            $cond: {
              if: { $gt: ['$total', '$max'] },
              then: 'Exceeding',
              else: {
                $cond: {
                  if: { $lt: ['$total', '$min'] },
                  then: 'Saving',
                  else: 'Within Limit',
                },
              },
            },
          },
        },
      },
    ]);

    return expenses;
  }

  async update(id: string, expenseDto: UpdateExpenseDto): Promise<Expense> {
    const session = await this.expenseModel.db.startSession();
    session.startTransaction();
    // check if the category has been changed

    try {
      const existingExpense = await this.expenseModel.findById(id).exec();
      if (!existingExpense) {
        throw new NotFoundException(`Expense with ID '${id}' not found`);
      }

      const categoryName = expenseDto.categoryId;
      const categId = await this.categoryRepository.findOneByName(
        categoryName,
        existingExpense.userId,
        session,
      );
      delete expenseDto.categoryId;

      const dateInstance = new Date(expenseDto.date);
      delete expenseDto.date;
      const updatedExpense = {
        ...expenseDto,
        date: dateInstance,
        userId: existingExpense.userId,
        categoryId: categId,
      };

      const expense = await this.expenseModel
        .findByIdAndUpdate(id, updatedExpense, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!expense) {
        throw new NotFoundException(`Expense with ID '${id}' not found`);
      }

      Logger.log('expense :', expense);
      Logger.log('existingExpense :', existingExpense);

      if (existingExpense.categoryId !== expense.categoryId) {
        // remove the expense from the old category and deduct from current value if its in the same month/year of today
        Logger.log('we inside if :');

        await this.categoryRepository.deleteExpenseFromCategory(
          existingExpense.categoryId,
          new Types.ObjectId(id),
          existingExpense.amount,
          existingExpense.date,
          session,
        );

        // add the expense to the new category and add to current value if its in the same month/year of today
        await this.categoryRepository.addExpenseToCategory(
          expense.categoryId,
          new Types.ObjectId(id),
          expense.amount,
          expense.date,
          session,
        );
      } else {
        await this.categoryRepository.updateExpenseInCategory(
          expense.categoryId,
          new Types.ObjectId(id),
          existingExpense.amount,
          expense.amount,
          expense.date,
          session,
        );
      }

      await session.commitTransaction();
      return expense;
    } catch (error) {
      // if anything goes wrong, undo any changes made in the database
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    Logger.log('id: ', id);
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
      Logger.log('deletedExpense: ', deletedExpense);

      await this.userRepository.deleteExpenseFromUser(
        deletedExpense.userId,
        id,
        session,
      );

      await this.categoryRepository.deleteExpenseFromCategory(
        deletedExpense.categoryId,
        new Types.ObjectId(id),
        deletedExpense.amount,
        deletedExpense.date,
        session,
      );

      //if there's an attachment, we delete it too
      if (deletedExpense.attachment) {
        await this.attachmentService.deleteAttachmentOfExpense(
          deletedExpense.attachment.id,
          session,
        );
      }

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

  async removeAttachmentFromExpense(
    expenseId: string,
    session: any,
  ): Promise<void> {
    const expense = await this.expenseModel
      .findById(expenseId)
      .session(session);
    if (!expense) {
      throw new NotFoundException(`Expense with id '${expenseId}' not found`);
    }

    expense.attachment = null;
    await expense.save();
  }

  async addAttachmentToExpense(
    expenseId: string,
    attachment: Attachment,
    session: any,
  ): Promise<void> {
    const expense = await this.expenseModel
      .findById(expenseId)
      .session(session);

    if (!expense) {
      throw new NotFoundException(`Expense with id '${expenseId}' not found`);
    }

    expense.attachment = attachment;
    await expense.save();
  }

  async findAttachmentOfExpense(expenseId: string): Promise<Attachment> {
    const expense2 = await this.expenseModel.findById(expenseId).exec();
    if (!expense2) {
      throw new NotFoundException(`Expense with ID '${expenseId}' not found`);
    }
    expense2.populate('attachment');

    const expense = await this.expenseModel
      .findById(expenseId)
      .populate('attachment')
      .exec();

    if (!expense) {
      throw new NotFoundException(`Expense with id '${expenseId}' not found`);
    }

    if (!expense.attachment) {
      throw new NotFoundException(
        `Expense with id ${expenseId} doesn't have an attachment`,
      );
    }
    return expense.attachment;
  }
}
