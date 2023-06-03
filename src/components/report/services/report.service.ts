import { Injectable } from '@nestjs/common';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import { CreateReportDto } from '../dtos/report.create.dto';
import { AlertService } from 'src/components/alert/services/alert.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly alertService: AlertService,
  ) {}

  async getOverview(
    createReportDto: CreateReportDto,
    userId: string,
  ): Promise<Expense[]> {
    return await this.expenseService.getOverview(
      createReportDto.month,
      createReportDto.year,
      userId,
    );
  }

  async getCategories(
    createReportDto: CreateReportDto,
    userId: string,
  ): Promise<Expense[]> {
    return await this.expenseService.getCategories(
      createReportDto.month,
      createReportDto.year,
      userId,
    );
  }

  async getAlerts(
    createReportDto: CreateReportDto,
    userId: string,
  ): Promise<Expense[]> {
    return await this.alertService.getAlerts(
      createReportDto.month,
      createReportDto.year,
      userId,
    );
  }
}
