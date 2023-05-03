import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Alert extends Document {
  @Prop({ required: true })
  name: string;

  //   @Prop({ type: Schema.Types.ObjectId, ref: 'Category' })
  //   category: string;

  @Prop({ required: true })
  condition: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  frequency: number;

  @Prop({ required: true })
  message: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
