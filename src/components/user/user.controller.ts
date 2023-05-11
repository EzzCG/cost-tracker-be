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
  UnauthorizedException,
  Request,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/user.create.dto';
import { UpdateUserDto } from './dtos/user.update.dto';
import { UserService } from './services/user.service';
import { User } from 'src/components/user/interfaces/user.interface';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Category } from '../category/schemas/category.schema';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { Expense } from '../expense/schemas/expense.schema';
import { Alert } from '../alert/schemas/alert.schema.';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //adding comment to test
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User | any> {
    return await this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get('by-id/:id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string): Promise<User> {
    return await this.userService.findByEmail(email);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<User> {
    return await this.userService.delete(id);
  }

  @Get(':id/categories')
  async findCategoriesForUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Category[]> {
    Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's categories.",
      );
    }
    return await this.userService.findCategoriesForUser(userId);
  }

  @Get(':id/expenses')
  async findExpenseForUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's expenses.",
      );
    }
    return await this.userService.findExpensesForUser(userId);
  }

  @Get(':id/alerts')
  async findAlertsForUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Alert[]> {
    Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's alerts.",
      );
    }
    return await this.userService.findAlertsForUser(userId);
  }
}
