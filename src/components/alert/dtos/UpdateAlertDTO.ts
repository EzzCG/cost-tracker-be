import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertDto } from './CreateAlertDto';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}
