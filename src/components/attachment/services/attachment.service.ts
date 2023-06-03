import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';

import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserRepository,
  UserRepositoryToken,
} from 'src/components/user/repos/user.repository';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from 'src/components/category/repos/category.repository';
import { Attachment } from '../schemas/attachment.schema';
import { CreateAttachmentDto } from '../dtos/attachment.create.dto';
import { ExpenseService } from 'src/components/expense/services/expense.service';
import { UpdateAttachmentDto } from '../dtos/attachment.update.dto';

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

      await this.expenseService.addAttachmentToExpense(
        createdAttachment.expenseId,
        createdAttachment,
        session,
      );

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

      await this.expenseService.removeAttachmentFromExpense(
        removedAttachment.expenseId,
        session,
      );

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
    const removedAttachment = await this.attachmentModel
      .findByIdAndRemove(attachmentId)
      .session(session)
      .exec();

    if (!removedAttachment) {
      throw new NotFoundException(
        `Attachment with id '${attachmentId}' not found`,
      );
    }
    return removedAttachment;
  }
}
