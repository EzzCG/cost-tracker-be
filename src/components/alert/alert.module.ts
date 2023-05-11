import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { AlertSchema } from './schemas/alert.schema.';
import { AlertController } from './alert.controller';
import { AlertService } from './services/alert.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema }]),
    UserModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
