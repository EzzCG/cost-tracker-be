import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  maxValue: number;

  @Prop({ required: true })
  minValue: number;

  //   @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Expense' }] })
  //   expenses: string[];

  //   @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Alert' }] })
  //   alerts: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
