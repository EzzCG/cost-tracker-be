import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/components/user/user.controller';
import { MongooseUserRepository } from './repos/user.mongoose-repository';
import { UserRepositoryToken } from './repos/user.repository';
import { UserSchema } from 'src/components/user/schemas/user.schema';
import { UserService } from './services/user.service';
import { CategoryModule } from '../category/category.module';
import { AlertModule } from '../alert/alert.module';
import { ExpenseModule } from '../expense/expense.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => CategoryModule),
    forwardRef(() => AlertModule),
    forwardRef(() => ExpenseModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: UserRepositoryToken, useClass: MongooseUserRepository },
  ],
  exports: [UserRepositoryToken, UserModule, UserService],
})
export class UserModule {}
