import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear un producto nuevo
  async create(createProductDto: CreateProductDto) {
    // Si tiene código de barras, validar que sea único
    if (createProductDto.barcode) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { barcode: createProductDto.barcode },
      });
      if (existingProduct) {
        throw new BadRequestException('Ya existe un producto registrado con este código de barras.');
      }
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
    });

    // Registrar movimiento inicial si el stock es > 0
    if (product.stock > 0) {
      await this.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: product.stock,
          reason: 'Stock inicial al crear producto',
        },
      });
    }

    return product;
  }

  // Buscar todos los productos (con filtros opcionales de búsqueda y categoría)
  async findAll(search?: string, category?: string) {
    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { category: { contains: search } },
      ];
    }

    return this.prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  // Buscar un producto por ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${id} no fue encontrado.`);
    }
    return product;
  }

  // Buscar un producto por código de barras (muy utilizado por el lector del POS)
  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
    });
    if (!product) {
      throw new NotFoundException(`Ningún producto tiene el código de barras: ${barcode}`);
    }
    return product;
  }

  // Actualizar un producto
  async update(id: string, updateProductDto: UpdateProductDto) {
    const currentProduct = await this.findOne(id);

    // Si se está cambiando el código de barras, verificar que no esté duplicado
    if (updateProductDto.barcode && updateProductDto.barcode !== currentProduct.barcode) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { barcode: updateProductDto.barcode },
      });
      if (existingProduct) {
        throw new BadRequestException('El nuevo código de barras ya está asignado a otro producto.');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    // Si el stock cambió manualmente, registrar un movimiento de ajuste
    if (updateProductDto.stock !== undefined && updateProductDto.stock !== currentProduct.stock) {
      const diff = updateProductDto.stock - currentProduct.stock;
      await this.prisma.stockMovement.create({
        data: {
          productId: id,
          type: 'AJUSTE',
          quantity: diff,
          reason: `Ajuste manual: de ${currentProduct.stock} a ${updateProductDto.stock}`,
        },
      });
    }

    return updated;
  }

  // Eliminar un producto
  async remove(id: string) {
    await this.findOne(id); // Valida que exista
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Ajustar stock manualmente o tras una venta
  async adjustStock(id: string, quantity: number) {
    const product = await this.findOne(id);
    const newStock = product.stock + quantity;

    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  // Obtener todos los productos con bajo stock (existencia <= stock mínimo)
  async getLowStock() {
    return this.prisma.product.findMany({
      where: {
        stock: {
          lte: this.prisma.product.fields.minStock, // stock <= minStock
        },
      },
      orderBy: { stock: 'asc' },
    });
  }

  // Obtener categorías únicas de productos
  async getCategories() {
    const result = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return result.map((r: { category: string | null }) => r.category).filter(Boolean);
  }

  // Importación masiva de productos desde CSV
  async importProducts(rows: CreateProductDto[]) {
    const results = await Promise.allSettled(
      rows.map((row) => this.create(row)),
    );

    const created: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    results.forEach((result, index) => {
      const name = rows[index]?.name ?? `Fila ${index + 1}`;
      if (result.status === 'fulfilled') {
        created.push(name);
      } else {
        skipped.push({
          name,
          reason: result.reason?.message ?? 'Error desconocido',
        });
      }
    });

    return { created, skipped };
  }

  // Obtener el historial de movimientos de stock de un producto
  async getMovements(productId: string) {
    await this.findOne(productId); // Valida que exista
    return this.prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Obtener estadísticas de ventas por producto (estrellas y menos vendidos)
  async getSalesAnalytics() {
    // 1. Obtener suma de cantidades vendidas agrupadas por producto
    const itemsGrouped = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        total: true,
      },
    });

    // 2. Traer los productos correspondientes para tener los nombres
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        sellPrice: true,
        category: true,
      },
    });

    // Mapear los datos de analíticas
    const productSalesMap = new Map(
      itemsGrouped
        .filter(item => item.productId !== null)
        .map(item => [
          item.productId as string,
          {
            quantitySold: item._sum.quantity || 0,
            totalRevenue: item._sum.total || 0,
          }
        ])
    );

    const analytics = products.map(prod => {
      const saleData = productSalesMap.get(prod.id) || { quantitySold: 0, totalRevenue: 0 };
      return {
        id: prod.id,
        name: prod.name,
        stock: prod.stock,
        sellPrice: prod.sellPrice,
        category: prod.category,
        quantitySold: saleData.quantitySold,
        totalRevenue: saleData.totalRevenue,
      };
    });

    // Separar los más vendidos (top 10 con 5 o más ventas ordenados desc)
    const topSelling = [...analytics]
      .filter(p => p.quantitySold >= 5)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Separar los menos vendidos (artículos con baja rotación: entre 1 y 4 ventas acumuladas, excluyendo 0 ventas)
    const slowMoving = [...analytics]
      .filter(p => p.quantitySold >= 1 && p.quantitySold < 5)
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    return {
      topSelling,
      slowMoving,
    };
  }

  // Registrar merma, daño, producto vencido o consumo interno
  async registerWaste(dto: {
    productId: string;
    type: 'CONSUMO_INTERNO' | 'MERMA_ROTO' | 'MERMA_CADUCADO' | 'DEVOLUCION' | 'AJUSTE';
    quantity: number;
    responsibleName?: string;
    notes?: string;
  }) {
    const product = await this.findOne(dto.productId);

    if (dto.quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    // Calcular cambio de stock (negativo si es merma/consumo, positivo si es devolución)
    const stockChange = dto.type === 'DEVOLUCION' ? Math.abs(dto.quantity) : -Math.abs(dto.quantity);
    const newStock = product.stock + stockChange;

    if (newStock < 0) {
      throw new BadRequestException(`No hay suficiente stock. Stock actual: ${product.stock}`);
    }

    // Definir etiqueta descriptiva para el motivo
    const typeLabels: Record<string, string> = {
      CONSUMO_INTERNO: 'Consumo Interno',
      MERMA_ROTO: 'Producto Roto / Dañado',
      MERMA_CADUCADO: 'Producto Vencido / Caducado',
      DEVOLUCION: 'Devolución a Stock',
      AJUSTE: 'Ajuste Manual',
    };

    const label = typeLabels[dto.type] || dto.type;
    const resp = dto.responsibleName ? ` | Resp: ${dto.responsibleName}` : '';
    const userNotes = dto.notes ? ` (${dto.notes})` : '';
    const reason = `[${label}]${resp}${userNotes}`;

    // Actualizar producto y crear StockMovement en transacción
    const [updatedProduct, movement] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: stockChange,
          reason,
        },
      }),
    ]);

    return { product: updatedProduct, movement };
  }

  // Obtener historial global de mermas y consumos internos
  async getWasteReport(month?: string) {
    const whereClause: any = {
      type: {
        in: ['CONSUMO_INTERNO', 'MERMA_ROTO', 'MERMA_CADUCADO', 'DEVOLUCION'],
      },
    };

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const movements = await this.prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            purchasePrice: true,
            sellPrice: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    // Totales financieros a costo y precio venta
    let totalCostLost = 0;
    let totalSalesLost = 0;

    const formattedMovements = movements.map((mov) => {
      const qty = Math.abs(mov.quantity);
      const cost = (mov.product?.purchasePrice || 0) * qty;
      const sell = (mov.product?.sellPrice || 0) * qty;

      if (mov.type !== 'DEVOLUCION') {
        totalCostLost += cost;
        totalSalesLost += sell;
      }

      return {
        ...mov,
        costValue: cost,
        sellValue: sell,
      };
    });

    return {
      movements: formattedMovements,
      totalCostLost,
      totalSalesLost,
    };
  }
}

