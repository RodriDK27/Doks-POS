import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { RegisterService } from '../register/register.service';
import { CustomersService } from '../customers/customers.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registerService: RegisterService,
    private readonly customersService: CustomersService,
  ) {}

  // Registrar una nueva venta
  async create(dto: CreateSaleDto) {
    // 1. Verificar que haya una caja abierta activa
    const activeRegister = await this.registerService.getActive();
    if (!activeRegister) {
      throw new BadRequestException('No se puede realizar la venta porque no hay una sesión de caja abierta.');
    }

    // 2. Si el pago es "fiado", el cliente es obligatorio
    if (dto.paymentMethod === 'FIADO' && !dto.customerId) {
      throw new BadRequestException('Debe seleccionar un cliente registrado para poder fiar la venta.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto.');
    }

    // 3. Obtener los productos involucrados en la venta y calcular montos
    const productIds = dto.items
      .map((item) => item.productId)
      .filter((id): id is string => !!id);
      
    const dbProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
 
    const productsMap = new Map(dbProducts.map((p) => [p.id, p]));
    let subtotal = 0;
    const itemsToCreate: Array<{
      productId: string | null;
      productName: string;
      price: number;
      quantity: number;
      total: number;
    }> = [];
 
    for (const item of dto.items) {
      let itemPrice = 0;
      let productName = '';

      if (item.productId) {
        const product = productsMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`El producto con ID ${item.productId} no existe en el catálogo.`);
        }
        itemPrice = product.sellPrice;
        productName = product.name;
      } else {
        // Artículo genérico / de venta libre sin ID en catálogo
        if (!item.genericName || item.genericPrice === undefined) {
          throw new BadRequestException('Para artículos genéricos es obligatorio enviar el nombre y el precio.');
        }
        itemPrice = item.genericPrice;
        productName = item.genericName;
      }
 
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;
 
      itemsToCreate.push({
        productId: item.productId || null,
        productName,
        price: itemPrice,
        quantity: item.quantity,
        total: itemSubtotal,
      });
    }

    const discount = dto.discount || 0;
    const total = Math.max(0, subtotal - discount);

    if (discount > subtotal) {
      throw new BadRequestException('El descuento no puede ser mayor que el subtotal de la venta.');
    }

    // 4. Calcular el pago y cambio
    let amountPaid = dto.amountPaid;
    let change = 0;

    if (dto.paymentMethod === 'EFECTIVO') {
      if (amountPaid < total) {
        throw new BadRequestException(`El monto pagado ($${amountPaid}) es menor que el total de la venta ($${total}).`);
      }
      change = amountPaid - total;
    } else {
      // Para Tarjeta, Transferencia o Fiado, el pago coincide con el total y el cambio es 0
      amountPaid = total;
      change = 0;
    }

    // 5. Ejecutar la venta en una transacción SQL para asegurar consistencia
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // A. Crear la venta (Encabezado)
      const sale = await tx.sale.create({
        data: {
          total,
          discount,
          paymentMethod: dto.paymentMethod,
          amountPaid,
          change,
          customerId: dto.customerId || null,
          cashRegisterId: activeRegister.id,
        },
      });

      // B. Procesar cada producto: crear el SaleItem y restar stock
      for (const item of itemsToCreate) {
        // Registrar detalle histórico en ticket
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price as any,
            quantity: item.quantity,
            total: item.total,
          },
        });
 
        // Restar stock si es producto de catálogo, o auto-crear registro en Pendientes de Alta si es Venta Rápida
        if (item.productId) {
          const currentProduct = productsMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Notificar stock crítico si baja del mínimo
          const newStock = currentProduct.stock - item.quantity;
          if (newStock <= currentProduct.minStock) {
            console.warn(
              `Alerta: El producto "${currentProduct.name}" ha alcanzado stock crítico (${newStock} unidades restantes).`,
            );
          }
        } else {
          // Es venta rápida: Registrar automáticamente en la lista de solicitudes / pendientes de alta
          await tx.requestedProduct.create({
            data: {
              name: item.productName,
              quantity: item.quantity,
              notes: `Venta Rápida cobrada a $${item.price.toFixed(2)} (Pendiente de dar de alta en inventario)`,
              status: 'PENDIENTE',
            },
          });
        }

      }

      // C. Si es "FIADO", registrar la deuda del cliente
      if (dto.paymentMethod === 'FIADO' && dto.customerId) {
        // Usamos una función del servicio adaptada para ejecutarse dentro de la transacción de Prisma
        const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
        if (!customer) {
          throw new NotFoundException(`El cliente con ID ${dto.customerId} no existe.`);
        }
        
        const nextDebt = customer.currentDebt + total;

        if (customer.creditLimit > 0 && nextDebt > customer.creditLimit) {
          throw new BadRequestException(
            `El fiado por $${total} excede el límite de crédito del cliente ($${customer.creditLimit}). Deuda actual: $${customer.currentDebt}.`,
          );
        }

        // Crear la transacción de crédito
        await tx.creditTransaction.create({
          data: {
            customerId: dto.customerId,
            amount: -total, // Deuda se registra en negativo en el ledger
            type: 'DEUDA',
            saleId: sale.id,
            notes: `Cargo automático por Ticket de Venta Secuencial #${sale.id}`,
          },
        });

        // Actualizar deuda
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { currentDebt: nextDebt },
        });
      }

      // D. Si es "EFECTIVO", sumar al balance esperado de la caja registradora activa
      if (dto.paymentMethod === 'EFECTIVO') {
        const register = await tx.cashRegister.findUnique({ where: { id: activeRegister.id } });
        if (!register) {
          throw new NotFoundException(`La caja activa no existe.`);
        }
        await tx.cashRegister.update({
          where: { id: activeRegister.id },
          data: {
            expectedBalance: register.expectedBalance + total,
          },
        });
      }

      // Retornar la venta con sus detalles
      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: true,
          customer: true,
        },
      });
    });
  }

  // Obtener historial de ventas
  async findAll() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: {
          select: { name: true },
        },
      },
    });
  }

  // Obtener detalles de una venta
  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        cashRegister: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`El ticket de venta #${id} no existe.`);
    }

    return sale;
  }

  // Obtener estadísticas rápidas (Dashboard / Analytics)
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ventas totales de hoy
    const todaySales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const earningsToday = todaySales.reduce((acc, sale) => acc + sale.total, 0);
    const salesCountToday = todaySales.length;

    // Métodos de pago de hoy
    const methodsDistribution = todaySales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    // Total histórico de productos y alertas de bajo stock
    const productsCount = await this.prisma.product.count();
    const lowStockCount = await this.prisma.product.count({
      where: {
        stock: {
          lte: this.prisma.product.fields.minStock,
        },
      },
    });

    // Clientes deudores y total fiado
    const debtorCustomers = await this.prisma.customer.count({
      where: {
        currentDebt: {
          gt: 0,
        },
      },
    });

    const totalActiveCredit = await this.prisma.customer.aggregate({
      _sum: {
        currentDebt: true,
      },
    });

    return {
      earningsToday,
      salesCountToday,
      methodsDistribution,
      productsCount,
      lowStockCount,
      debtorCustomers,
      totalActiveCredit: totalActiveCredit._sum.currentDebt || 0,
    };
  }

  // Obtener reporte detallado de utilidades y ganancias netas
  async getProfitReport(startDate?: string, endDate?: string) {
    const whereClause: Prisma.SaleWhereInput = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        // Asegurar que abarque desde el inicio del día local
        const start = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00`);
        whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999`);
        whereClause.createdAt.lte = end;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const paymentDistribution: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
      FIADO: 0,
    };

    const bestSellersMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    for (const sale of sales) {
      totalRevenue += sale.total;
      totalDiscount += sale.discount;
      paymentDistribution[sale.paymentMethod] = (paymentDistribution[sale.paymentMethod] || 0) + sale.total;

      for (const item of sale.items) {
        const purchasePrice = item.product ? item.product.purchasePrice : 0;
        const itemCost = purchasePrice * item.quantity;
        const itemProfit = item.total - itemCost;

        totalCost += itemCost;

        const key = item.productId || `generic-${item.productName}`;
        if (!bestSellersMap[key]) {
          bestSellersMap[key] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        bestSellersMap[key].quantity += item.quantity;
        bestSellersMap[key].revenue += item.total;
        bestSellersMap[key].profit += itemProfit;
      }
    }

    const totalProfit = Math.max(0, totalRevenue - totalCost);

    const bestSellers = Object.values(bestSellersMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue,
      totalCost,
      totalDiscount,
      totalProfit,
      paymentDistribution,
      bestSellers,
    };
  }
}
