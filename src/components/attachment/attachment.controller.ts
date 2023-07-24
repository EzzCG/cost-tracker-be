import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { CreateAttachmentDto } from './dtos/attachment.create.dto';
import { UpdateAttachmentDto } from './dtos/attachment.update.dto';
import { Attachment } from './interfaces/attachment.interface';
import { AttachmentService } from './services/attachment.service';

@Controller('attachment')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Delete(':id')
  delete(@Param('id') id: string): Promise<Attachment> {
    return this.attachmentService.delete(id);
  }

  @Get('/download/:id')
  async serveAttachment(@Param('id') id: string, @Res() res: Response) {
    try {
      console.log('serveAttachment: ', id);
      const filepath = await this.attachmentService.getStorageLocation(id);
      console.log('filepath: ', filepath);
      // replace with your actual attachment directory
      const attachmentDirectory = resolve('uploads');

      console.log('attachmentDirectory: ', attachmentDirectory);

      const fileStream = createReadStream(
        resolve(attachmentDirectory, filepath),
      );
      console.log('fileStream: ', fileStream);

      fileStream.on('open', () => {
        res.set('Content-Type', 'application/octet-stream');
        fileStream.pipe(res);
      });

      fileStream.on('error', (err) => {
        res.sendStatus(404);
      });
    } catch (e) {
      if (e instanceof NotFoundException) {
        res.sendStatus(404);
      } else {
        res.sendStatus(500);
      }
    }
  }

  //extra functions
  @Get()
  findAll(): Promise<Attachment[]> {
    return this.attachmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Attachment> {
    return this.attachmentService.findOne(id);
  }

  @Post()
  create(
    @UploadedFile() file,
    @Body() createAttachmentDto: CreateAttachmentDto,
  ): Promise<Attachment> {
    // Here file is the uploaded file
    // And createAttachmentDto contains the rest of your data
    return this.attachmentService.create(createAttachmentDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<Attachment> {
    return this.attachmentService.update(id, updateAttachmentDto);
  }
}
