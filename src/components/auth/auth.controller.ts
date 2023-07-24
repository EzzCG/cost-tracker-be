import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/components/auth/services/auth.service';
import { LocalAuthGuard } from '../../shared/guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
