import { Module } from '@nestjs/common';
import { ExpenseModule } from '../expense/expense.module';
import { AlertModule } from '../alert/alert.module';
import { ReportController } from './report.controller';
import { ReportService } from './services/report.service';

@Module({
  imports: [ExpenseModule, AlertModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
