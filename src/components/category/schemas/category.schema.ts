import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaType, SchemaTypes } from 'mongoose';
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

  // @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }] })
  // user: User;

  //   @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Expense' }] })
  //   expenses: string[];

  //   @Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Alert' }] })
  //   alerts: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
