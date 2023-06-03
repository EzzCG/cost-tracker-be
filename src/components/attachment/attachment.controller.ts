import {
  Body,
  Controller,
  Post,
  Request,
  Req,
  Delete,
  Get,
  Param,
  Put,
  Logger,
} from '@nestjs/common';
import { AttachmentService } from './services/attachment.service';
import { CreateAttachmentDto } from './dtos/attachment.create.dto';
import { Attachment } from './interfaces/attachment.interface';
import { UpdateAttachmentDto } from './dtos/attachment.update.dto';

@Controller('attachment')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  create(
    @Body() createAttachmentDto: CreateAttachmentDto,
  ): Promise<Attachment> {
    // Logger.log()
    return this.attachmentService.create(createAttachmentDto);
  }

  @Get()
  findAll(): Promise<Attachment[]> {
    return this.attachmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Attachment> {
    return this.attachmentService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<Attachment> {
    return this.attachmentService.update(id, updateAttachmentDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<Attachment> {
    return this.attachmentService.delete(id);
  }
}
