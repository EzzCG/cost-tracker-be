import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  fileName: string;
  @IsString()
  type: string;
  size: number;
  @IsString()
  storageLocation: string;
  @IsOptional()
  @IsString()
  expenseId?: string;
}
