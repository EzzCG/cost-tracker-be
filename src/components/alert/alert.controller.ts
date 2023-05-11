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
} from '@nestjs/common';
import { CreateAlertDto } from './dtos/CreateAlertDTO';
import { UpdateAlertDto } from './dtos/UpdateAlertDTO';
import { AlertService } from './services/alert.service';
import { Alert } from './interfaces/alert.interface';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { Request } from '@nestjs/common';
import { UserRequest } from '../auth/middleware/user-request.interface';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async create(
    @Body() createAlertDto: CreateAlertDto,
    @Request() req: UserRequest,
  ): Promise<Alert | any> {
    Logger.log('AlertController->userId is: ', req.userId);

    return await this.alertService.create(
      {
        userId: req.userId,
        ...createAlertDto,
      },
      req.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Alert[]> {
    return await this.alertService.findAll();
  }

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
