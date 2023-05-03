import { CreateCategoryDto } from './CreateCategoryDTO';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
