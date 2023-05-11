import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Expense extends Document {
  @Prop({ required: true })
  concept: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  userId: string;
  //   @Prop({ type: Schema.Types.ObjectId, ref: 'Category' })
  //   category: string;

  //   @Prop({ type: Schema.Types.ObjectId, ref: 'Attachment' })
  //   attachment: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
