import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  checkIdType,
  checkEmailExists,
  checkUserFound,
  checkEmailFound,
  hashPw,
} from './user.error-checks';

import { UserRepository } from './user.repository';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../dtos/user.create.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(user: CreateUserDto): Promise<User> {
    Logger.log('Entering MongooseUserRepository.create() with user:', user);
    await checkEmailExists(user.email, this.userModel);

    const hashedPassword = await hashPw(user.password);

    const createdUser = new this.userModel({
      ...user,
      password: hashedPassword,
    });
    Logger.log('createdUser:', createdUser);

    try {
      const savedUser = await createdUser.save();
      Logger.log(
        'Exiting MongooseUserRepository.create() with savedUser:',
        savedUser,
      );
      return savedUser;
    } catch (error) {
      return error;
      // if (
      //   error.code === 11000 &&
      //   error.keyPattern &&
      //   error.keyPattern.email === 1
      // ) {
      //   // Duplicate email error
      //   throw new ConflictException('Email already exists.');
      // } else {
      //   // Other errors
      //   throw new InternalServerErrorException('Internal server error');
      // }
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    await checkIdType(id);

    const user = await this.userModel.findById(id).exec();
    await checkUserFound(user, id);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email }).exec();
    await checkEmailFound(user, email);
    return user;
  }

  async update(id: string, userNew: UpdateUserDto): Promise<User> {
    await checkIdType(id);

    if (userNew.email) {
      await checkEmailExists(userNew.email, this.userModel);
    }

    let updatedUser: any = { ...userNew };

    if (userNew.password) {
      updatedUser.password = await hashPw(userNew.password);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updatedUser, { new: true })
      .exec();

    await checkUserFound(user, id);

    return user;
  }

  async delete(id: string): Promise<User> {
    await checkIdType(id);

    const user = await this.userModel.findByIdAndRemove(id).exec();
    await checkUserFound(user, id);
    return user;
  }
}
