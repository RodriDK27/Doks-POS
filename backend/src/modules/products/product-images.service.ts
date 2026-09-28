import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadedImageFile, deleteImageFile, saveImageFile } from '../../common/images/image-storage';

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Guarda la foto WebP de un producto y reemplaza la anterior si existía
  async setImage(productId: string, file?: UploadedImageFile) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${productId} no fue encontrado.`);
    }
    const previousUrl = product.imageUrl;
    const imageUrl = await saveImageFile(productId, file);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
      include: { barcodes: true },
    });

    await deleteImageFile(previousUrl);
    return updated;
  }

  // Quita la foto de un producto
  async removeImage(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${productId} no fue encontrado.`);
    }
    const previousUrl = product.imageUrl;

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: null },
      include: { barcodes: true },
    });

    await deleteImageFile(previousUrl);
    return updated;
  }
}
