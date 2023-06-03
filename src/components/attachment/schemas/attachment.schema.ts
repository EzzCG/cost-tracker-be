import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema()
export class Attachment extends Document {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  storageLocation: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }) // <-- This is how we store the Expense reference in the Attachment document
  expenseId: string;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
AttachmentSchema.index({ expenseId: 1 }, { unique: true });
