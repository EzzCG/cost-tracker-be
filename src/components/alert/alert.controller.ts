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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateAlertDto } from './dtos/alert.create.dto';
import { UpdateAlertDto } from './dtos/alert.update.dto';
import { AlertService } from './services/alert.service';
import { Alert } from './schemas/alert.schema.';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { Request } from '@nestjs/common';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { AuthGuard } from './guards/authguard';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
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
