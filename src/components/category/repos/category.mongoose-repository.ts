import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Req,
} from '@nestjs/common';
// import {
//   checkIdType,
//   checkUserFound,
//   checkEmailFound,
//   hashPw,
// } from './user.error-checks';

import { CategoryRepository } from './category.repository';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDTO';
import { CreateCategoryDto } from '../dtos/CreateCategoryDTO';
import { Category } from '../interfaces/category.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MongooseCategoryRepository implements CategoryRepository {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
  ) {}

  async create(categoryDto: Category): Promise<Category> {
    Logger.log('CategoryRepo->categoryDto is: ', categoryDto);

    const createdCategory = new this.categoryModel(categoryDto);
    return createdCategory.save();
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

  async update(id: string, newCateg: UpdateCategoryDto): Promise<Category> {
    let updatedCategory: any = { ...newCateg };
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

  async delete(id: string): Promise<Category> {
    const deletedCategory = await this.categoryModel
      .findByIdAndRemove(id)
      .exec();
    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return deletedCategory;
  }
}
