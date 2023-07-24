import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRequest } from '../../auth/middleware/user-request.interface';
import { AlertService } from '../services/alert.service';

//guard to make sure logged in user only has access to his own alerts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly alertService: AlertService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const alertParam = request.params['id'];

    const req: UserRequest = request;

    const alert = await this.alertService.findOne(alertParam);

    if (alert.userId !== req.userId) {
      throw new ForbiddenException(
        'alert ' + alertParam + ' does not belong to the logged-in user ',
      );
    }

    return true;
  }
}
