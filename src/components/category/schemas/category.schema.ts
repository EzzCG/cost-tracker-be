import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Expense } from 'src/components/expense/schemas/expense.schema';

@Schema()
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  maxValue: number;

  @Prop({ required: true })
  minValue: number;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 }) current_value: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }] })
  alerts: Alert[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }] })
  expenses: Expense[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
