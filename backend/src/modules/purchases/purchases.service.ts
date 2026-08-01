import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { RegisterService } from '../register/register.service';
import { VaultService } from '../vault/vault.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registerService: RegisterService,
    private readonly vaultService: VaultService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    // 1. Validar que el proveedor exista
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${dto.supplierId} no existe.`);
    }

    const source = dto.paymentSource || (dto.payFromRegister ? 'CAJA_CHICA' : 'CREDITO');

    // 2. Si se paga desde caja chica, verificar turno activo
    let activeRegister: any = null;
    if (source === 'CAJA_CHICA') {
      activeRegister = await this.registerService.getActive();
      if (!activeRegister) {
        throw new BadRequestException('No se puede pagar desde caja chica porque no hay una sesión abierta.');
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

    // 4. Si se paga desde Caja Grande, verificar que haya saldo suficiente
    if (source === 'CAJA_GRANDE') {
      const { vault } = await this.vaultService.getVaultState();
      if (vault.balance < total) {
        throw new BadRequestException(
          `Saldo insuficiente en Caja Grande ($${vault.balance.toFixed(2)}) para pagar la compra ($${total.toFixed(2)}).`
        );
      }
    }

    // 5. Iniciar transacción en Prisma
    const createdPurchase = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // A. Crear la cabecera de la compra
      const purchase = await tx.purchase.create({
        data: {
          supplierId: dto.supplierId,
          total,
          notes: dto.notes || null,
          payFromRegister: source === 'CAJA_CHICA',
          paymentSource: source,
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
      if (source === 'CAJA_CHICA' && activeRegister) {
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

    if (source === 'CAJA_GRANDE') {
      await this.vaultService.deductForSupplierPayment(
        createdPurchase!.id,
        total,
        `Pago a proveedor: ${supplier.name}`,
      );
    }

    return createdPurchase;
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
