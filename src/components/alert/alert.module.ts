import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';
import { AlertController } from './alert.controller';
import { AlertSchema } from './schemas/alert.schema.';
import { AlertService } from './services/alert.service';

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
