import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsIn } from 'class-validator';
import { Document } from 'mongoose';

@Schema()
export class Alert extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  @IsIn(['greater than', 'less than', 'equal to'])
  condition: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  message: string;

  @Prop({ default: null })
  triggered_at: Date;

  @Prop({ default: [] })
  triggered_history: Date[];

  @Prop({ required: true, default: 'Active' })
  status: string;
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  categoryId: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
AlertSchema.index({ userId: 1, name: 1 }, { unique: true });
