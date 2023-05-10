import { Inject, Injectable, Logger } from '@nestjs/common';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { UserRepositoryToken, UserRepository } from '../repos/user.repository';
import { User } from 'src/components/user/interfaces/user.interface';
import { Types } from 'mongoose';
import { Category } from 'src/components/category/schemas/category.schema';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepositoryToken) private userRepository: UserRepository,
  ) {}

  async create(user: User): Promise<User> {
    const createdUser = await this.userRepository.create(user);
    return createdUser;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    return await this.userRepository.findOne(id);
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findByEmail(email);
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    return await this.userRepository.update(id, user);
  }

  async delete(id: string): Promise<User> {
    return await this.userRepository.delete(id);
  }

  //after creating new category, we add the id to the user
  async addCategoryToUser(
    userId: string,
    categoryId: Types.ObjectId,
  ): Promise<void> {
    await this.userRepository.addCategoryToUser(userId, categoryId);
  }

  //fetch categories for a user
  async findCategoriesForUser(userId: string): Promise<Category[]> {
    return await this.userRepository.findCategoriesForUser(userId);
  }
}
