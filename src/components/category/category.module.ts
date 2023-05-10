import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryRepositoryToken } from './repos/category.repository';
import { MongooseCategoryRepository } from './repos/category.mongoose-repository';
import { CategorySchema } from './schemas/category.schema';
import { CategoryService } from './services/category.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
    UserModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    { provide: CategoryRepositoryToken, useClass: MongooseCategoryRepository },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
