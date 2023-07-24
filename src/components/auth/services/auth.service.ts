import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService: ');

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    this.logger.log(`User found: ${JSON.stringify(user)}`);
    this.logger.log(`password passed: ${pass}`);

    if (user && bcrypt.compareSync(pass, user.password)) {
      const { password, ...result } = user; // Convert Mongoose document to a plain object
      this.logger.log(`User validated: ${JSON.stringify(result)}`);

      return result;
    }
    this.logger.warn(`Invalid password: ${pass}`);

    console.log('Invalid password:', pass);
    return null;
  }

  async login(user: any) {
    // this.logger.log(`User object: ${JSON.stringify(user)}`);
    const payload = { email: user._doc.email, sub: user._doc._id };
    // this.logger.log(`Payload: ${JSON.stringify(payload)}`);
    const access_token = this.jwtService.sign(payload);
    // this.logger.log(`Generated access_token: ${access_token}`);
    return {
      access_token: access_token,
    };
  }
}
