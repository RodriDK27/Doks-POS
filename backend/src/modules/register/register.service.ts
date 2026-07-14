import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RegisterService {
  constructor(private readonly prisma: PrismaService) {}

  // Abrir una sesión de caja
  async open(dto: OpenRegisterDto) {
    // Verificar si ya hay una caja abierta
    const activeRegister = await this.getActive();
    if (activeRegister) {
      throw new BadRequestException('Ya existe una sesión de caja abierta. Debe cerrarla antes de abrir una nueva.');
    }

    return this.prisma.cashRegister.create({
      data: {
        openedBy: dto.openedBy,
        initialBalance: dto.initialBalance,
        expectedBalance: dto.initialBalance, // Al abrir, el saldo esperado es igual al inicial
        status: 'ABIERTO',
      },
    });
  }

  // Obtener la caja activa actualmente
  async getActive() {
    return this.prisma.cashRegister.findFirst({
      where: { status: 'ABIERTO' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Cerrar la sesión de caja activa
  async close(dto: CloseRegisterDto) {
    const activeRegister = await this.getActive();
    if (!activeRegister) {
      throw new BadRequestException('No hay ninguna sesión de caja abierta para cerrar.');
    }

    return this.prisma.cashRegister.update({
      where: { id: activeRegister.id },
      data: {
        closedAt: new Date(),
        actualBalance: dto.actualBalance,
        status: 'CERRADO',
        notes: dto.notes,
      },
    });
  }

  // Registrar un ingreso o egreso de efectivo manual
  async createTransaction(dto: CreateTransactionDto) {
    const activeRegister = await this.getActive();
    if (!activeRegister) {
      throw new BadRequestException('No se pueden registrar movimientos de efectivo si la caja está cerrada.');
    }

    // Convertir a negativo si es salida de efectivo
    const adjustedAmount = dto.type === 'EGRESO' ? -dto.amount : dto.amount;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear la transacción de caja
      const transaction = await tx.cashTransaction.create({
        data: {
          cashRegisterId: activeRegister.id,
          amount: adjustedAmount,
          type: dto.type,
          description: dto.description,
        },
      });

      // 2. Afectar el balance esperado de la caja activa
      const updatedRegister = await tx.cashRegister.update({
        where: { id: activeRegister.id },
        data: {
          expectedBalance: activeRegister.expectedBalance + adjustedAmount,
        },
      });

      return { transaction, register: updatedRegister };
    });
  }

  // Actualizar el balance esperado por ventas (usado por el módulo de Ventas al cobrar en EFECTIVO)
  async addToExpectedBalance(id: string, amount: number) {
    const register = await this.prisma.cashRegister.findUnique({ where: { id } });
    if (!register) {
      throw new NotFoundException(`La caja con ID ${id} no existe.`);
    }

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        expectedBalance: register.expectedBalance + amount,
      },
    });
  }

  // Listar todas las sesiones de caja (historial de cortes)
  async findAll() {
    return this.prisma.cashRegister.findMany({
      orderBy: { openedAt: 'desc' },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });
  }

  // Ver detalles de una sesión de caja por ID (incluyendo transacciones y ventas)
  async findOne(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!register) {
      throw new NotFoundException(`La sesión de caja con ID ${id} no existe.`);
    }

    return register;
  }
}
