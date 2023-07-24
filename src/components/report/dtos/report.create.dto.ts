import { IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  month: number;

  @IsNotEmpty()
  year: number;
}
