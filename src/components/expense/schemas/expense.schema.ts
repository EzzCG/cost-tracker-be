import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Attachment } from 'src/components/attachment/schemas/attachment.schema';

@Schema()
export class Expense extends Document {
  @Prop({ required: true })
  concept: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, type: Date }) date: Date;

  @Prop({ required: true })
  userId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' })
  attachment: Attachment;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ attachment: 1 }, { sparse: true }); //skips attachment with null values which means null can't be unique
