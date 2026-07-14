import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-pin')
  async verifyPin(@Body('pin') pin: string) {
    return this.authService.verifyPin(pin);
  }
}
