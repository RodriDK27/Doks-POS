import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VaultService } from '../vault/vault.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UploadedImageFile, deleteImageFile, saveImageFile } from '../../common/images/image-storage';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
  ) {}

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
    const supplier = await this.findOne(id);
    const deleted = await this.prisma.supplier.delete({
      where: { id },
    });
    await deleteImageFile(supplier.logoUrl);
    return deleted;
  }

  // ─── LOGO (MODO ABUELA) ─────────────────────────────────────────────────────
  async setLogo(id: string, file?: UploadedImageFile) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no fue encontrado.`);
    }
    const logoUrl = await saveImageFile(`supplier-${id}`, file);
    const updated = await this.prisma.supplier.update({ where: { id }, data: { logoUrl } });
    await deleteImageFile(supplier.logoUrl);
    return updated;
  }

  async removeLogo(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no fue encontrado.`);
    }
    const updated = await this.prisma.supplier.update({ where: { id }, data: { logoUrl: null } });
    await deleteImageFile(supplier.logoUrl);
    return updated;
  }

  /**
   * Proveedores para "Llegó el proveedor" del modo abuela: activos, con logo, monto de siempre,
   * notas de preventa pendientes y si hoy les toca entregar (para mostrarlos primero).
   */
  async findForSimpleMode() {
    const todayName = this.getTodayName();
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true, name: { not: 'Proveedores Diarios' } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        expectedPayment: true,
        deliveryDays: true,
        pendingTickets: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, amount: true, scheduledDate: true, notes: true },
        },
      },
    });

    return suppliers.map(({ deliveryDays, ...supplier }) => ({
      ...supplier,
      comesToday: !!deliveryDays?.split(',').includes(todayName),
    }));
  }

  // Día actual ("Lunes", "Martes"...) respetando la zona horaria de México (America/Mexico_City)
  private getTodayName(): string {
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long',
    });
    const rawDayName = formatter.format(new Date());
    return rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);
  }

  async getTodaySchedule() {
    const todayName = this.getTodayName();

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

  async payPendingTicket(id: string, data: { payFromRegister?: boolean; amountPaid?: number; paymentSource?: string }) {
    const ticket = await this.prisma.supplierPendingTicket.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!ticket) throw new NotFoundException(`El ticket pendiente no existe.`);
    if (ticket.status === 'PAID') throw new BadRequestException(`Este ticket ya fue pagado.`);

    const finalAmount = data.amountPaid && data.amountPaid > 0 ? data.amountPaid : ticket.amount;
    const source = data.paymentSource || (data.payFromRegister ? 'CAJA_CHICA' : 'CAJA_GRANDE');

    if (source === 'CAJA_GRANDE') {
      const { vault } = await this.vaultService.getVaultState();
      if (vault.balance < finalAmount) {
        throw new BadRequestException(
          `Saldo insuficiente en Caja Grande ($${vault.balance.toFixed(2)}) para liquidar el ticket ($${finalAmount.toFixed(2)}).`
        );
      }
    }

    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar ticket como pagado
      const updated = await tx.supplierPendingTicket.update({
        where: { id },
        data: {
          status: 'PAID',
          amount: finalAmount,
        },
        include: { supplier: true },
      });

      // 2. Si se pagó desde caja chica, descontar del balance y registrar egreso
      if (source === 'CAJA_CHICA') {
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

      return updated;
    });

    if (source === 'CAJA_GRANDE') {
      await this.vaultService.deductForSupplierPayment(
        undefined,
        finalAmount,
        `Pago de Ticket a Proveedor: ${ticket.supplier.name} (${ticket.notes || 'Preventa'})`,
      );
    }

    return updatedTicket;
  }

  async cancelPendingTicket(id: string) {
    return this.prisma.supplierPendingTicket.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
