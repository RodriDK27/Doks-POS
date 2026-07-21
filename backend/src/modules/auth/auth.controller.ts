import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
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

  @Get('cashiers')
  async getCashiers() {
    return this.authService.getCashiers();
  }

  @Post('cashiers')
  @UseGuards(JwtAuthGuard)
  async createCashier(@Body('name') name: string) {
    return this.authService.createCashier(name);
  }

  @Delete('cashiers/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCashier(@Param('id') id: string) {
    return this.authService.deleteCashier(id);
  }
}
