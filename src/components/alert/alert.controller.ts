import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { CreateAlertDto } from './dtos/alert.create.dto';
import { UpdateAlertDto } from './dtos/alert.update.dto';
import { AuthGuard } from './guards/authguard';
import { Alert } from './schemas/alert.schema.';
import { AlertService } from './services/alert.service';

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

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Alert> {
    return this.alertService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @Request() req: UserRequest,
  ): Promise<Alert> {
    return await this.alertService.update(id, updateAlertDto, req.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Alert> {
    return await this.alertService.delete(id);
  }

  //extra

  // @UseGuards(JwtAuthGuard)
  // @Get()
  // async findAll(): Promise<Alert[]> {
  //   return await this.alertService.findAll();
  // }
}
