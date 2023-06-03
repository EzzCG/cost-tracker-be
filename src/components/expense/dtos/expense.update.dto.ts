import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './expense.create.dto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
