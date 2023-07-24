import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/components/user/interfaces/user.interface';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Alert } from '../alert/schemas/alert.schema.';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { Category } from '../category/schemas/category.schema';
import { Expense } from '../expense/schemas/expense.schema';
import { CreateUserDto } from './dtos/user.create.dto';
import { UpdateUserDto } from './dtos/user.update.dto';
import { UserService } from './services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //adding comment to test
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User | any> {
    const user = {
      ...createUserDto,
      email: createUserDto.email.toLocaleLowerCase(),
    }; //we convert email to lowercase
    return await this.userService.create(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
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
  async findCategoriesOfUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Category[]> {
    // Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's categories.",
      );
    }
    return await this.userService.findCategoriesOfUser(userId);
  }

  @Get(':id/expenses')
  async findExpenseOfUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    // Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's expenses.",
      );
    }
    return await this.userService.findExpensesOfUser(userId);
  }

  @Get(':id/alerts')
  async findAlertsOfUser(
    @Param('id') userId: string,
    @Request() req: UserRequest,
  ): Promise<Alert[]> {
    // Logger.log('UserController=> userId: ', userId, 'req.userId: ', req.userId);
    if (userId !== req.userId) {
      throw new UnauthorizedException(
        "You are not authorized to access this user's alerts.",
      );
    }
    return await this.userService.findAlertsOfUser(userId);
  }
  //extra methods
  @Get('by-id/:id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }
  //a method that returns the user based on the login token
  @Get()
  async findUser(@Request() req: UserRequest): Promise<User> {
    Logger.log('findUser-> req.userId: ', req.userId);
    return await this.userService.findUser(req.userId);
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string): Promise<User> {
    return await this.userService.findByEmail(email);
  }
}
