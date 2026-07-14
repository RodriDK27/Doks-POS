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

    return this.prisma.product.create({
      data: createProductDto,
    });
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

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
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
}
