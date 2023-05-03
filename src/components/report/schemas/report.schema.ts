import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MonthlyReport extends Document {
  @Prop({ required: true })
  totExpenses: number;

  @Prop({ required: true })
  totIncome: number;

  @Prop({ required: true })
  netBalance: number;

  //   @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Expense' }] })
  //   expenses: string[];
}

export const MonthlyReportSchema = SchemaFactory.createForClass(MonthlyReport);
