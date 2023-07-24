import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as cron from 'node-cron';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { AlertService } from 'src/components/alert/services/alert.service';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import { isInCurrentMonthYear } from 'src/shared/helper-functions';
import { UpdateCategoryDto } from '../dtos/category.update.dto';
import { Category } from '../schemas/category.schema';
import { CategoryRepository } from './category.repository';

@Injectable()
export class MongooseCategoryRepository implements CategoryRepository {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @Inject(forwardRef(() => ExpenseService))
    private expenseService: ExpenseService,
    @Inject(forwardRef(() => UserRepositoryToken))
    private userRepository: UserRepository,
    @Inject(forwardRef(() => AlertService))
    private alertService: AlertService,
  ) {
    cron.schedule('* * 1 * *', this.resetAllCategoryValues.bind(this));
  }
  //a function that  resets all the categories current_value to 0
  async resetAllCategoryValues(): Promise<void> {
    const categories = await this.categoryModel.updateMany(
      {},
      { $set: { current_value: 0 } },
    );
  }

  async create(categoryDto: Category): Promise<Category> {
    const session = await this.categoryModel.db.startSession(); //we start a session here of dif queries
    session.startTransaction(); //incase of an error, all queries, won't take effect

    Logger.log('CategoryRepo->categoryDto is: ', categoryDto);

    const createdCategory = new this.categoryModel(categoryDto);
    //we check not to create a category with the same name
    try {
      await this.userRepository.addCategoryToUser(
        createdCategory.userId,
        new Types.ObjectId(createdCategory.id),
        session,
      ); // Method which adds the category ID to the user who created it
      await createdCategory.save({ session });

      await session.commitTransaction();

      return createdCategory;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error.code === 11000) {
        throw new ConflictException(
          'You already have a category with the name ' + createdCategory.name,
        );
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      session.endSession();
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
  async findOneByName(
    name: string,
    userId: string,
    session: any,
  ): Promise<string> {
    try {
      const category = await this.categoryModel
        .findOne({ name: name, userId: userId })
        .session(session)
        .exec();

      // Logger.log(`findOneByName->category: ${category}`);

      if (!category) {
        throw new NotFoundException(`Category with name '${name}' not found`);
      }
      return category.id;
    } catch (error) {
      Logger.error('Error in findOneByName:', error);
      throw error;
    }
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
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      Logger.log('delete: ');

      const deletedCategory = await this.categoryModel
        .findByIdAndRemove(categoryId)
        .session(session)
        .exec();
      if (!deletedCategory) {
        throw new NotFoundException(
          `Category with ID '${categoryId}' not found`,
        );
      }
      Logger.log('deletedCategory: ' + deletedCategory);

      //we find the defaultCategory of the user
      const defaultCategory = await this.categoryModel
        .findOne({
          userId: userId,
          name: 'uncategorized',
        })
        .session(session);

      Logger.log('defaultCatg: ' + defaultCategory);
      const expenses = await this.findExpensesOfCategory(categoryId);
      Logger.log('expenses: ' + expenses);

      if (expenses.length > 0) {
        await this.expenseService.updateToUnCategorized(
          categoryId,
          defaultCategory.id,
          session,
        );

        defaultCategory.expenses = defaultCategory.expenses.concat(expenses); // Add expenses to uncategorized category
        defaultCategory.current_value += deletedCategory.current_value; //add the deletecCategory.current_value
        await defaultCategory.save({ session });
      }

      await this.userRepository.deleteCategoryFromUser(
        userId,
        deletedCategory.id,
        session,
      );

      const deletedAlertIds =
        await this.alertService.deleteAllAlertsOfCategoryId(
          deletedCategory.id,
          session,
        );

      for (const alertId of deletedAlertIds) {
        await this.userRepository.deleteAlertFromUser(userId, alertId, session);
      }
      await session.commitTransaction();

      return deletedCategory;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteAllCategoriesOfUserId(
    userId: string,
    session: any,
  ): Promise<void> {
    await this.categoryModel
      .deleteMany({ userId: userId })
      .session(session)
      .exec();
  }

  async deleteAlertFromCategory(
    alertId: string,
    categoryId: string,
    session: any,
  ): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, { $pull: { alerts: alertId } })
      .session(session)
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }
    return category;
  }

  async deleteExpenseFromCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    amount: number,
    date: Date,
    session: any,
  ): Promise<void> {
    // Logger.log('deleteExpenseFromCategory :');
    // Logger.log('categoryId :', categoryId);
    // Logger.log('expenseId :', expenseId);
    // Logger.log('amount :', amount);
    // Logger.log('date :', date);

    let updateObject = { $pull: { expenses: expenseId } };
    let updated: boolean = false;
    let deducted = 0;

    // Only decrement current_value if the year and month are the same
    if (isInCurrentMonthYear(date)) {
      updateObject['$inc'] = { current_value: -amount };
      deducted = -amount;
      updated = true;
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, updateObject)
      .session(session)
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }
    let catgNewVal = category.current_value - amount;

    await this.alertService.reevaluateAlerts(category, catgNewVal, session);
  }

  //if expense date gets updated
  async updateExpenseInCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    existingAmount: number,
    Updatedamount: number,
    date: Date,
    session: any,
  ): Promise<void> {
    let updateObject: any;
    let updated: boolean = false;

    // Only decrement current_value if the year and month are the same
    if (isInCurrentMonthYear(date)) {
      updateObject['$inc'] = { current_value: -existingAmount + Updatedamount };
      updated = true;
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, updateObject)
      .session(session)
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }

    let catgNewVal = category.current_value - existingAmount + Updatedamount;

    await this.alertService.reevaluateAlerts(category, catgNewVal, session);
  }
  async createDefaultCategory(userId: string, session: any): Promise<Category> {
    Logger.log('createDefaultCategory-> userId: ', userId);
    const defaultCategory = new this.categoryModel({
      userId: userId,
      name: 'uncategorized',
      maxValue: 0,
      minValue: 0,
    });
    Logger.log('createDefaultCategory-> defaultCategory: ', defaultCategory);
    // this.userRepository.addCategoryToUser(userId, defaultCategory._id);

    return await defaultCategory.save({ session });
  }

  async addAlertToCategory(
    categoryId: string,
    alertId: Types.ObjectId,
    session: any,
  ): Promise<void> {
    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, { $push: { alerts: alertId } })
      .session(session)
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }
    await this.alertService.reevaluateAlerts(
      category,
      category.current_value,
      session,
    );
  }

  async addExpenseToCategory(
    categoryId: string,
    expenseId: Types.ObjectId,
    amount: number,
    date: Date,
    session: any,
  ): Promise<void> {
    // Logger.log('addExpenseToCategory :');
    // Logger.log('categoryId :', categoryId);
    // Logger.log('expenseId :', expenseId);
    // Logger.log('amount :', amount);
    // Logger.log('date :', date);
    let updateObject = {
      $push: { expenses: expenseId },
    };

    let updated: boolean = false;
    // Only increment current_value if the year and month are the same
    if (isInCurrentMonthYear(date)) {
      updateObject['$inc'] = { current_value: amount };
      updated = true;
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(categoryId, updateObject)
      .session(session)
      .exec();

    let catgNewVal = amount + category.current_value;

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }

    await this.alertService.reevaluateAlerts(category, catgNewVal, session);
  }

  async findAlertsOfCategory(categoryId: string): Promise<Alert[]> {
    const category = await this.categoryModel
      .findById(categoryId)
      .populate('alerts')
      .exec();
    return category.alerts;
  }

  async findExpensesOfCategory(categoryId: string): Promise<Expense[]> {
    const category = await this.categoryModel
      .findById(categoryId)
      .populate('expenses')
      .exec();
    return category.expenses;
  }
}
