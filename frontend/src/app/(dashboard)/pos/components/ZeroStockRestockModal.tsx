'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, PackagePlus, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../types';

interface ZeroStockRestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onRestockAndAdd: (product: Product, newStock: number) => Promise<void>;
  onAddWithoutRestock?: (product: Product) => void;
}

function ZeroStockRestockContent({
  onOpenChange,
  product,
  onRestockAndAdd,
  onAddWithoutRestock,
}: Omit<ZeroStockRestockModalProps, 'open'>) {
  const [stockInput, setStockInput] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!product) return null;

  const isWeight = product.unitType === 'WEIGHT';
  const step = isWeight ? 0.5 : 1;

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (stockInput <= 0) return;
    setIsSubmitting(true);
    try {
      await onRestockAndAdd(product, stockInput);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipRestock = () => {
    if (onAddWithoutRestock) {
      onAddWithoutRestock(product);
    }
  };

  return (
    <DialogContent className="w-[94vw] sm:max-w-md rounded-3xl p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4">
      {/* HEADER: PRODUCTO Y CÓDIGO */}
      <DialogHeader className="space-y-1.5 text-left">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <DialogTitle className="font-black text-base md:text-lg text-slate-800 dark:text-slate-100 truncate">
            {product.name}
          </DialogTitle>
        </div>

        <DialogDescription className="flex items-center gap-1.5 flex-wrap text-left">
          <span className="text-[11px] text-slate-400 font-bold font-mono">
            Código: {product.barcode || 'Sin código'}
          </span>
          {product.barcodes && product.barcodes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/60 dark:border-indigo-900/60">
              +{product.barcodes.length} adicional{product.barcodes.length > 1 ? 'es' : ''}
            </span>
          )}
          <span className="text-[10px] text-rose-500 font-black bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
            Agotado en sistema (0 {isWeight ? 'kg' : 'uds'})
          </span>
        </DialogDescription>
      </DialogHeader>

      {/* BLOQUE PRINCIPAL: CONTEO FÍSICO DE STOCK CON COUNTER STEPPER */}
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
            Conteo Físico de Stock
          </span>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl gap-2 border border-slate-200/60 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 p-0 font-black rounded-xl cursor-pointer shrink-0 bg-white dark:bg-slate-900"
              onClick={() => setStockInput((prev) => Math.max(isWeight ? 0.1 : 1, isWeight ? Number((prev - step).toFixed(2)) : prev - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Input
              ref={inputRef}
              type="number"
              step="any"
              min={isWeight ? "0.01" : "1"}
              value={stockInput === 0 ? '' : stockInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setStockInput(0);
                } else {
                  setStockInput(parseFloat(val) || 0);
                }
              }}
              className="h-11 w-32 text-center font-black text-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
            />

            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 p-0 font-black rounded-xl cursor-pointer shrink-0 bg-white dark:bg-slate-900"
              onClick={() => setStockInput((prev) => isWeight ? Number((prev + step).toFixed(2)) : prev + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* ATAJOS RÁPIDOS DE CANTIDAD */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400">Rápido:</span>
            {[5, 10, 15, 20].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setStockInput(qty)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  stockInput === qty
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                +{qty}
              </button>
            ))}
          </div>
        </div>

        {/* PIE DE ACCIONES */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {onAddWithoutRestock && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkipRestock}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-10 px-3 cursor-pointer"
            >
              Vender sin ajustar
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl h-11 px-4 cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || stockInput <= 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-11 px-5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
          >
            <PackagePlus className="h-4 w-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Restablecer y Añadir'}</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function ZeroStockRestockModal({
  open,
  onOpenChange,
  ...props
}: ZeroStockRestockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ZeroStockRestockContent onOpenChange={onOpenChange} {...props} />}
    </Dialog>
  );
}
