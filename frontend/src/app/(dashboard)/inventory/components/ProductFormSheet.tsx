'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Barcode, CirclePercent, Edit3, Sparkles } from 'lucide-react';
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

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: string[];
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenCategoryManager?: () => void;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  editingProduct,
  onSubmit,
  categories,
  barcodeInputRef,
  onOpenCategoryManager,
}: ProductFormSheetProps) {
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
    if (open) {
      reset({
        name: editingProduct?.name || '',
        barcode: editingProduct?.barcode || '',
        category: editingProduct?.category || '',
        purchasePrice: editingProduct?.purchasePrice ?? 0,
        sellPrice: editingProduct?.sellPrice ?? 0,
        stock: editingProduct?.stock ?? 0,
        minStock: editingProduct?.minStock ?? 5,
      });
    }
  }, [open, editingProduct, reset]);

  const purchasePrice = watch('purchasePrice') || 0;
  const sellPrice = watch('sellPrice') || 0;
  const calculatedMargin = sellPrice > 0 ? ((sellPrice - purchasePrice) / sellPrice) * 100 : 0;

  const onFormSubmit = async (values: ProductFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  const isEditing = editingProduct !== null && editingProduct.id !== '';
  const isDuplicating = editingProduct !== null && editingProduct.id === '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
              isEditing 
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" 
                : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400"
            }`}>
              {isEditing ? <Edit3 className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
            </div>
            <div>
              <SheetTitle className="font-black text-slate-850 dark:text-slate-100 text-base">
                {isEditing ? 'Editar Producto' : isDuplicating ? 'Duplicar Producto' : 'Nuevo Producto'}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                {isEditing ? 'Modifica los valores del producto actual.' : 'Agrega un nuevo artículo al catálogo.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-xs">
            
            {/* SECCIÓN GENERAL */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                Información del Producto
              </span>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre del Producto *</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <Barcode className="h-3.5 w-3.5" /> Código de Barras
                  </label>
                  <Input
                    ref={(e) => {
                      register('barcode').ref(e);
                      if (barcodeInputRef) {
                        (barcodeInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                      }
                    }}
                    type="text"
                    placeholder="Escanea..."
                    className="focus-visible:ring-indigo-500 h-10 text-xs font-mono"
                    name="barcode"
                    onChange={register('barcode').onChange}
                    onBlur={register('barcode').onBlur}
                  />
                  {errors.barcode && (
                    <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.barcode.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Categoría</label>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={onOpenCategoryManager}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
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
            </div>

            {/* SECCIÓN PRECIOS */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                Finanzas y Precios
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Precio Compra ($) *</label>
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Precio Venta ($) *</label>
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

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <CirclePercent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Margen de Utilidad Proyectado:
                </span>
                <span className={`font-black text-sm ${calculatedMargin > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                  {calculatedMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* SECCIÓN STOCK */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                Nivel de Stock
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Existencia Inicial *</label>
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mínimo Alerta *</label>
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
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-2 w-full shrink-0">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs rounded-xl h-11 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer bg-transparent"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
