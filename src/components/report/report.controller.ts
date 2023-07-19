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
  Request,
  Query,
} from '@nestjs/common';
import { CreateReportDto } from './dtos/report.create.dto';
import { UserRequest } from '../auth/middleware/user-request.interface';
import { get } from 'http';
import { Expense } from '../expense/schemas/expense.schema';
import { ReportService } from './services/report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  async getOverview(
    @Query() createReportDto: CreateReportDto,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    Logger.log('dto: ', createReportDto);
    return await this.reportService.getOverview(createReportDto, req.userId);
  }

  @Get('categories')
  async getCategories(
    @Query() createReportDto: CreateReportDto,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    return await this.reportService.getCategories(createReportDto, req.userId);
  }

  @Get('alerts')
  async getAlerts(
    @Query() createReportDto: CreateReportDto,
    @Request() req: UserRequest,
  ): Promise<Expense[]> {
    return await this.reportService.getAlerts(createReportDto, req.userId);
  }
}
