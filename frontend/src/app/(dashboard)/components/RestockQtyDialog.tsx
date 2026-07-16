import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LowStockProduct } from '../hooks/useDashboard';

interface RestockQtyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: LowStockProduct | null;
  restockQty: number;
  setRestockQty: (qty: number) => void;
  onSubmit: () => void;
}

export function RestockQtyDialog({
  open,
  onOpenChange,
  selectedProduct,
  restockQty,
  setRestockQty,
  onSubmit,
}: RestockQtyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Abastecer Producto</DialogTitle>
        </DialogHeader>
        {selectedProduct && (
          <div className="space-y-4 py-2 text-sm">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">PRODUCTO</span>
              <span className="font-bold text-slate-800 block text-xs mt-1">{selectedProduct.name}</span>
              <div className="flex justify-between mt-3 text-xs font-semibold text-slate-500">
                <span>Stock Actual: {selectedProduct.stock}</span>
                <span>Mínimo: {selectedProduct.minStock}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad a Agregar</label>
              <Input
                type="number"
                step="any"
                className="focus-visible:ring-indigo-500 font-bold text-base h-11"
                value={restockQty || ''}
                onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
                placeholder="Ej. 10"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-4 cursor-pointer"
            disabled={restockQty <= 0}
            onClick={onSubmit}
          >
            Abastecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
