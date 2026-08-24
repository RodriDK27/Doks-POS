import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper para validar que un código de barras no esté asignado a otro producto
  private async checkBarcodeUniqueness(barcode: string, excludeProductId?: string) {
    const clean = barcode.trim();
    if (!clean) return;

    // 1. Checar en el campo principal de Product
    const existingMain = await this.prisma.product.findUnique({
      where: { barcode: clean },
    });
    if (existingMain && existingMain.id !== excludeProductId) {
      throw new BadRequestException(`El código "${clean}" ya pertenece al producto "${existingMain.name}" como código principal.`);
    }

    // 2. Checar en los códigos secundarios (ProductBarcode)
    const existingSecondary = await this.prisma.productBarcode.findUnique({
      where: { barcode: clean },
      include: { product: true },
    });
    if (existingSecondary && existingSecondary.productId !== excludeProductId) {
      throw new BadRequestException(`El código "${clean}" ya está asignado como código secundario al producto "${existingSecondary.product.name}".`);
    }
  }

  // Crear un producto nuevo
  async create(createProductDto: CreateProductDto) {
    const { additionalBarcodes, ...productData } = createProductDto;

    // Si tiene código de barras principal, validar que sea único
    if (productData.barcode && productData.barcode.trim()) {
      await this.checkBarcodeUniqueness(productData.barcode.trim());
    }

    // Validar códigos secundarios si vienen en la creación
    const validSecondaryBarcodes: Array<{ barcode: string; label?: string | null }> = [];
    if (additionalBarcodes && Array.isArray(additionalBarcodes)) {
      for (const item of additionalBarcodes) {
        const rawCode = typeof item === 'string' ? item : item.barcode;
        const rawLabel = typeof item === 'string' ? null : (item.label ?? null);
        const code = rawCode ? rawCode.trim() : '';
        if (code) {
          if (productData.barcode && code === productData.barcode.trim()) {
            continue; // Evitar duplicar el principal en los secundarios
          }
          if (validSecondaryBarcodes.some(b => b.barcode === code)) {
            continue; // Evitar duplicados dentro del mismo array
          }
          await this.checkBarcodeUniqueness(code);
          validSecondaryBarcodes.push({ barcode: code, label: rawLabel });
        }
      }
    }

    if (productData.category && productData.category.trim()) {
      const catName = productData.category.trim();
      await this.prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName, description: 'Categoría registrada automáticamente desde producto' },
      }).catch(() => {});
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        barcode: productData.barcode ? productData.barcode.trim() : null,
        barcodes: validSecondaryBarcodes.length > 0 ? {
          create: validSecondaryBarcodes.map(b => ({
            barcode: b.barcode,
            label: b.label || null,
          })),
        } : undefined,
      },
      include: {
        barcodes: true,
      },
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

    if (search && search.trim()) {
      const query = search.trim();
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query } },
        { category: { contains: query, mode: 'insensitive' } },
        { barcodes: { some: { barcode: { contains: query } } } },
      ];
    }

    return this.prisma.product.findMany({
      where: whereClause,
      include: {
        barcodes: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Buscar un producto por ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        barcodes: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${id} no fue encontrado.`);
    }
    return product;
  }

  // Buscar un producto por código de barras (busca en principal y secundarios)
  async findByBarcode(barcode: string) {
    const code = barcode.trim();
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { barcode: code },
          { barcodes: { some: { barcode: code } } },
        ],
      },
      include: {
        barcodes: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Ningún producto tiene el código de barras: ${barcode}`);
    }
    return product;
  }

  // Actualizar un producto
  async update(id: string, updateProductDto: UpdateProductDto) {
    const currentProduct = await this.findOne(id);
    const { additionalBarcodes, ...productData } = updateProductDto;

    // Si se está cambiando el código de barras principal, verificar que no esté duplicado
    if (productData.barcode !== undefined) {
      const newBarcode = productData.barcode ? productData.barcode.trim() : null;
      if (newBarcode && newBarcode !== currentProduct.barcode) {
        await this.checkBarcodeUniqueness(newBarcode, id);
      }
      productData.barcode = newBarcode || undefined;
    }

    if (productData.category && productData.category.trim()) {
      const catName = productData.category.trim();
      await this.prisma.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName, description: 'Categoría registrada automáticamente desde producto' },
      }).catch(() => {});
    }

    // Si se enviaron códigos secundarios, sincronizarlos
    if (additionalBarcodes !== undefined) {
      const validSecondary: Array<{ barcode: string; label?: string | null }> = [];
      const effectiveMainBarcode = productData.barcode !== undefined ? productData.barcode : currentProduct.barcode;

      for (const item of additionalBarcodes) {
        const rawCode = typeof item === 'string' ? item : item.barcode;
        const rawLabel = typeof item === 'string' ? null : (item.label ?? null);
        const code = rawCode ? rawCode.trim() : '';
        if (code) {
          if (effectiveMainBarcode && code === effectiveMainBarcode) {
            continue; // No agregar el principal como secundario
          }
          if (validSecondary.some(b => b.barcode === code)) {
            continue;
          }
          await this.checkBarcodeUniqueness(code, id);
          validSecondary.push({ barcode: code, label: rawLabel });
        }
      }

      // Reemplazar la lista de códigos secundarios
      await this.prisma.productBarcode.deleteMany({
        where: { productId: id },
      });

      if (validSecondary.length > 0) {
        await this.prisma.productBarcode.createMany({
          data: validSecondary.map(b => ({
            productId: id,
            barcode: b.barcode,
            label: b.label || null,
          })),
        });
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: productData,
      include: {
        barcodes: true,
      },
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

  // Vincular un nuevo código de barras rápido a un producto existente (Quick-Link desde POS o Catálogo)
  async addBarcode(productId: string, barcode: string, label?: string) {
    const cleanCode = barcode.trim();
    if (!cleanCode) {
      throw new BadRequestException('El código de barras no puede estar vacío.');
    }

    const product = await this.findOne(productId);

    if (product.barcode === cleanCode) {
      return product; // Ya es el código principal
    }

    await this.checkBarcodeUniqueness(cleanCode, productId);

    // Si ya existe en secundarios de este mismo producto, solo actualizar etiqueta
    const existing = await this.prisma.productBarcode.findFirst({
      where: { productId, barcode: cleanCode },
    });

    if (!existing) {
      await this.prisma.productBarcode.create({
        data: {
          productId,
          barcode: cleanCode,
          label: label?.trim() || null,
        },
      });
    }

    return this.findOne(productId);
  }

  // Desvincular un código de barras secundario
  async removeBarcode(productId: string, barcodeOrId: string) {
    await this.findOne(productId);

    await this.prisma.productBarcode.deleteMany({
      where: {
        productId,
        OR: [
          { id: barcodeOrId },
          { barcode: barcodeOrId },
        ],
      },
    });

    return this.findOne(productId);
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

  // Obtener categorías únicas registradas y de productos
  async getCategories() {
    const categoriesFromDb = await this.prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const productCategories = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categorySet = new Set<string>();
    categoriesFromDb.forEach((c) => categorySet.add(c.name));
    productCategories.forEach((p) => {
      if (p.category && p.category.trim()) categorySet.add(p.category.trim());
    });

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }

  // Crear o actualizar un solo producto durante la importación (Upsert inteligente)
  async upsertSingleProduct(row: CreateProductDto) {
    let existingProduct = null;

    // 1. Intentar buscar por código de barras si la fila cuenta con uno
    if (row.barcode && row.barcode.trim() !== '') {
      existingProduct = await this.prisma.product.findUnique({
        where: { barcode: row.barcode.trim() },
      });
    }

    // 2. Si no se encontró por código de barras o no tiene código, buscar por nombre exacto (insensible a mayúsculas)
    if (!existingProduct && row.name && row.name.trim() !== '') {
      existingProduct = await this.prisma.product.findFirst({
        where: {
          name: {
            equals: row.name.trim(),
            mode: 'insensitive',
          },
        },
      });
    }

    if (existingProduct) {
      // Si el código de barras cambió a otro valor nuevo en la fila, verificar que no esté ocupado por un tercer producto
      if (row.barcode && row.barcode.trim() !== '' && row.barcode.trim() !== existingProduct.barcode) {
        const barcodeConflict = await this.prisma.product.findUnique({
          where: { barcode: row.barcode.trim() },
        });
        if (barcodeConflict && barcodeConflict.id !== existingProduct.id) {
          throw new BadRequestException(`El código de barras "${row.barcode}" ya pertenece a otro producto (${barcodeConflict.name}).`);
        }
      }

      // Actualizar el producto existente
      return this.update(existingProduct.id, {
        name: row.name ? row.name.trim() : existingProduct.name,
        barcode: row.barcode ? row.barcode.trim() : (existingProduct.barcode ?? undefined),
        category: row.category !== undefined ? row.category : (existingProduct.category ?? undefined),
        purchasePrice: row.purchasePrice !== undefined ? row.purchasePrice : existingProduct.purchasePrice,
        sellPrice: row.sellPrice !== undefined ? row.sellPrice : existingProduct.sellPrice,
        wholesalePrice: row.wholesalePrice !== undefined ? row.wholesalePrice : (existingProduct.wholesalePrice ?? undefined),
        stock: row.stock !== undefined ? row.stock : existingProduct.stock,
        minStock: row.minStock !== undefined ? row.minStock : existingProduct.minStock,
        unitType: row.unitType !== undefined ? row.unitType : existingProduct.unitType,
      });
    }

    // Si no existe, crear producto nuevo
    const { _errors, ...cleanRow } = row as any;
    return this.create({
      ...cleanRow,
      name: row.name.trim(),
      barcode: row.barcode ? row.barcode.trim() : undefined,
    });
  }

  // Importación masiva de productos desde CSV (con soporte de Upsert / Actualización)
  async importProducts(rows: CreateProductDto[]) {
    const created: string[] = [];
    const updated: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const name = row?.name ?? `Fila ${index + 1}`;
      try {
        // Verificar si ya existía antes de hacer el upsert para saber si fue creado o actualizado
        let wasExisting = false;
        if (row.barcode && row.barcode.trim() !== '') {
          const p = await this.prisma.product.findUnique({ where: { barcode: row.barcode.trim() } });
          if (p) wasExisting = true;
        }
        if (!wasExisting && row.name && row.name.trim() !== '') {
          const p = await this.prisma.product.findFirst({
            where: { name: { equals: row.name.trim(), mode: 'insensitive' } },
          });
          if (p) wasExisting = true;
        }

        await this.upsertSingleProduct(row);

        if (wasExisting) {
          updated.push(name);
        } else {
          created.push(name);
        }
      } catch (err: any) {
        skipped.push({
          name,
          reason: err?.message ?? 'Error al procesar producto',
        });
      }
    }

    return { created, updated, skipped };
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

