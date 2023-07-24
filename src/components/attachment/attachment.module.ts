import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseModule } from '../expense/expense.module';
import { AttachmentController } from './attachment.controller';
import { AttachmentSchema } from './schemas/attachment.schema';
import { AttachmentService } from './services/attachment.service';

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
