import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { AttachmentController } from './attachment.controller';
import { AttachmentSchema } from './schemas/attachment.schema';
import { AttachmentService } from './services/attachment.service';
import { ExpenseModule } from '../expense/expense.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Attachment', schema: AttachmentSchema },
    ]),
    forwardRef(() => ExpenseModule),
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService, AttachmentModule],
})
export class AttachmentModule {}
