import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { isValidObjectId } from 'mongoose';
import * as path from 'path';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AttachmentService } from '../attachment/services/attachment.service';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { CreateExpenseDto } from './dtos/expense.create.dto';
import { UpdateExpenseDto } from './dtos/expense.update.dto';
import { Expense } from './schemas/expense.schema';
import { ExpenseService } from './services/expense.service';
@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly attachmentService: AttachmentService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment')) // we extract the file by intercepting the request and handling the file upload for the 'attachment' field.
  async create(
    @UploadedFile() file, //injects uploaded file from attachment field as a parameter
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: UserRequest,
  ): Promise<Expense | any> {
    console.log('create expense: ', createExpenseDto);
    let attachmentDto = null;
    //if there's a file
    if (file) {
      console.log('file: ', file);
      //we define where the uploaded file will be stored
      const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads'); //we go to the src folder and save it in the uploads directory
      if (!fs.existsSync(uploadsDir)) {
        //if folder doesn't exist, we create it
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      //we specify full path where the uploaded file will be stored
      const newFileLocation = path.join(uploadsDir, file.originalname);
      console.log('newFileLocation: ', newFileLocation);

      /*Without fs.rename operation, the file will remain temporary and might be deleted by the system
      Renaming the file ensures that it is moved to the desired location and avoids losing the file. */
      fs.rename(file.path, newFileLocation, (err) => {
        if (err) {
          console.error(err);
          throw err; //  handle error appropriately
        }
      });

      attachmentDto = {
        fileName: file.originalname,
        type: file.mimetype,
        size: file.size,
        storageLocation: newFileLocation,
        expenseId: '', // this will be filled in the service
      };

      console.log('attachmentDto: ', attachmentDto);
    }
    return await this.expenseService.create(
      createExpenseDto,
      req.userId,
      attachmentDto,
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('attachment')) // we extract the file by intercepting the request and handling the file upload for the 'attachment' field.
  async update(
    @UploadedFile() file, //injects uploaded file from attachment field as a parameter
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req: UserRequest,
  ): Promise<Expense> {
    console.log('update expense: ', updateExpenseDto);
    let attachmentDto = null;

    //we define where the uploaded file will be stored
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads'); //we go to the src folder and save it in the uploads directory
    if (!fs.existsSync(uploadsDir)) {
      //if folder doesn't exist, we create it
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    //if there's a file
    if (file) {
      console.log('file: ', file);

      //we specify full path where the uploaded file will be stored
      const newFileLocation = path.join(uploadsDir, file.originalname);

      /*Without fs.rename operation, the file will remain temporary and might be deleted by the system
      Renaming the file ensures that it is moved to the desired location and avoids losing the file. */
      fs.rename(file.path, newFileLocation, (err) => {
        if (err) {
          console.error(err);
          throw err; //  handle error appropriately
        }
      });

      attachmentDto = {
        fileName: file.originalname,
        type: file.mimetype,
        size: file.size,
        storageLocation: newFileLocation,
        expenseId: id, // we get the id from the params in the url
      };

      console.log('attachmentDto: ', attachmentDto);
    } else {
      if (isValidObjectId(updateExpenseDto.attachment)) {
        const existingAttachment = await this.attachmentService.findOne(
          updateExpenseDto.attachment,
        );
        if (existingAttachment) {
          updateExpenseDto.attachment = existingAttachment._id;
        } else {
          updateExpenseDto.attachment = null;
        }
      } else {
        updateExpenseDto.attachment = null;
      }
    }
    console.log('updateExpenseDto: ', updateExpenseDto);

    return await this.expenseService.update(
      id,
      updateExpenseDto,
      req.userId,
      attachmentDto,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return await this.expenseService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Expense> {
    return await this.expenseService.delete(id);
  }

  //extra
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Expense[]> {
    return await this.expenseService.findAll();
  }
}
