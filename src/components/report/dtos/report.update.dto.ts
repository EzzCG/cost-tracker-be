import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './report.create.dto';

export class UpdateReportDto extends PartialType(CreateReportDto) {}
