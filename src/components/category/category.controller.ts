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
} from '@nestjs/common';
import { CreateCategoryDto } from './dtos/CreateCategoryDTO';
import { UpdateCategoryDto } from './dtos/UpdateCategoryDTO';
import { CategoryService } from './services/category.service';
import { Category } from './interfaces/category.interface';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { Request } from '@nestjs/common';
import { UserRequest } from '../auth/middleware/user-request.interface';

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

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return await this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Category> {
    return await this.categoryService.delete(id);
  }
}
