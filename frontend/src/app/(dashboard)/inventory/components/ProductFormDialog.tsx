import React from 'react';
import { Barcode, CirclePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Product } from '../types';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  formData: {
    name: string;
    barcode: string;
    category: string;
    purchasePrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    barcode: string;
    category: string;
    purchasePrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  categories: string[];
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  calculatedMargin: number;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  formData,
  setFormData,
  onSubmit,
  categories,
  barcodeInputRef,
  calculatedMargin,
}: ProductFormDialogProps) {
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

        <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre del Producto *</label>
            <Input
              type="text"
              required
              placeholder="Ej. Coca-Cola 600ml"
              className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Barcode className="h-3.5 w-3.5" /> Código de Barras
              </label>
              <Input
                ref={barcodeInputRef}
                type="text"
                placeholder="Escanea o escribe..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-mono"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
              <Input
                type="text"
                placeholder="Bebidas, Abarrotes..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Compra ($) *</label>
              <Input
                type="number"
                step="any"
                required
                placeholder="0.00"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.purchasePrice || ''}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Venta ($) *</label>
              <Input
                type="number"
                step="any"
                required
                placeholder="0.00"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650"
                value={formData.sellPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
              />
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
                required
                placeholder="Ej. 100"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Mínimo Alerta *</label>
              <Input
                type="number"
                step="any"
                required
                placeholder="Ej. 5"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
              {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
