import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestedProductDto } from './dto/create-requested-product.dto';
import { UpdateRequestedProductDto } from './dto/update-requested-product.dto';

@Injectable()
export class RequestedProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRequestedProductDto) {
    return this.prisma.requestedProduct.create({
      data: {
        name: dto.name,
        quantity: dto.quantity ?? 1,
        notes: dto.notes || null,
        status: 'PENDIENTE',
      },
    });
  }

  async findAll() {
    return this.prisma.requestedProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.requestedProduct.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`El artículo solicitado con ID ${id} no existe.`);
    }
    return product;
  }

  async update(id: string, dto: UpdateRequestedProductDto) {
    await this.findOne(id);
    return this.prisma.requestedProduct.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.requestedProduct.delete({
      where: { id },
    });
  }
}
