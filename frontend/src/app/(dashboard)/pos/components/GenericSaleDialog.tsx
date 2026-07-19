import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface GenericSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genericPrice: string;
  genericName: string;
  setGenericName: (name: string) => void;
  onAdd: () => void;
  handleKeypadPress: (val: string) => void;
}

export function GenericSaleDialog({
  open,
  onOpenChange,
  genericPrice,
  genericName,
  setGenericName,
  onAdd,
  handleKeypadPress,
}: GenericSaleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-800 dark:text-slate-100">Cobro Rápido (Artículo Libre)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-wider">Concepto</label>
              <Input
                type="text"
                placeholder="Ej. Bolillo, Dulces..."
                className="h-11 focus-visible:ring-indigo-500 text-xs font-bold dark:bg-slate-900"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Precio ($)</label>
              <Input
                type="text"
                readOnly
                placeholder="0.00"
                className="h-11 text-right font-black text-lg text-indigo-650 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={genericPrice}
              />
            </div>
          </div>

          {/* TECLADO GIGANTE */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={`h-11 font-black text-sm rounded-xl active:bg-indigo-50 active:border-indigo-200 dark:active:bg-indigo-950/20 dark:active:border-indigo-900 transition-all cursor-pointer ${
                  key === 'C'
                    ? 'text-rose-500 hover:bg-rose-550 dark:hover:bg-rose-950/10'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => handleKeypadPress(key)}
              >
                {key}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button variant="outline" className="text-xs rounded-xl cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 rounded-xl h-10 flex items-center gap-1 cursor-pointer"
            disabled={!genericPrice || parseFloat(genericPrice) <= 0}
            onClick={onAdd}
          >
            <Check className="h-4 w-4" /> Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
