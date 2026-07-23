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
}
