import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertDto } from './alert.create.dto';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}
