import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateExpenseDto } from './dtos/CreateExpenseDTO';
import { UpdateExpenseDto } from './dtos/UpdateExpenseDTO';
import { Expense } from './interfaces/expense.interface';
import { ExpenseService } from './services/expense.service';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: UserRequest,
  ): Promise<Expense | any> {
    const createdExpense = await this.expenseService.create(
      createExpenseDto,
      req.userId,
    );
    return createdExpense;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Expense[]> {
    return await this.expenseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return await this.expenseService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    return await this.expenseService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Expense> {
    return await this.expenseService.delete(id);
  }
}
