import { Module, forwardRef } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryRepositoryToken } from './repos/category.repository';
import { MongooseCategoryRepository } from './repos/category.mongoose-repository';
import { CategorySchema } from './schemas/category.schema';
import { CategoryService } from './services/category.service';
import { UserModule } from '../user/user.module';
import { ExpenseModule } from '../expense/expense.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
    forwardRef(() => UserModule),
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
