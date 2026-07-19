import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { RegisterService } from '../register/register.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registerService: RegisterService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    // 1. Validar que el proveedor exista
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${dto.supplierId} no existe.`);
    }

    // 2. Si se paga desde caja, verificar turno activo
    let activeRegister: any = null;
    if (dto.payFromRegister) {
      activeRegister = await this.registerService.getActive();
      if (!activeRegister) {
        throw new BadRequestException('No se puede pagar desde caja porque no hay una sesión de caja abierta activa.');
      }
    }

    // 3. Obtener los productos involucrados
    const productIds = dto.items.map((i) => i.productId);
    const dbProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Calcular el total de la compra
    let total = 0;
    for (const item of dto.items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`El producto con ID ${item.productId} no existe en el catálogo.`);
      }
      total += item.costPrice * item.quantity;
    }

    // 4. Iniciar transacción en Prisma
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // A. Crear la cabecera de la compra
      const purchase = await tx.purchase.create({
        data: {
          supplierId: dto.supplierId,
          total,
          notes: dto.notes || null,
          payFromRegister: !!dto.payFromRegister,
          cashRegisterId: activeRegister ? activeRegister.id : null,
        },
      });

      // B. Procesar cada item: crear el detalle, sumar stock, actualizar costo
      for (const item of dto.items) {
        const product = productsMap.get(item.productId)!;

        // Registrar detalle de la compra
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            costPrice: item.costPrice,
            quantity: item.quantity,
            total: item.costPrice * item.quantity,
          },
        });

        // Actualizar stock e incrementar el costo de compra en el catálogo
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock + item.quantity,
            purchasePrice: item.costPrice, // Actualizar costo al último precio de adquisición
          },
        });

        // Registrar movimiento de stock tipo ENTRADA
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: `Compra a proveedor: ${supplier.name}`,
          },
        });

      }

      // C. Si se pagó con caja chica, restar del cajón y crear un egreso
      if (dto.payFromRegister && activeRegister) {
        const register = await tx.cashRegister.findUnique({ where: { id: activeRegister.id } });
        if (!register) {
          throw new NotFoundException(`La caja activa no existe.`);
        }

        // Restar balance esperado
        await tx.cashRegister.update({
          where: { id: activeRegister.id },
          data: {
            expectedBalance: register.expectedBalance - total,
          },
        });

        // Registrar el egreso en la bitácora de transacciones
        await tx.cashTransaction.create({
          data: {
            cashRegisterId: activeRegister.id,
            amount: -total, // egreso negativo
            type: 'EGRESO',
            description: `Pago a proveedor: ${supplier.name} - Compra ID: ${purchase.id.substring(0, 8)}`,
          },
        });
      }

      return tx.purchase.findUnique({
        where: { id: purchase.id },
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

  // Listar todas las compras
  async findAll() {
    return this.prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: { name: true },
        },
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });
  }
}
