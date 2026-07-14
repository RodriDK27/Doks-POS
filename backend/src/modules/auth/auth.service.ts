import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // PINs por defecto. En producción pueden venir de variables de entorno o de la base de datos
  private readonly adminPin = process.env.ADMIN_PIN || '1234';
  private readonly cajeroPin = process.env.CAJERO_PIN || '0000';

  constructor(private readonly jwtService: JwtService) {}

  async verifyPin(pin: string): Promise<{ role: string; token: string }> {
    let role: 'ADMIN' | 'CAJERO';
    if (pin === this.adminPin) {
      role = 'ADMIN';
    } else if (pin === this.cajeroPin) {
      role = 'CAJERO';
    } else {
      throw new UnauthorizedException('El PIN de seguridad ingresado es incorrecto.');
    }

    const payload = { role, sub: role };
    const token = this.jwtService.sign(payload);

    return { role, token };
  }
}
