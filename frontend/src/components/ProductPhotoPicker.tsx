'use client';

import React, { useRef, useState } from 'react';
import { Camera, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc, removeProductImage, uploadProductImage } from '@/lib/productImages';

interface PhotoProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface ProductPhotoPickerProps {
  /** Producto ya guardado; si es null o no tiene id, se pide guardarlo primero */
  product: PhotoProduct | null;
  onChange?: (imageUrl: string | null) => void;
}

/**
 * Foto del producto: se sube en cuanto se elige, sin esperar a "Guardar",
 * y se refresca el catálogo para que el POS la muestre de inmediato.
 */
export function ProductPhotoPicker({ product, onChange }: ProductPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  // Sobrescribe la foto del producto tras subir/quitar, hasta que cambie el producto seleccionado
  const [override, setOverride] = useState<{ productId: string; imageUrl: string | null } | null>(null);

  const productId = product?.id || '';
  const imageUrl = override && override.productId === productId ? override.imageUrl : product?.imageUrl ?? null;
  const src = getProductImageSrc(imageUrl);

  const applyChange = (newUrl: string | null) => {
    setOverride({ productId, imageUrl: newUrl });
    onChange?.(newUrl);
    mutate('/products');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Permite volver a elegir el mismo archivo
    if (!file || !productId) return;

    setIsBusy(true);
    try {
      const updated = await uploadProductImage<PhotoProduct>(productId, file);
      applyChange(updated.imageUrl ?? null);
      toast.success(`Foto de "${product?.name}" guardada.`);
    } catch (err) {
      // Errores de compresión (formato no soportado, ej. HEIC en navegadores viejos) no vienen de axios
      toast.error(
        axios.isAxiosError(err)
          ? parseAxiosError(err, 'No se pudo subir la foto.')
          : 'No se pudo leer la imagen. Intenta con otra foto o tómala de nuevo con la cámara.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!productId) return;
    setIsBusy(true);
    try {
      await removeProductImage(productId);
      applyChange(null);
      toast.success('Foto eliminada.');
    } catch (err) {
      toast.error(parseAxiosError(err, 'No se pudo quitar la foto.'));
    } finally {
      setIsBusy(false);
    }
  };

  if (!productId) {
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500">
        <ImageIcon className="h-5 w-5 shrink-0" />
        <span className="text-[11px] font-bold">Guarda el producto primero para agregarle foto.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
          <img src={src} alt={product?.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
        )}
        {isBusy && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Foto del Producto
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            className="h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>{src ? 'Cambiar foto' : 'Tomar foto'}</span>
          </button>
          {src && (
            <button
              type="button"
              disabled={isBusy}
              onClick={handleRemove}
              title="Quitar foto"
              className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 hover:border-rose-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sin atributo capture: en el celular deja elegir entre cámara y galería */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
