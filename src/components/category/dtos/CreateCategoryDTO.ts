import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
  IsStrongPassword,
  IsInt,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category should have a specific name' })
  readonly name: string;

  @IsInt()
  @IsNotEmpty({ message: 'Surname field must not be empty.' })
  readonly maxValue: number;

  @IsInt()
  @IsNotEmpty({ message: 'Surname field must not be empty.' })
  readonly minValue: number;
}
