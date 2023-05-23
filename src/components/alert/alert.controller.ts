import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  UseGuards,
  Res,
  BadRequestException,
  Req,
  HttpStatus,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateAlertDto } from './dtos/CreateAlertDTO';
import { UpdateAlertDto } from './dtos/UpdateAlertDTO';
import { AlertService } from './services/alert.service';
import { Alert } from './schemas/alert.schema.';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { Request } from '@nestjs/common';
import { UserRequest } from '../auth/middleware/user-request.interface';
import {
  CategoryRepository,
  CategoryRepositoryToken,
} from '../category/repos/category.repository';
import { AuthGuard } from './guards/authguard';

@Controller('alert')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    @Inject(forwardRef(() => CategoryRepositoryToken))
    private categoryRepository: CategoryRepository,
  ) {}

  @Post()
  async create(
    @Body() createAlertDto: CreateAlertDto,
    @Request() req: UserRequest,
  ): Promise<Alert | any> {
    return await this.alertService.create(createAlertDto, req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Alert[]> {
    return await this.alertService.findAll();
  }
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Alert> {
    return this.alertService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    return await this.alertService.update(id, updateAlertDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Alert> {
    return await this.alertService.delete(id);
  }
}
