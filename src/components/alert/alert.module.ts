import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { AlertSchema } from './schemas/alert.schema.';
import { AlertController } from './alert.controller';
import { AlertService } from './services/alert.service';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => CategoryModule),
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
