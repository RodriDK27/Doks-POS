'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductImageSrc } from '@/lib/productImages';

interface ProductImageProps {
  /** Ruta guardada en el producto o la categoría (ej. /api/images/x.webp) */
  imageUrl?: string | null;
  className?: string;
  /** Tamaño del ícono cuando no hay foto */
  iconClassName?: string;
}

/**
 * Foto encuadrada: siempre llena el cuadro (recorta lo que sobre por los lados) para que todas
 * se vean parejas sin importar su tamaño. Sin foto, o si no carga (ej. sin conexión), muestra un ícono.
 */
export function ProductImage({ imageUrl, className, iconClassName }: ProductImageProps) {
  const src = getProductImageSrc(imageUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;

  return (
    <div className={cn('bg-white dark:bg-slate-950/60 overflow-hidden flex items-center justify-center', className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
        <img
          src={src}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          draggable={false}
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageIcon className={cn('h-1/3 w-1/3 max-h-8 max-w-8 text-slate-300 dark:text-slate-700', iconClassName)} />
      )}
    </div>
  );
}
