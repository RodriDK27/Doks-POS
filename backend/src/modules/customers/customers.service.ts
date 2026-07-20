import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCreditTransactionDto } from './dto/create-credit-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear un cliente nuevo
  async create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        currentDebt: 0, // Inicia sin deudas
      },
    });
  }

  // Listar todos los clientes (con filtro de búsqueda opcional por nombre o teléfono)
  async findAll(search?: string) {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    return this.prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Buscar un cliente por ID con su historial de transacciones de crédito y ventas
  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limitamos el historial rápido a los últimos 50 movimientos
          include: {
            sale: {
              include: {
                items: true,
              },
            },
          },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Últimas 10 ventas del cliente
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`El cliente con ID ${id} no fue encontrado.`);
    }

    return customer;
  }

  // Actualizar datos del cliente
  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id); // Validar existencia
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  // Eliminar un cliente
  async remove(id: string) {
    const customer = await this.findOne(id);
    if (customer.currentDebt > 0) {
      throw new BadRequestException('No se puede eliminar un cliente que tiene saldo deudor pendiente.');
    }
    return this.prisma.customer.delete({
      where: { id },
    });
  }

  // Registrar un abono (pago) a la cuenta de crédito del cliente
  async registerAbono(id: string, dto: CreateCreditTransactionDto) {
    const customer = await this.findOne(id);

    if (customer.currentDebt <= 0) {
      throw new BadRequestException('El cliente no tiene ninguna deuda pendiente para abonar.');
    }

    const abonoAmount = dto.amount;
    const newDebt = Math.max(0, customer.currentDebt - abonoAmount); // Evitamos saldos negativos si es posible, o los permitimos si abona de más

    // Ejecutamos en transacción de base de datos para asegurar consistencia
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear el registro del movimiento de abono (monto positivo)
      const transaction = await tx.creditTransaction.create({
        data: {
          customerId: id,
          amount: abonoAmount,
          type: 'ABONO',
          notes: dto.notes || 'Abono registrado en caja',
        },
      });

      // 2. Actualizar el saldo del cliente
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: { currentDebt: newDebt },
      });

      return { customer: updatedCustomer, transaction };
    });
  }

  // Registrar un cargo manual de deuda a la cuenta del cliente (fuera de ticket)
  async registerDeudaManual(id: string, dto: CreateCreditTransactionDto) {
    return this.registerDeuda(id, dto.amount, undefined, dto.notes || 'Cargo manual registrado');
  }

  // Registrar una deuda (cargo) tras una venta fiada (se llama desde el módulo de ventas o servicio)
  async registerDeuda(id: string, amount: number, saleId?: number, notes?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`El cliente con ID ${id} no existe.`);
    }

    const nextDebt = customer.currentDebt + amount;

    // Verificar si excede el límite de crédito
    if (customer.creditLimit > 0 && nextDebt > customer.creditLimit) {
      throw new BadRequestException(
        `La venta por $${amount} excede el límite de crédito del cliente ($${customer.creditLimit}). Deuda actual: $${customer.currentDebt}.`,
      );
    }

    // Se ejecuta dentro de la transacción de la venta
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear el registro del cargo (monto negativo)
      await tx.creditTransaction.create({
        data: {
          customerId: id,
          amount: -amount, // Guardamos en negativo para deudas
          type: 'DEUDA',
          saleId,
          notes: notes || 'Cargo por compra de mercancía (Fiado)',
        },
      });

      // 2. Actualizar la deuda actual
      return tx.customer.update({
        where: { id },
        data: { currentDebt: nextDebt },
      });
    });
  }
}
