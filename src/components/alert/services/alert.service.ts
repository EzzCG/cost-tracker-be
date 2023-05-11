import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateExpenseDto } from 'src/components/expense/dtos/UpdateExpenseDTO';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { UserService } from 'src/components/user/services/user.service';
import { Alert } from '../interfaces/alert.interface';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel('Alert') private readonly alertModel: Model<Alert>,
    private readonly userService: UserService,
  ) {}

  async create(alert: Alert, userId: string): Promise<Alert> {
    const createdExpense = new this.alertModel(alert);
    await this.userService.addAlertToUser(
      userId,
      new Types.ObjectId(createdExpense._id),
    ); // Method which adds the category ID to the user who created it

    return createdExpense.save();
  }

  async findAll(): Promise<Alert[]> {
    return await this.alertModel.find().exec();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id).exec();
    if (!alert) {
      throw new NotFoundException(`Expense with ID '${id}' not found`);
    }
    return alert;
  }

  async update(id: string, alertDto: UpdateExpenseDto): Promise<Alert> {
    let updatedAlert: any = { ...alertDto };
    const alert = await this.alertModel
      .findByIdAndUpdate(id, updatedAlert, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!alert) {
      throw new NotFoundException(`Expense with ID '${id}' not found`);
    }

    return alert;
  }

  async delete(id: string): Promise<Alert> {
    const deletedAlert = await this.alertModel.findByIdAndRemove(id).exec();
    if (!deletedAlert) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return deletedAlert;
  }
}
