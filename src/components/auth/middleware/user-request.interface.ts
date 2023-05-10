// user-request.interface.ts
import { Request } from 'express';
import { User } from '../../user/schemas/user.schema';

export interface UserRequest extends Request {
  userId: string;
}
