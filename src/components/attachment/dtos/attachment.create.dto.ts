import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsNotEmpty()
  storageLocation: string;

  @IsString()
  @IsNotEmpty()
  expenseId: string;
}
