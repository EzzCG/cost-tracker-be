import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  UseGuards,
  Res,
  BadRequestException,
  Req,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dtos/category.create.dto';
import { UpdateCategoryDto } from './dtos/category.update.dto';
import { CategoryService } from './services/category.service';
import { Category } from './interfaces/category.interface';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { Request } from '@nestjs/common';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { Expense } from '../expense/schemas/expense.schema';
import { Alert } from '../alert/schemas/alert.schema.';
import { ExpenseService } from '../expense/services/expense.service';
import { AuthGuard } from './guards/authguard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: UserRequest,
  ): Promise<Category | any> {
    Logger.log('CategoryController->userId is: ', req.userId);

    return await this.categoryService.create(
      {
        ...createCategoryDto,
        userId: req.userId,
      },
      req.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Category[]> {
    return await this.categoryService.findAll();
  }

  @UseGuards(JwtAuthGuard, AuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    // @Request() req: UserRequest,
  ): Promise<Category> {
    const category = await this.categoryService.findOne(id);
    return category;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    // @Request() req: UserRequest,
  ): Promise<Category> {
    return await this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') categoryId: string,
    @Request() req: UserRequest,
  ): Promise<Category> {
    return await this.categoryService.delete(categoryId, req.userId);
  }

  @Get(':id/expenses')
  async findExpensesOfCategory(
    @Param('id') categoryId: string,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    return await this.categoryService.findExpensesOfCategory(categoryId);
  }

  @Get(':id/alerts')
  async findAlertsOfCategory(
    @Param('id') categoryId: string,
    @Request() req: UserRequest,
  ): Promise<Alert[]> {
    return await this.categoryService.findAlertsOfCategory(categoryId);
  }
}
