import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCategoryDto } from 'src/components/category/dtos/category.create.dto';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}

//   @IsOptional()
//   @Type(() => CreateAttachmentDto)
//   @ValidateNested()
//   attachment?: CreateAttachmentDto;

//   @Type(() => CreateCategoryDto)
//   @ValidateNested()
//   category: CreateCategoryDto;
