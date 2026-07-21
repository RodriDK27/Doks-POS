import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Barcode, CirclePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Product } from '../types';

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

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: string[];
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  onSubmit,
  categories,
  barcodeInputRef,
}: ProductFormDialogProps) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">
            {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Introduce la información del artículo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-1 text-xs">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Barcode className="h-3.5 w-3.5" /> Código de Barras
              </label>
              <Input
                ref={(e) => {
                  register('barcode').ref(e);
                  if (barcodeInputRef && 'current' in barcodeInputRef) {
                    (barcodeInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                  }
                }}
                type="text"
                placeholder="Escanea o escribe..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-mono"
                name="barcode"
                onChange={register('barcode').onChange}
                onBlur={register('barcode').onBlur}
              />
              {errors.barcode && (
                <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.barcode.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
              <Input
                type="text"
                placeholder="Bebidas, Abarrotes..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                {...register('category')}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && (
                <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.category.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Compra ($) *</label>
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
              <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Venta ($) *</label>
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

          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <CirclePercent className="h-3.5 w-3.5 text-indigo-655" />
              Margen de Utilidad Proyectado:
            </span>
            <span className={`font-black text-xs ${calculatedMargin > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
              {calculatedMargin.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Existencia *</label>
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
              <label className="text-[9px] font-bold text-slate-400 uppercase">Mínimo Alerta *</label>
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

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
