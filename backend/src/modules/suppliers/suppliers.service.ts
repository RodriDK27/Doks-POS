import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { name: createSupplierDto.name },
    });
    if (existing) {
      throw new BadRequestException(`El proveedor "${createSupplierDto.name}" ya existe.`);
    }

    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.findOne(id);

    if (updateSupplierDto.name && updateSupplierDto.name !== supplier.name) {
      const existing = await this.prisma.supplier.findUnique({
        where: { name: updateSupplierDto.name },
      });
      if (existing) {
        throw new BadRequestException(`Ya existe otro proveedor con el nombre "${updateSupplierDto.name}".`);
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  async getTodaySchedule() {
    const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = daysMap[new Date().getDay()];

    const allSuppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        pendingTickets: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const todayOrders = allSuppliers.filter((s) => s.orderDays?.includes(todayName));
    const todayDeliveries = allSuppliers.filter((s) => s.deliveryDays?.includes(todayName));

    // Obtener productos con stock crítico o bajo de estos proveedores
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        stock: { lte: this.prisma.product.fields.minStock },
      },
      take: 10,
    });

    return {
      todayName,
      orderSuppliers: todayOrders,
      deliverySuppliers: todayDeliveries,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  }

  // ─── GESTIÓN DE TICKETS PENDIENTES DE PAGO ──────────────────────────────────
  async createPendingTicket(data: { supplierId: string; amount: number; scheduledDate?: string; notes?: string }) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw new NotFoundException(`El proveedor no existe.`);

    return this.prisma.supplierPendingTicket.create({
      data: {
        supplierId: data.supplierId,
        amount: data.amount,
        scheduledDate: data.scheduledDate || null,
        notes: data.notes || null,
        status: 'PENDING',
      },
      include: {
        supplier: true,
      },
    });
  }

  async findAllPendingTickets() {
    return this.prisma.supplierPendingTicket.findMany({
      where: { status: 'PENDING' },
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllTicketsHistory() {
    return this.prisma.supplierPendingTicket.findMany({
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async payPendingTicket(id: string, data: { payFromRegister?: boolean; amountPaid?: number }) {
    const ticket = await this.prisma.supplierPendingTicket.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!ticket) throw new NotFoundException(`El ticket pendiente no existe.`);
    if (ticket.status === 'PAID') throw new BadRequestException(`Este ticket ya fue pagado.`);

    const finalAmount = data.amountPaid && data.amountPaid > 0 ? data.amountPaid : ticket.amount;

    return this.prisma.$transaction(async (tx) => {
      // 1. Marcar ticket como pagado
      const updatedTicket = await tx.supplierPendingTicket.update({
        where: { id },
        data: {
          status: 'PAID',
          amount: finalAmount,
        },
        include: { supplier: true },
      });

      // 2. Si se pagó desde caja chica, descontar del balance y registrar egreso
      if (data.payFromRegister) {
        const activeRegister = await tx.cashRegister.findFirst({
          where: { status: 'ABIERTO' },
        });

        if (activeRegister) {
          await tx.cashRegister.update({
            where: { id: activeRegister.id },
            data: {
              expectedBalance: activeRegister.expectedBalance - finalAmount,
            },
          });

          await tx.cashTransaction.create({
            data: {
              cashRegisterId: activeRegister.id,
              amount: -finalAmount,
              type: 'EGRESO',
              description: `Pago de Ticket Previo a Proveedor: ${ticket.supplier.name} (${ticket.notes || 'Preventa'})`,
            },
          });
        }
      }

      return updatedTicket;
    });
  }

  async cancelPendingTicket(id: string) {
    return this.prisma.supplierPendingTicket.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
