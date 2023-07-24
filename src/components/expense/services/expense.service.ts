import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model, Types } from 'mongoose';
import { CreateAttachmentDto } from 'src/components/attachment/dtos/attachment.create.dto';
import { AttachmentService } from 'src/components/attachment/services/attachment.service';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import { CreateExpenseDto } from '../dtos/expense.create.dto';
import { UpdateExpenseDto } from '../dtos/expense.update.dto';
import { Expense } from '../schemas/expense.schema';

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
    newAttachment: CreateAttachmentDto | null,
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
        attachment: null, // we start off with a null attachment
      };

      const createdExpense = new this.expenseModel(expense);

      //if there is an attachment
      if (newAttachment) {
        console.log('newAttachment: ', newAttachment);
        newAttachment.expenseId = createdExpense._id; //we set the expenseId to the attachment

        //we create the attachment
        const createdAttachment = await this.attachmentService.create(
          newAttachment,
        );

        //we update the expenseId of the newly created attachment
        await this.attachmentService.updateExpenseId(
          createdAttachment.id,
          createdExpense.id,
        );

        // we update the attachment id of the expense
        createdExpense.attachment = createdAttachment._id; // add the attachment id to the expense
        await createdExpense.save({ session });
      }

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
    Logger.log('dto month zzz: ', month);
    Logger.log('dto month zzz: ', year);

    const startDate = new Date(year, month - 1); // month starts at zero, so dec is 0
    const endDate =
      month == 12 ? new Date(+year + 1, 0) : new Date(year, month % 12); // month % 12 will give 0 for December

    Logger.log('startDate: ', startDate);
    Logger.log('endDate: ', endDate);

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
    const startDate = new Date(year, month - 1); // month starts at zero, so dec is 0
    const endDate =
      month == 12 ? new Date(+year + 1, 0) : new Date(year, month % 12); // month % 12 will give 0 for December

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

  async update(
    id: string,
    expenseDto: UpdateExpenseDto,
    userId: string,
    newAttachment: CreateAttachmentDto | null,
  ): Promise<Expense> {
    const session = await this.expenseModel.db.startSession();
    session.startTransaction();
    // check if the category has been changed

    try {
      const existingExpense = await this.expenseModel.findById(id).exec();
      if (!existingExpense) {
        throw new NotFoundException(`Expense with ID '${id}' not found`);
      }
      // Check if the user has permissions to update the expense
      if (existingExpense.userId !== userId) {
        throw new UnauthorizedException(
          'You do not have permission to update this expense',
        );
      }

      // const { attachment } = existingExpense; // we destruct the attachment property from the expense object

      //if there is an attachment
      if (newAttachment) {
        console.log('newAttachment: ', newAttachment);
        newAttachment.expenseId = existingExpense._id; //we set the expenseId to the attachment

        //we create the attachment
        const createdAttachment = await this.attachmentService.create(
          newAttachment,
        );

        //we update the expenseId of the newly created attachment
        await this.attachmentService.updateExpenseId(
          createdAttachment.id,
          existingExpense.id,
        );

        // we update the attachment id of the expense
        existingExpense.attachment = createdAttachment._id; // add the attachment id to the expense
      }
      //we have the categoryName but we need the category Id
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
        attachment: newAttachment
          ? existingExpense.attachment
          : expenseDto.attachment,
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

      if (existingExpense.categoryId !== expense.categoryId) {
        // remove the expense from the old category and deduct from current value if its in the same month/year of today
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
        console.log('deletedExpense.attachment: ', deletedExpense.attachment);
        await this.attachmentService.deleteAttachmentOfExpense(
          deletedExpense.attachment.toString(),
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
    console.log('removeAttachmentFromExpense: ', expense);

    await expense.save();
  }

  async deleteAttachmentFile(
    storageLocation: string,
    session: any,
  ): Promise<void> {
    try {
      fs.unlinkSync(storageLocation); // Delete the file in storage location
    } catch (error) {
      // Handle error appropriately
      console.error(error);
    }
  }
}
//   async findAttachmentOfExpense(expenseId: string): Promise<Attachment> {
//   const expense2 = await this.expenseModel.findById(expenseId).exec();
//   if (!expense2) {
//     throw new NotFoundException(`Expense with ID '${expenseId}' not found`);
//   }
//   expense2.populate('attachment');

//   const expense = await this.expenseModel
//     .findById(expenseId)
//     .populate('attachment')
//     .exec();

//   if (!expense) {
//     throw new NotFoundException(`Expense with id '${expenseId}' not found`);
//   }

//   if (!expense.attachment) {
//     throw new NotFoundException(
//       `Expense with id ${expenseId} doesn't have an attachment`,
//     );
//   }
//   return expense.attachment;
// }
