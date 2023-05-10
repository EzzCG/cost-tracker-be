import { Inject, Injectable, Logger } from '@nestjs/common';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import {
  CategoryRepositoryToken,
  CategoryRepository,
} from '../repos/category.repository';
import { Category } from '../interfaces/category.interface';
import { User } from 'src/components/user/interfaces/user.interface';
import { UserService } from 'src/components/user/services/user.service';
import { Types } from 'mongoose';
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
    await this.userService.addCategoryToUser(
      userId,
      new Types.ObjectId(createdCategory.id),
    ); // Method which adds the category ID to the user who created it

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

  async delete(id: string): Promise<Category> {
    return await this.CategoryRepository.delete(id);
  }
}
