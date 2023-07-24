import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRequest } from 'src/components/auth/middleware/user-request.interface';
import { CategoryService } from '../services/category.service';

//guard to make sure logged in user only has access to his own categories
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly categoryService: CategoryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const categoryParam = request.params['id'];

    const req: UserRequest = request;

    const category = await this.categoryService.findOne(categoryParam);

    if (category.userId !== req.userId) {
      throw new ForbiddenException(
        'Category ' +
          categoryParam +
          ' does not belong to the logged-in user ' +
          request.user.name +
          ' ' +
          request.user.surname,
      );
    }

    return true;
  }
}
