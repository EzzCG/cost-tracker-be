import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
//   import { CreateCategoryDto } from './CreateCategoryDto';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // @Type(() => CreateCategoryDto)
  // @ValidateNested()
  // category: CreateCategoryDto;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  frequency: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
