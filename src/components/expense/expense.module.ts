import { Module, forwardRef } from '@nestjs/common';
import { ExpenseSchema } from './schemas/expense.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './services/expense.service';
import { CategoryModule } from '../category/category.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Expense', schema: ExpenseSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => CategoryModule),
    forwardRef(() => AttachmentModule),
    MulterModule.register({
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix);
        },
      }),
    }),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService, ExpenseModule],
})
export class ExpenseModule {}
