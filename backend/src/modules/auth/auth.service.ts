import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const userCount = await this.prisma.user.count();
    if (userCount === 0) {
      console.log('Sembrando usuarios por defecto (ADMIN y CAJERO)...');
      
      const adminPinHash = await bcrypt.hash('1234', 10);
      const cajeroPinHash = await bcrypt.hash('0000', 10);

      await this.prisma.user.createMany({
        data: [
          {
            name: 'Administrador',
            role: 'ADMIN',
            pin: adminPinHash,
          },
          {
            name: 'Cajero Principal',
            role: 'CAJERO',
            pin: cajeroPinHash,
          },
        ],
      });
      console.log('Sembrado completado con éxito.');
    }
  }

  async verifyPin(pin: string): Promise<{ role: string; token: string; name: string }> {
    const users = await this.prisma.user.findMany();
    
    for (const user of users) {
      const isMatch = await bcrypt.compare(pin, user.pin);
      if (isMatch) {
        const payload = { role: user.role, sub: user.role, userId: user.id };
        const token = this.jwtService.sign(payload);
        return { role: user.role, token, name: user.name };
      }
    }
    
    throw new UnauthorizedException('El PIN de seguridad ingresado es incorrecto.');
  }

  async changePin(userId: string, currentPin: string, newPin: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const isMatch = await bcrypt.compare(currentPin, user.pin);
    if (!isMatch) {
      throw new UnauthorizedException('El PIN actual es incorrecto.');
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    return { message: 'El PIN ha sido actualizado con éxito.' };
  }
}
