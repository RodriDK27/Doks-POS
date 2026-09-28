import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** Prefijo público bajo el que se sirven las imágenes (ver main.ts) */
export const IMAGES_PUBLIC_PREFIX = '/api/images/';

/**
 * Tamaño máximo aceptado. El frontend ya envía la imagen comprimida:
 * fotos de producto y logos ~15-40 KB, fotos de notas (más grandes para poder leerlas) ~100-300 KB.
 */
export const MAX_IMAGE_BYTES = 512 * 1024;

/**
 * Carpeta donde se guardan las imágenes. En Railway debe apuntar a un Volume
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

/**
 * Valida y guarda una imagen. Devuelve su URL pública.
 * El nombre lleva timestamp: cada imagen nueva tiene URL distinta, así el caché inmutable nunca muestra una vieja.
 */
export async function saveImageFile(baseName: string, file?: UploadedImageFile): Promise<string> {
  if (!file || !file.buffer?.length) {
    throw new BadRequestException('No se recibió ninguna imagen.');
  }
  const extension = detectImageExtension(file.buffer);
  if (!extension) {
    throw new BadRequestException('La imagen debe estar en formato WebP o JPEG.');
  }

  const fileName = `${baseName}-${Date.now()}.${extension}`;
  const finalPath = path.join(getImagesDir(), fileName);
  const tmpPath = `${finalPath}.tmp`;
  await fs.promises.writeFile(tmpPath, file.buffer);
  await fs.promises.rename(tmpPath, finalPath);
  return `${IMAGES_PUBLIC_PREFIX}${fileName}`;
}

/** Borra el archivo físico de una imagen; si ya no existe, lo ignora */
export async function deleteImageFile(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(IMAGES_PUBLIC_PREFIX)) return;
  // basename evita que una URL manipulada apunte fuera de la carpeta de imágenes
  const fileName = path.basename(imageUrl);
  await fs.promises.unlink(path.join(getImagesDir(), fileName)).catch(() => {});
}

// Identifica el formato por su firma de bytes (no por la extensión ni el mimetype, que el cliente controla).
// JPEG se acepta como respaldo porque Safari no sabe codificar WebP desde canvas.
function detectImageExtension(buffer: Buffer): 'webp' | 'jpg' | null {
  if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  return null;
}
