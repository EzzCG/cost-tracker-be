import { Inject, Injectable } from '@nestjs/common';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { User } from 'src/components/user/interfaces/user.interface';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { UserRepository, UserRepositoryToken } from '../repos/user.repository';

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

  async findUser(id: string): Promise<User> {
    return await this.userRepository.findOne(id);
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    return await this.userRepository.update(id, user);
  }

  async delete(id: string): Promise<User> {
    return await this.userRepository.delete(id);
  }

  //fetch categories of  a user
  async findCategoriesOfUser(userId: string): Promise<Category[]> {
    return await this.userRepository.findCategoriesOfUser(userId);
  }

  //fetch expenses of  a user
  async findExpensesOfUser(userId: string): Promise<Expense[]> {
    return await this.userRepository.findExpensesOfUser(userId);
  }

  //fetch alerts of  a user
  async findAlertsOfUser(userId: string): Promise<Alert[]> {
    return await this.userRepository.findAlertsOfUser(userId);
  }
  //extra methods
  async findOne(id: string): Promise<User> {
    return await this.userRepository.findOne(id);
  }
  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findByEmail(email);
  }
}
