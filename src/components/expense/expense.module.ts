import { Module } from '@nestjs/common';
import { ExpenseSchema } from './schemas/expense.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './services/expense.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Expense', schema: ExpenseSchema }]),
    UserModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
