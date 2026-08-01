'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Barcode, CirclePercent, Plus, Edit3, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { Product } from '../types';
import { CustomSelect } from '@/components/CustomSelect';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  barcode: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
  purchasePrice: z.number().min(0, 'El precio de compra no puede ser negativo'),
  sellPrice: z.number().positive('El precio de venta debe ser mayor a cero'),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  minStock: z.number().min(0, 'El stock mínimo no puede ser negativo'),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormCardProps {
  editingProduct: Product | null;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: string[];
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onCancelEdit: () => void;
  onOpenCategoryManager?: () => void;
}

export function ProductFormCard({
  editingProduct,
  onSubmit,
  categories,
  barcodeInputRef,
  onCancelEdit,
  onOpenCategoryManager,
}: ProductFormCardProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      barcode: '',
      category: '',
      purchasePrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 5,
    }
  });

  useEffect(() => {
    reset({
      name: editingProduct?.name || '',
      barcode: editingProduct?.barcode || '',
      category: editingProduct?.category || '',
      purchasePrice: editingProduct?.purchasePrice ?? 0,
      sellPrice: editingProduct?.sellPrice ?? 0,
      stock: editingProduct?.stock ?? 0,
      minStock: editingProduct?.minStock ?? 5,
    });
  }, [editingProduct, reset]);

  const purchasePrice = watch('purchasePrice') || 0;
  const sellPrice = watch('sellPrice') || 0;
  const calculatedMargin = sellPrice > 0 ? ((sellPrice - purchasePrice) / sellPrice) * 100 : 0;

  const onFormSubmit = async (values: ProductFormValues) => {
    await onSubmit(values);
    // Limpiar el formulario tras guardar exitosamente si no estábamos editando
    if (!editingProduct) {
      reset({
        name: '',
        barcode: '',
        category: '',
        purchasePrice: 0,
        sellPrice: 0,
        stock: 0,
        minStock: 5,
      });
    }
  };

  const isEditing = editingProduct !== null && editingProduct.id !== '';
  const isDuplicating = editingProduct !== null && editingProduct.id === '';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4 sticky top-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Edit3 className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Editar Producto
              </h2>
            </>
          ) : (
            <>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {isDuplicating ? 'Duplicar Producto' : 'Registrar Producto'}
              </h2>
            </>
          )}
        </div>
        {(isEditing || isDuplicating) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            className="h-7 text-[10px] text-slate-450 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold px-2 rounded-lg gap-1"
          >
            <X className="h-3.5 w-3.5" /> Cancelar
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre del Producto *</label>
          <Input
            type="text"
            placeholder="Ej. Coca-Cola 600ml"
            className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold ${errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
            {...register('name')}
          />
          {errors.name && (
            <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.name.message}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Barcode className="h-3.5 w-3.5" /> Cód. Barras
            </label>
            <div className="flex gap-1.5 items-center">
              <Input
                ref={(e) => {
                  register('barcode').ref(e);
                  if (barcodeInputRef) {
                    (barcodeInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                  }
                }}
                type="text"
                placeholder="Escanea..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-mono flex-1"
                name="barcode"
                onChange={register('barcode').onChange}
                onBlur={register('barcode').onBlur}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
                className="h-10 w-10 shrink-0 p-0 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-955/40 rounded-xl cursor-pointer"
                title="Escanear con cámara"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            {errors.barcode && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.barcode.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  + Nueva
                </button>
              )}
            </div>
            <CustomSelect
              value={watch('category') || ''}
              onChange={(val) => setValue('category', val)}
              placeholder="-- Seleccionar categoría --"
              options={[
                { value: '', label: '-- Seleccionar categoría --' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
            {errors.category && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.category.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Precio Compra *</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold ${errors.purchasePrice ? 'border-rose-500' : ''}`}
              {...register('purchasePrice', { valueAsNumber: true })}
            />
            {errors.purchasePrice && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.purchasePrice.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Precio Venta *</label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650 ${errors.sellPrice ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              {...register('sellPrice', { valueAsNumber: true })}
            />
            {errors.sellPrice && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.sellPrice.message}</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <CirclePercent className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Margen de Utilidad:
          </span>
          <span className={`font-black text-xs ${calculatedMargin > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
            {calculatedMargin.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Stock Inicial *</label>
            <Input
              type="number"
              step="any"
              placeholder="Ej. 100"
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold ${errors.stock ? 'border-rose-500' : ''}`}
              {...register('stock', { valueAsNumber: true })}
            />
            {errors.stock && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.stock.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Stock Mínimo *</label>
            <Input
              type="number"
              step="any"
              placeholder="Ej. 5"
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold ${errors.minStock ? 'border-rose-500' : ''}`}
              {...register('minStock', { valueAsNumber: true })}
            />
            {errors.minStock && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.minStock.message}</span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-md transition-all active:scale-[0.98]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar en Inventario'}
        </Button>
      </form>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setValue('barcode', scannedCode, { shouldValidate: true });
        }}
        title="Escáner para Producto"
      />
    </div>
  );
}
