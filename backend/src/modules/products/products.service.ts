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
}
