import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './CreateExpenseDto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
