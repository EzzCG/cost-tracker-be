import { Inject, Injectable, Logger } from '@nestjs/common';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { UserRepositoryToken, UserRepository } from '../repos/user.repository';
import { User } from 'src/components/user/interfaces/user.interface';

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
}
