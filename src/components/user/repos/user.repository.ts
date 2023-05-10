import { ObjectId, Types } from 'mongoose';
import { CreateUserDto } from '../dtos/user.create.dto';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';
import { Category } from 'src/components/category/schemas/category.schema';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findOne(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  create(user: CreateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
  addCategoryToUser(userId: string, categoryId: Types.ObjectId): Promise<void>;
  findCategoriesForUser(userId: string): Promise<Category[]>;
}

export const UserRepositoryToken = Symbol('UserRepositoyToken');
