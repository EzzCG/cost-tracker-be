import { PartialType } from '@nestjs/mapped-types';
import { CreateAttachmentDto } from './attachment.create.dto';

export class UpdateAttachmentDto extends PartialType(CreateAttachmentDto) {}
