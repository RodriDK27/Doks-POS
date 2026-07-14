import { Controller, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePinDto } from './dto/change-pin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-pin')
  async verifyPin(@Body('pin') pin: string) {
    return this.authService.verifyPin(pin);
  }

  @Patch('change-pin')
  @UseGuards(JwtAuthGuard)
  async changePin(@Req() req: any, @Body() changePinDto: ChangePinDto) {
    const userId = req.user.userId;
    return this.authService.changePin(userId, changePinDto.currentPin, changePinDto.newPin);
  }
}
