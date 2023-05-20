import { Module, forwardRef } from '@nestjs/common';
import { ExpenseSchema } from './schemas/expense.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './services/expense.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Expense', schema: ExpenseSchema }]),
    forwardRef(() => UserModule),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService, ExpenseModule],
})
export class ExpenseModule {}
