import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface GenericSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genericPrice: string;
  setGenericPrice?: (price: string) => void;
  genericName: string;
  setGenericName: (name: string) => void;
  onAdd: () => void;
  handleKeypadPress: (val: string) => void;
}

export function GenericSaleDialog({
  open,
  onOpenChange,
  genericPrice,
  setGenericPrice,
  genericName,
  setGenericName,
  onAdd,
  handleKeypadPress,
}: GenericSaleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-lg md:max-w-xl rounded-2xl md:rounded-3xl p-5 md:p-6">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg md:text-xl text-slate-800 dark:text-slate-100">Cobro Rápido (Artículo Libre)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 md:space-y-5 py-2 md:py-3 text-sm">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Concepto</label>
              <Input
                type="text"
                placeholder="Artículo Común"
                className="h-12 md:h-16 focus-visible:ring-indigo-500 text-base md:text-xl font-bold dark:bg-slate-900 rounded-xl px-4"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Precio ($)</label>
              <Input
                type="number"
                step="any"
                min="0"
                inputMode="none"
                placeholder="0.00"
                className="h-12 md:h-16 text-right font-black text-xl md:text-3xl text-indigo-650 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus-visible:ring-indigo-500 rounded-xl px-4"
                value={genericPrice}
                onChange={(e) => {
                  if (setGenericPrice) {
                    setGenericPrice(e.target.value);
                  }
                }}
                onFocus={(e) => {
                  // Al hacer clic/touch deliberado en el campo de texto, activar el teclado del dispositivo
                  e.target.removeAttribute('inputmode');
                }}
                onBlur={(e) => {
                  e.target.setAttribute('inputmode', 'none');
                }}
              />
            </div>
          </div>

          {/* TECLADO GIGANTE */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-3.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={`h-14 md:h-18 text-xl md:text-3xl font-black rounded-xl md:rounded-2xl active:bg-indigo-50 active:border-indigo-200 dark:active:bg-indigo-950/20 dark:active:border-indigo-900 transition-all cursor-pointer ${
                  key === 'C'
                    ? 'text-rose-500 hover:bg-rose-500 dark:hover:bg-rose-950/10'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => handleKeypadPress(key)}
              >
                {key}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-3 pt-2 md:pt-4">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-initial text-sm md:text-base font-bold rounded-xl md:rounded-2xl h-11 md:h-13 px-6 cursor-pointer" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm md:text-base px-8 rounded-xl md:rounded-2xl h-11 md:h-13 flex items-center justify-center gap-2 cursor-pointer"
            disabled={!genericPrice || parseFloat(genericPrice) <= 0}
            onClick={onAdd}
          >
            <Check className="h-5 w-5" /> Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
