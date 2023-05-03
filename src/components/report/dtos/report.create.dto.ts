import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
//   import { CreateExpenseDto } from './CreateExpenseDto';

export class CreateReportDto {
  @IsNumber()
  @IsNotEmpty()
  totExpenses: number;

  @IsNumber()
  @IsNotEmpty()
  totIncome: number;

  @IsNumber()
  @IsNotEmpty()
  netBalance: number;

  // @IsOptional()
  // @Type(() => CreateExpenseDto)
  // @ValidateNested()
  // expenses?: CreateExpenseDto[];
}
