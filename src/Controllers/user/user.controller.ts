import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  UseGuards,
  Res,
  BadRequestException,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from 'src/DTOs/user.create.dto';
import { UpdateUserDto } from 'src/DTOs/user.update.dto';
import { UserService } from 'src/Services/user/user.service';
import { User } from 'src/interfaces/user.interface';
import { Request, Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ): Promise<User | any> {
    try {
      const createdUser = await this.userService.create(createUserDto);
      return res.status(201).json(createdUser);
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.email === 1
      ) {
        // Duplicate email error
        return res
          .status(400)
          .json({ statusCode: '400', message: 'Email already exists.' });
      } else {
        // Other errors
        return res
          .status(500)
          .json({ statusCode: '500', message: 'Internal server error' });
      }
    }
  }

  //   @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = this.userService.findOne(id);
    if (user!) {
      throw new NotFoundException(
        `User with id '${id}' not found`,
        'USER_NOT_FOUND',
      );
    }
    return user;
  }

  @Get(':email')
  async findByEmail(@Param('email') email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        `User with email '${email}' not found`,
        'USER_NOT_FOUND',
      );
    }
    return user;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<User> {
    return this.userService.delete(id);
  }
}
