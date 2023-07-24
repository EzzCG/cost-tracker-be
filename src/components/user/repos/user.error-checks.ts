// user.helpers.ts

import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';

//checks if id type is correct(length check)
export async function checkIdType(id: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException(
      `Id '${id}' type is incorrect`,
      'USER_NOT_FOUND',
    );
  }
}

//checks if user email already exists for another user
export async function checkEmailExists(
  email: string,
  userModel: Model<User>,
): Promise<void> {
  const existingUser = await userModel.findOne({ email }).exec();
  if (existingUser) {
    throw new ConflictException(
      `Email ${email}  already exists for another user`,
    );
  }
}

//checks if user is found in database
export async function checkUserFound(
  user: User | null,
  id: string,
): Promise<void> {
  if (user == null) {
    throw new NotFoundException(
      `User with id ${id} not found`,
      'USER_NOT_FOUND',
    );
  }
}

//checks if email is found in database
export async function checkEmailFound(
  user: User | null,
  email: string,
): Promise<void> {
  if (!user) {
    throw new NotFoundException(
      `User with email '${email}' not found`,
      'USER_NOT_FOUND',
    );
  }
}

//checks if passwords are hashed correctly
export async function hashPw(pw: string): Promise<string> {
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(pw, 10);
    return hashedPassword;
  } catch (error) {
    throw error;
  }
}
