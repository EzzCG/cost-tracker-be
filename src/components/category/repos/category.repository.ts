import { CreateCategoryDto } from '../dtos/CreateCategoryDTO';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import { Category } from '../interfaces/category.interface';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findOne(id: string): Promise<Category>;
  update(id: string, Category: UpdateCategoryDto): Promise<Category>;
  create(Category: CreateCategoryDto): Promise<Category>;
  delete(id: string): Promise<Category>;
}

export const CategoryRepositoryToken = Symbol('CategoryRepositoryToken');
