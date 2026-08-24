import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyTemplateDto } from './dto/create-daily-template.dto';
import { UpdateDailyTemplateDto } from './dto/update-daily-template.dto';

@Injectable()
export class DailyTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const count = await this.prisma.dailySupplierTemplate.count();
    if (count === 0) {
      await this.seedDefaults();
    }

    return this.prisma.dailySupplierTemplate.findMany({
      where: { isActive: true },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.dailySupplierTemplate.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`La plantilla con ID ${id} no existe.`);
    }

    return template;
  }

  async create(dto: CreateDailyTemplateDto) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.dailySupplierTemplate.create({
        data: {
          name: dto.name.trim(),
          icon: dto.icon || 'Truck',
          color: dto.color || 'indigo',
          supplierId: dto.supplierId || null,
        },
      });

      if (dto.items && dto.items.length > 0) {
        for (const item of dto.items) {
          await tx.dailySupplierTemplateItem.create({
            data: {
              templateId: template.id,
              productId: item.productId,
              defaultQty: item.defaultQty,
              defaultCost: item.defaultCost !== undefined ? item.defaultCost : null,
            },
          });
        }
      }

      return tx.dailySupplierTemplate.findUnique({
        where: { id: template.id },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async update(id: string, dto: UpdateDailyTemplateDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.dailySupplierTemplate.update({
        where: { id },
        data: {
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          icon: dto.icon !== undefined ? dto.icon : undefined,
          color: dto.color !== undefined ? dto.color : undefined,
          supplierId: dto.supplierId !== undefined ? dto.supplierId : undefined,
        },
      });

      if (dto.items !== undefined) {
        // Reemplazar items
        await tx.dailySupplierTemplateItem.deleteMany({
          where: { templateId: id },
        });

        for (const item of dto.items) {
          await tx.dailySupplierTemplateItem.create({
            data: {
              templateId: id,
              productId: item.productId,
              defaultQty: item.defaultQty,
              defaultCost: item.defaultCost !== undefined ? item.defaultCost : null,
            },
          });
        }
      }

      return tx.dailySupplierTemplate.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dailySupplierTemplate.delete({
      where: { id },
    });
  }

  private async seedDefaults() {
    try {
      // Buscar si existen productos relacionados con Pan o Tortilla
      const panProducts = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: 'pan', mode: 'insensitive' } },
            { name: { contains: 'bolillo', mode: 'insensitive' } },
            { name: { contains: 'telera', mode: 'insensitive' } },
            { category: { contains: 'panaderia', mode: 'insensitive' } },
          ],
        },
        take: 3,
      });

      const tortillaProducts = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: 'tortilla', mode: 'insensitive' } },
            { category: { contains: 'tortilleria', mode: 'insensitive' } },
          ],
        },
        take: 2,
      });

      // Crear plantilla de Panadería
      const panTemplate = await this.prisma.dailySupplierTemplate.create({
        data: {
          name: 'Panadería Diaria',
          icon: 'Package',
          color: 'amber',
        },
      });

      for (const prod of panProducts) {
        await this.prisma.dailySupplierTemplateItem.create({
          data: {
            templateId: panTemplate.id,
            productId: prod.id,
            defaultQty: 30,
            defaultCost: prod.purchasePrice || 2,
          },
        });
      }

      // Crear plantilla de Tortillería
      const tortillaTemplate = await this.prisma.dailySupplierTemplate.create({
        data: {
          name: 'Tortillería',
          icon: 'Store',
          color: 'emerald',
        },
      });

      for (const prod of tortillaProducts) {
        await this.prisma.dailySupplierTemplateItem.create({
          data: {
            templateId: tortillaTemplate.id,
            productId: prod.id,
            defaultQty: 5,
            defaultCost: prod.purchasePrice || 20,
          },
        });
      }
    } catch {
      // Ignorar silenciosamente si hay conflicto o la base de datos está vacía
    }
  }
}
