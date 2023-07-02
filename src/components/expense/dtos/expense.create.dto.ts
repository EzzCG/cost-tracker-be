import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDate,
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
  categoryId: string;
}
