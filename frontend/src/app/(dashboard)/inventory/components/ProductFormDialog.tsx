import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Barcode, Package, Scale, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Product } from '../types';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/CustomSelect';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  barcode: z.string().nullable().optional().or(z.literal('')),
  category: z.string().nullable().optional().or(z.literal('')),
  unitType: z.enum(['PIECE', 'WEIGHT']),
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
  onOpenCategoryManager?: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  onSubmit,
  categories,
  barcodeInputRef,
  onOpenCategoryManager,
}: ProductFormDialogProps) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      barcode: '',
      category: '',
      unitType: 'PIECE',
      purchasePrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 1,
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editingProduct?.name || '',
        barcode: editingProduct?.barcode || '',
        category: editingProduct?.category || '',
        unitType: (editingProduct?.unitType as 'PIECE' | 'WEIGHT') || 'PIECE',
        purchasePrice: editingProduct?.purchasePrice ?? 0,
        sellPrice: editingProduct?.sellPrice ?? 0,
        stock: editingProduct?.stock ?? 0,
        minStock: editingProduct?.minStock ?? 1,
      });
    }
  }, [open, editingProduct, reset]);

  const unitType = watch('unitType');
  const selectedCategory = watch('category') || '';

  const onFormSubmit = async (values: ProductFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100">
            {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 dark:text-slate-400">
            Llena los datos del artículo para el catálogo e inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 py-2 text-xs">
          
          {/* NOMBRE DEL PRODUCTO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Nombre del Producto *
            </label>
            <Input
              type="text"
              placeholder="Ej. Coca-Cola 600ml, Sabritas 45g..."
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl ${errors.name ? 'border-rose-500' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.name.message}</span>
            )}
          </div>

          {/* CÓDIGO BARRAS Y CATEGORÍA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Barcode className="h-3 w-3" /> Código Barras
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
                className="focus-visible:ring-indigo-500 h-10 text-xs font-mono bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl w-full"
                name="barcode"
                onChange={register('barcode').onChange}
                onBlur={register('barcode').onBlur}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Categoría
                </label>
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
                value={selectedCategory}
                onChange={(val) => setValue('category', val)}
                placeholder="-- Seleccionar categoría --"
                options={[
                  { value: '', label: '-- Seleccionar categoría --' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>

          {/* TIPO DE VENTA (PIEZA VS GRANEL) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Tipo de Venta *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border",
                  unitType === 'PIECE'
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800"
                )}
                onClick={() => setValue('unitType', 'PIECE')}
              >
                <Package className="h-4 w-4" />
                <span>Por Pieza / Unidad</span>
              </button>
              <button
                type="button"
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border",
                  unitType === 'WEIGHT'
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800"
                )}
                onClick={() => setValue('unitType', 'WEIGHT')}
              >
                <Scale className="h-4 w-4" />
                <span>A Granel / Peso (kg)</span>
              </button>
            </div>
          </div>

          {/* PRECIOS DE COMPRA Y VENTA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Precio Compra ($) *
              </label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                className={`focus-visible:ring-indigo-500 h-10 text-xs font-black bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl ${errors.purchasePrice ? 'border-rose-500' : ''}`}
                onFocus={(e) => e.target.select()}
                {...register('purchasePrice', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Precio Venta {unitType === 'WEIGHT' ? 'x Kg ($)' : '($)'} *
              </label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                className={`focus-visible:ring-indigo-500 h-10 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 rounded-xl ${errors.sellPrice ? 'border-rose-500' : ''}`}
                onFocus={(e) => e.target.select()}
                {...register('sellPrice', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* EXISTENCIAS Y STOCK MÍNIMO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                {unitType === 'WEIGHT' ? 'Existencia (Kg) *' : 'Existencia Inicial *'}
              </label>
              <Input
                type="number"
                step="any"
                placeholder={unitType === 'WEIGHT' ? 'Ej. 10.5' : 'Ej. 24'}
                className="focus-visible:ring-indigo-500 h-10 text-xs font-black bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                onFocus={(e) => e.target.select()}
                {...register('stock', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Alerta Stock Bajo *
              </label>
              <Input
                type="number"
                step="any"
                placeholder="Ej. 5"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-black bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                onFocus={(e) => e.target.select()}
                {...register('minStock', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* FOOTER BOTONES */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
