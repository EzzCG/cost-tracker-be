import { CreateUserDto } from '../dtos/user.create.dto';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findOne(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  create(user: CreateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
}

export const UserRepositoryToken = Symbol('UserRepositoyToken');
