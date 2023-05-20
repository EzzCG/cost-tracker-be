import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, SchemaType, SchemaTypes } from 'mongoose';
import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { User } from 'src/components/user/schemas/user.schema';

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
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

// @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }] })
// expenses: Expense[];

// @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }] })
// alerts: Alert[];
