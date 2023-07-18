import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from 'src/components/auth/auth.controller';
import { AuthService } from 'src/components/auth/services/auth.service';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './services/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './services/jwt.strategy';
import { CategoryController } from '../category/category.controller';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AlertController } from '../alert/alert.controller';
import { ExpenseController } from '../expense/expense.controller';
import { ReportController } from '../report/report.controller';
@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule.forRoot(), //imports the ConfigModule and sets it up to load environment variables from a .env file.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      CategoryController,
      AlertController,
      ExpenseController,
      ReportController,
      {
        path: 'user/:id/categories',
        method: RequestMethod.ALL,
      },
      {
        path: 'user/:id/expenses',
        method: RequestMethod.ALL,
      },
      {
        path: 'user/:id/alerts',
        method: RequestMethod.ALL,
      },
      {
        path: 'user',
        method: RequestMethod.GET,
      },
    );
  }
}
