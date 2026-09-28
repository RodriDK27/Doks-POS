import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddPurchaseDetailDto, CreatePurchaseDto } from './dto/create-purchase.dto';
import { UploadedImageFile, deleteImageFile, saveImageFile } from '../../common/images/image-storage';
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
    // 1. Validar o buscar proveedor
    let supplier: any = null;
    if (dto.supplierId) {
      supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`El proveedor con ID ${dto.supplierId} no existe.`);
      }
    } else {
      supplier = await this.prisma.supplier.findFirst({
        where: { name: 'Proveedores Diarios' },
      });
      if (!supplier) {
        supplier = await this.prisma.supplier.create({
          data: {
            name: 'Proveedores Diarios',
            visitFrequency: 'WEEKLY',
          },
        });
      }
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

    const hasItems = Array.isArray(dto.items) && dto.items.length > 0;
    let total = 0;
    let productsMap = new Map<string, any>();

    if (hasItems) {
      // 3. Obtener los productos involucrados
      const productIds = dto.items!.map((i) => i.productId);
      const dbProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      productsMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Calcular el total de la compra
      for (const item of dto.items!) {
        const product = productsMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`El producto con ID ${item.productId} no existe en el catálogo.`);
        }
        total += item.costPrice * item.quantity;
      }
    } else {
      if (!dto.total || dto.total <= 0) {
        throw new BadRequestException('Debes especificar un monto total o incluir productos para registrar el pago.');
      }
      total = dto.total;
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
          supplierId: supplier.id,
          total,
          notes: dto.notes || null,
          payFromRegister: source === 'CAJA_CHICA',
          paymentSource: source,
          cashRegisterId: activeRegister ? activeRegister.id : null,
          needsDetail: !hasItems && !!dto.needsDetail,
        },
      });

      // B. Procesar cada item si existen productos especificados
      if (hasItems) {
        for (const item of dto.items!) {
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
      }

      // Si se especificó un ticket pendiente de liquidar, marcarlo como PAID
      if (dto.settleTicketId) {
        await tx.supplierPendingTicket.updateMany({
          where: { id: dto.settleTicketId, status: 'PENDING' },
          data: { status: 'PAID' },
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
        const desc = dto.notes
          ? `Pago a proveedor: ${supplier.name} (${dto.notes})`
          : `Pago a proveedor: ${supplier.name} - Compra ID: ${purchase.id.substring(0, 8)}`;

        await tx.cashTransaction.create({
          data: {
            cashRegisterId: activeRegister.id,
            amount: -total, // egreso negativo
            type: 'EGRESO',
            description: desc,
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

  // ─── PAGOS DEL MODO ABUELA: FOTO DE LA NOTA Y DETALLE PENDIENTE ───────────────

  /** Guarda (o reemplaza) la foto de la nota del proveedor */
  async setReceipt(id: string, file?: UploadedImageFile) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id } });
    if (!purchase) {
      throw new NotFoundException(`La compra con ID ${id} no existe.`);
    }
    const receiptImageUrl = await saveImageFile(`receipt-${id}`, file);
    const updated = await this.prisma.purchase.update({ where: { id }, data: { receiptImageUrl } });
    await deleteImageFile(purchase.receiptImageUrl);
    return updated;
  }

  /** Pagos a proveedores hechos sin capturar productos, para que el administrador los complete */
  async findPendingDetail() {
    return this.prisma.purchase.findMany({
      where: { needsDetail: true },
      orderBy: { createdAt: 'asc' },
      include: { supplier: { select: { id: true, name: true, logoUrl: true } } },
    });
  }

  async countPendingDetail() {
    return this.prisma.purchase.count({ where: { needsDetail: true } });
  }

  /**
   * Captura los productos que llegaron en un pago sin detalle: sube el inventario y el costo,
   * pero NO vuelve a mover dinero (ya salió cuando se pagó). Sin productos, solo se marca como revisado.
   */
  async addDetail(id: string, dto: AddPurchaseDetailDto) {
    const items = dto.items ?? [];
    const productIds = items.map((i) => i.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productsMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      if (!productsMap.has(item.productId)) {
        throw new NotFoundException(`El producto con ID ${item.productId} no existe en el catálogo.`);
      }
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Filtro por needsDetail dentro del update: si dos pantallas capturan al mismo tiempo, solo una sube el stock
      const { count } = await tx.purchase.updateMany({ where: { id, needsDetail: true }, data: { needsDetail: false } });
      if (count === 0) {
        const exists = await tx.purchase.findUnique({ where: { id }, select: { id: true } });
        throw exists
          ? new BadRequestException('Esta compra ya tiene sus productos capturados.')
          : new NotFoundException(`La compra con ID ${id} no existe.`);
      }

      const purchase = await tx.purchase.findUniqueOrThrow({ where: { id }, include: { supplier: true } });
      for (const item of items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: id,
            productId: item.productId,
            costPrice: item.costPrice,
            quantity: item.quantity,
            total: item.costPrice * item.quantity,
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, purchasePrice: item.costPrice },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: `Compra a proveedor: ${purchase.supplier.name} (capturada después del pago)`,
          },
        });
      }

      return tx.purchase.findUnique({
        where: { id },
        include: { supplier: true, items: { include: { product: true } } },
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
