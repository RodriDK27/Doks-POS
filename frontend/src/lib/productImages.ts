import api from './api';

/** Lado mayor de la foto guardada: suficiente para tarjetas grandes y ligera (~15-40 KB) */
const MAX_SIDE = 480;
const QUALITY = 0.8;

/**
 * Convierte la ruta relativa guardada en el producto (ej. /api/images/x.webp)
 * en una URL absoluta hacia el backend, que puede vivir en otro dominio (Railway).
 */
export function getProductImageSrc(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  const apiBase = api.defaults.baseURL || 'http://localhost:3001/api';
  try {
    return new URL(imageUrl, apiBase).href;
  } catch {
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Lado mayor de la foto de una nota de proveedor: más grande para que se pueda leer */
export const RECEIPT_MAX_SIDE = 1400;

/**
 * Reduce la foto en el navegador antes de subirla, para que el servidor no gaste CPU.
 * Devuelve WebP; si el navegador no sabe codificarlo (Safari), devuelve JPEG.
 */
export async function compressImage(file: File, maxSide: number = MAX_SIDE): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }

  // createImageBitmap respeta la orientación EXIF, así las fotos del celular no salen giradas
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    // Fondo blanco: los PNG con transparencia no quedan negros al pasar a JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const webp = await canvasToBlob(canvas, 'image/webp');
    if (webp && webp.type === 'image/webp') return webp;

    const jpeg = await canvasToBlob(canvas, 'image/jpeg');
    if (jpeg && jpeg.type === 'image/jpeg') return jpeg;

    throw new Error('Este navegador no pudo comprimir la imagen.');
  } finally {
    bitmap.close();
  }
}

/** Comprime y sube una imagen (campo "image") a la ruta indicada. Devuelve la respuesta del backend. */
export async function uploadImage<T>(path: string, file: File, maxSide: number = MAX_SIDE): Promise<T> {
  const blob = await compressImage(file, maxSide);
  const form = new FormData();
  form.append('image', blob, blob.type === 'image/webp' ? 'foto.webp' : 'foto.jpg');
  // Content-Type explícito: con el 'application/json' por defecto del cliente, axios convertiría el FormData a JSON
  const res = await api.post<T>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** Comprime y sube la foto de un producto. Devuelve el producto actualizado. */
export async function uploadProductImage<T>(productId: string, file: File): Promise<T> {
  return uploadImage<T>(`/products/${productId}/image`, file);
}

/** Quita la foto de un producto. Devuelve el producto actualizado. */
export async function removeProductImage<T>(productId: string): Promise<T> {
  const res = await api.delete<T>(`/products/${productId}/image`);
  return res.data;
}
