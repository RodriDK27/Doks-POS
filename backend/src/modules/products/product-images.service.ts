import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

/** Prefijo público bajo el que se sirven las fotos (ver main.ts) */
export const IMAGES_PUBLIC_PREFIX = '/api/images/';

/** Tamaño máximo aceptado: el frontend ya envía la foto comprimida (~15-40 KB) */
export const MAX_IMAGE_BYTES = 512 * 1024;

/**
 * Carpeta donde se guardan las fotos. En Railway debe apuntar a un Volume
 * (ej. IMAGES_DIR=/data/images), porque el disco del contenedor se borra en cada deploy.
 */
export function getImagesDir(): string {
  const dir = path.resolve(process.env.IMAGES_DIR || path.join(process.cwd(), 'uploads', 'images'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export interface UploadedImageFile {
  buffer: Buffer;
  size: number;
}

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Guarda la foto WebP de un producto y reemplaza la anterior si existía
  async setImage(productId: string, file?: UploadedImageFile) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('No se recibió ninguna imagen.');
    }
    const extension = this.detectExtension(file.buffer);
    if (!extension) {
      throw new BadRequestException('La imagen debe estar en formato WebP o JPEG.');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`El producto con ID ${productId} no fue encontrado.`);
    }
    const previousUrl = product.imageUrl;

    // Nombre con timestamp: cada foto nueva tiene URL distinta, así el caché inmutable nunca muestra una vieja
    const fileName = `${productId}-${Date.now()}.${extension}`;
    const dir = getImagesDir();
    const finalPath = path.join(dir, fileName);
    const tmpPath = `${finalPath}.tmp`;
    await fs.promises.writeFile(tmpPath, file.buffer);
    await fs.promises.rename(tmpPath, finalPath);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: `${IMAGES_PUBLIC_PREFIX}${fileName}` },
      include: { barcodes: true },
    });

    await this.deleteFile(previousUrl);
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

    await this.deleteFile(previousUrl);
    return updated;
  }

  // Borra el archivo físico de una foto; si ya no existe, lo ignora
  async deleteFile(imageUrl?: string | null) {
    if (!imageUrl || !imageUrl.startsWith(IMAGES_PUBLIC_PREFIX)) return;
    // basename evita que una URL manipulada apunte fuera de la carpeta de imágenes
    const fileName = path.basename(imageUrl);
    await fs.promises.unlink(path.join(getImagesDir(), fileName)).catch(() => {});
  }

  // Identifica el formato por su firma de bytes (no por la extensión ni el mimetype, que el cliente controla).
  // JPEG se acepta como respaldo porque Safari no sabe codificar WebP desde canvas.
  private detectExtension(buffer: Buffer): 'webp' | 'jpg' | null {
    if (
      buffer.length > 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }
    if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpg';
    }
    return null;
  }
}
