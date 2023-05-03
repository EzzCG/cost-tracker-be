import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
// import { CreateAttachmentDto } from './CreateAttachmentDto';
import { CreateCategoryDto } from 'src/components/category/dtos/CreateCategoryDTO';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  //   @IsOptional()
  //   @Type(() => CreateAttachmentDto)
  //   @ValidateNested()
  //   attachment?: CreateAttachmentDto;

  @IsString()
  @IsNotEmpty()
  date: string;

  //   @Type(() => CreateCategoryDto)
  //   @ValidateNested()
  //   category: CreateCategoryDto;
}
