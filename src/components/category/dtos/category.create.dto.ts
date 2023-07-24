import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category should have a specific name' })
  readonly name: string;

  @IsInt()
  @IsNotEmpty({ message: 'maxValue field must not be empty.' })
  readonly maxValue: number;

  @IsInt()
  @IsNotEmpty({ message: 'minValue field must not be empty.' })
  readonly minValue: number;
}
