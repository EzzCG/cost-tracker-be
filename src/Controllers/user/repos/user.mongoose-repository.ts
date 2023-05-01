import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from '../dtos/user.update.dto';
import { User } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dtos/user.create.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(user: CreateUserDto): Promise<User> {
    Logger.log('Entering MongooseUserRepository.create() with user:', user);

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(user.password, 10);
      Logger.log('hashedPassword:', hashedPassword);
    } catch (error) {
      throw error;
    }

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
      Logger.log('error at saving new user');
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    Logger.log(`Repo findone(${id})`);
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email: email }).exec();
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    return await this.userModel
      .findByIdAndUpdate(id, user, { new: true })
      .exec();
  }

  async delete(id: string): Promise<User> {
    return await this.userModel.findByIdAndRemove(id).exec();
  }
}
