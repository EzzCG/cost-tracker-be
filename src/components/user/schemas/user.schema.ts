import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, SchemaTypes, Types } from 'mongoose';
import { Category } from 'src/components/category/schemas/category.schema';

@Schema()
export class User extends Document {
  @Prop()
  name: string;

  @Prop()
  surname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  // @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'MonthlyReport' }] })
  // monthlyReports: MonthlyReport[];

  // @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Expense' }] })
  // expenses: Expense[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }] })
  categories: Category[];

  // @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Alert' }] })
  // alerts: Alert[];
}

export const UserSchema = SchemaFactory.createForClass(User);
