import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertModule } from '../alert/alert.module';
import { ExpenseModule } from '../expense/expense.module';
import { UserModule } from '../user/user.module';
import { CategoryController } from './category.controller';
import { MongooseCategoryRepository } from './repos/category.mongoose-repository';
import { CategoryRepositoryToken } from './repos/category.repository';
import { CategorySchema } from './schemas/category.schema';
import { CategoryService } from './services/category.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => AlertModule),
    ExpenseModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    { provide: CategoryRepositoryToken, useClass: MongooseCategoryRepository },
  ],
  exports: [CategoryService, CategoryModule, CategoryRepositoryToken],
})
export class CategoryModule {}
