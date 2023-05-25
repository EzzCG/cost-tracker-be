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

  @Prop({ required: true })
  categoryId: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

//   @Prop({ type: Schema.Types.ObjectId, ref: 'Attachment' })
//   attachment: string;
