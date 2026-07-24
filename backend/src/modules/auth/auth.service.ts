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
      console.log('Sembrando usuario Administrador por defecto...');
      
      const adminPinHash = await bcrypt.hash('1234', 10);

      await this.prisma.user.create({
        data: {
          name: 'Administrador',
          role: 'ADMIN',
          pin: adminPinHash,
        },
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

  async getCashiers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        hourlyRate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCashier(name: string, pin?: string, hourlyRate?: number, role?: string) {
    const pinToHash = pin && pin.length === 4 ? pin : '0000';
    const cajeroPinHash = await bcrypt.hash(pinToHash, 10);
    const assignedRole = role === 'GERENTE' ? 'GERENTE' : 'CAJERO';

    return this.prisma.user.create({
      data: {
        name,
        role: assignedRole,
        pin: cajeroPinHash,
        hourlyRate: hourlyRate || 0,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async deleteCashier(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException('Cajero no encontrado.');
    if (user.role === 'ADMIN') throw new UnauthorizedException('No se puede eliminar la cuenta de Administrador.');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Cajero eliminado con éxito.' };
  }

  async updateCashier(id: string, data: { name?: string; pin?: string; hourlyRate?: number; role?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException('Cajero no encontrado.');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.role && user.role !== 'ADMIN') {
      if (['GERENTE', 'CAJERO'].includes(data.role)) {
        updateData.role = data.role;
      }
    }
    if (data.pin && data.pin.length === 4) {
      updateData.pin = await bcrypt.hash(data.pin, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        hourlyRate: true,
        createdAt: true,
      },
    });
  }
}
