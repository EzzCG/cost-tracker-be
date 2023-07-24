import { Inject, Injectable, Logger } from '@nestjs/common';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { UserService } from 'src/components/user/services/user.service';
import { UpdateCategoryDto } from '../dtos/category.update.dto';
import { Category } from '../interfaces/category.interface';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from '../repos/category.repository';
@Injectable()
export class CategoryService {
  constructor(
    @Inject(CategoryRepositoryToken)
    private CategoryRepository: CategoryRepository,
    private readonly userService: UserService,
  ) {}

  async create(category: Category, userId: string): Promise<Category> {
    Logger.log('CategoryService->userId is: ', userId);
    const createdCategory = await this.CategoryRepository.create(category);

    return createdCategory;
  }

  async findAll(): Promise<Category[]> {
    return await this.CategoryRepository.findAll();
  }

  async findOne(id: string): Promise<Category> {
    return await this.CategoryRepository.findOne(id);
  }

  async update(id: string, category: UpdateCategoryDto): Promise<Category> {
    return await this.CategoryRepository.update(id, category);
  }

  async delete(categoryId: string, userId: string): Promise<Category> {
    return await this.CategoryRepository.delete(categoryId, userId);
  }

  //fetch alerts of  a user
  async findAlertsOfCategory(categoryId: string): Promise<Alert[]> {
    return await this.CategoryRepository.findAlertsOfCategory(categoryId);
  }

  async findExpensesOfCategory(categoryId: string): Promise<Expense[]> {
    return await this.CategoryRepository.findExpensesOfCategory(categoryId);
  }
}
