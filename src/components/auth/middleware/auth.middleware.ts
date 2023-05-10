// auth.middleware.ts

// Import necessary dependencies
import { Injectable, Logger, NestMiddleware, Request } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../../user/services/user.service';
import { JwtPayload } from 'jsonwebtoken';

// Use the @Injectable() decorator to make the middleware injectable
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  // Inject the UserService for retrieving user information
  constructor(private readonly userService: UserService) {}

  // The main middleware function
  async use(@Request() req, res: Response, next: NextFunction) {
    // Extract the token from the authorization header
    const token = req.headers['authorization']?.split(' ')[1];
    Logger.log('token: ', token);

    // If there's no token, return an unauthorized status
    if (!token) {
      res.status(401).send({ message: 'Unauthorized' });
      return;
    }

    // Try to verify the token and get the decoded payload
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload; //we do a type assertion to be able to

      //extract the email
      Logger.log('decoded: ', decoded);
      // Find the user by the decoded userId and attach the user object to the request
      const user = await this.userService.findByEmail(decoded.email);

      // req.user = { id: user.id, email: user.email }; //this to assign un obj with id and email
      req.userId = user.id; //this to assign only id
      Logger.log('User: ', req.user);

      // Call the next middleware or controller
      next();
    } catch (error) {
      // If there's an error (e.g., invalid token), return an unauthorized status
      res.status(401).send({ message: 'Unauthorized' });
    }
  }
}
