import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './components/user/user.module';
import { AuthModule } from './components/auth/auth.module';
import { CategoryModule } from './components/category/category.module';
import { ReportModule } from './components/report/report.module';
import { ExpenseModule } from './components/expense/expense.module';
import { AlertModule } from './components/alert/alert.module';
import { AttachmentModule } from './components/attachment/attachment.module';

@Module({
  imports: [
    ReportModule,
    AttachmentModule,
    UserModule,
    AuthModule,
    CategoryModule,
    ReportModule,
    ExpenseModule,
    AlertModule,
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
