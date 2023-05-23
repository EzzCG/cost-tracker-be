import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { UserRequest } from '../../auth/middleware/user-request.interface';
import { AlertService } from '../services/alert.service';

//guard to make sure logged in user only has access to his own alerts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly alertService: AlertService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Logger.log('request.user :' + request.user);

    const alertParam = request.params['id'];
    // Logger.log('alertParam :' + alertParam);

    const req: UserRequest = request;
    // Logger.log('userId :' + req.userId);

    const alert = await this.alertService.findOne(alertParam);
    // Logger.log('alert.userId :' + alert.userId);

    if (alert.userId !== req.userId) {
      throw new ForbiddenException(
        'alert ' + alertParam + ' does not belong to the logged-in user ',
        // +
        // request.user.name +
        // ' ' +
        // request.user.surname,
      );
    }

    return true;
  }
}
