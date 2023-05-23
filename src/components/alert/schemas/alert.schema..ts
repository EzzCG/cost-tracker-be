import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Alert extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  condition: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  frequency: number;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, default: 'active' })
  status: string;
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  categoryId: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
AlertSchema.index({ userId: 1, name: 1 }, { unique: true });
