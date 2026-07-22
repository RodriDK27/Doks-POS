import React, { useState } from 'react';
import { Scale, DollarSign, Weight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Product } from '../types';
import { cn } from '@/lib/utils';

interface BulkProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, quantity: number) => void;
}

export function BulkProductDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: BulkProductDialogProps) {
  const [mode, setMode] = useState<'AMOUNT' | 'WEIGHT'>('AMOUNT');
  const [inputValue, setInputValue] = useState<string>('');

  if (!product) return null;

  const pricePerKg = product.sellPrice;
  const numInput = parseFloat(inputValue) || 0;

  // Calculados
  const calculatedQty = mode === 'AMOUNT' 
    ? (pricePerKg > 0 ? numInput / pricePerKg : 0)
    : numInput;

  const calculatedTotal = mode === 'AMOUNT'
    ? numInput
    : numInput * pricePerKg;

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setInputValue('');
      return;
    }
    if (val === '.') {
      if (!inputValue.includes('.')) {
        setInputValue(inputValue === '' ? '0.' : inputValue + '.');
      }
      return;
    }
    setInputValue(inputValue + val);
  };

  const handleConfirm = () => {
    if (calculatedQty <= 0) return;
    onConfirm(product, parseFloat(calculatedQty.toFixed(3)));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                Venta a Granel — ${pricePerKg.toFixed(2)} por Kg
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          
          {/* SELECTOR DE MODO (IMPORTE VS PESO) */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('AMOUNT');
                setInputValue('');
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                mode === 'AMOUNT'
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Por Dinero ($)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('WEIGHT');
                setInputValue('');
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                mode === 'WEIGHT'
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Weight className="h-3.5 w-3.5" />
              <span>Por Peso (Kg)</span>
            </button>
          </div>

          {/* INPUT PRINCIPAL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {mode === 'AMOUNT' ? 'Monto a Cobrar ($)' : 'Peso del Producto (Kg)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                {mode === 'AMOUNT' ? '$' : 'kg'}
              </span>
              <Input
                type="text"
                readOnly
                placeholder="0.00"
                className="h-12 pl-10 text-right font-black text-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl"
                value={inputValue}
              />
            </div>
          </div>

          {/* TECLADO NUMÉRICO TÁCTIL */}
          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={cn(
                  "h-10 font-black text-sm rounded-xl active:scale-95 transition-all cursor-pointer",
                  key === 'C'
                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                onClick={() => handleKeypadPress(key)}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* TARJETA RESUMEN CALCULADO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Peso Calculado</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 block">
                {calculatedQty.toFixed(3)} Kg
              </span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total a Cobrar</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block">
                ${calculatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

        </div>

        {/* ACCIONES FOOTER */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs h-10 rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
            disabled={calculatedQty <= 0}
            onClick={handleConfirm}
          >
            <Check className="h-4 w-4" />
            <span>Agregar al Carrito</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
