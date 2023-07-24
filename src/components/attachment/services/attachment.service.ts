import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { unlinkSync } from 'fs';
import { Model } from 'mongoose';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import { CreateAttachmentDto } from '../dtos/attachment.create.dto';
import { UpdateAttachmentDto } from '../dtos/attachment.update.dto';
import { Attachment } from '../schemas/attachment.schema';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel('Attachment')
    private readonly attachmentModel: Model<Attachment>,
    @Inject(forwardRef(() => ExpenseService))
    private expenseService: ExpenseService,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    const session = await this.attachmentModel.db.startSession();
    session.startTransaction();

    try {
      const createdAttachment = new this.attachmentModel(createAttachmentDto);
      await createdAttachment.save({ session });

      await session.commitTransaction();
      return createdAttachment;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error.code === 11000) {
        throw new ConflictException(
          'You already have an Attachment for expense  ' +
            createAttachmentDto.expenseId,
        );
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<Attachment[]> {
    return await this.attachmentModel.find().exec();
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentModel.findById(id).exec();
    if (!attachment) {
      throw new NotFoundException(`Attachment with id '${id}' not found`);
    }
    return attachment;
  }

  async update(
    id: string,
    updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<Attachment> {
    const updatedAttachment = await this.attachmentModel
      .findByIdAndUpdate(id, updateAttachmentDto, { new: true })
      .exec();
    if (!updatedAttachment) {
      throw new NotFoundException(`Attachment with id '${id}' not found`);
    }
    return updatedAttachment;
  }

  async delete(id: string): Promise<Attachment> {
    const session = await this.attachmentModel.db.startSession();
    session.startTransaction();

    try {
      const removedAttachment = await this.attachmentModel
        .findByIdAndRemove(id)
        .session(session)
        .exec();

      if (!removedAttachment) {
        throw new NotFoundException(`Attachment with id '${id}' not found`);
      }

      console.log('removedAttachment: ', removedAttachment);
      await this.expenseService.removeAttachmentFromExpense(
        removedAttachment.expenseId,
        session,
      );
      //we delete the file from the system
      unlinkSync(removedAttachment.storageLocation);

      await session.commitTransaction();

      return removedAttachment;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(error.message);
    } finally {
      session.endSession();
    }
  }

  async deleteAttachmentOfExpense(
    attachmentId: string,
    session: any,
  ): Promise<Attachment> {
    //   console.log('deletedExpense.attachment: ');
    //   console.log('attachmentId: ', attachmentId);

    const removedAttachment = await this.attachmentModel
      .findByIdAndRemove(attachmentId)
      .session(session)
      .exec();

    if (!removedAttachment) {
      throw new NotFoundException(
        `Attachment with id '${attachmentId}' not found`,
      );
    }
    //we also delete the attachment file from the disk storage
    await this.expenseService.deleteAttachmentFile(
      removedAttachment.storageLocation,
      session,
    );
    return removedAttachment;
  }

  //method to update the expenseId
  async updateExpenseId(id: string, expenseId: string): Promise<Attachment> {
    return this.attachmentModel.findByIdAndUpdate(
      id,
      { expenseId },
      { new: true },
    );
  }

  async getStorageLocation(id: string): Promise<string> {
    const attachment = await this.attachmentModel.findById(id).exec();
    if (!attachment) {
      throw new NotFoundException(`Attachment with id '${id}' not found`);
    }
    return attachment.storageLocation;
  }
}
