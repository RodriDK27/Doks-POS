'use client';

import React from 'react';
import { Search, Minus, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../../types';

interface AuditTabProps {
  selectedProduct: Product | null;
  auditStock: number;
  setAuditStock: React.Dispatch<React.SetStateAction<number>>;
  isSubmitting: boolean;
  onSaveAuditStock: () => void;
}

export function AuditTab({
  selectedProduct,
  auditStock,
  setAuditStock,
  isSubmitting,
  onSaveAuditStock,
}: AuditTabProps) {
  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
        <Search className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-1 animate-bounce" />
        <p className="text-xs font-bold">Apunta la cámara a un producto para ver precios y auditar stock.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
        <span className="font-black text-sm text-slate-800 dark:text-slate-100 block">{selectedProduct.name}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold font-mono">
            Código: {selectedProduct.barcode || 'Sin código'}
          </span>
          {selectedProduct.barcodes && selectedProduct.barcodes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/60 dark:border-indigo-900/60">
              +{selectedProduct.barcodes.length} adicional{selectedProduct.barcodes.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>

        <div className="pt-1 space-y-1.5">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
            Conteo Físico de Stock
          </span>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl gap-2 border border-slate-200/60 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 p-0 font-black rounded-xl cursor-pointer"
              onClick={() => setAuditStock((prev) => Math.max(0, prev - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              className="h-10 w-28 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              value={auditStock}
              onChange={(e) => setAuditStock(parseFloat(e.target.value) || 0)}
            />

            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 p-0 font-black rounded-xl cursor-pointer"
              onClick={() => setAuditStock((prev) => prev + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={onSaveAuditStock}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl cursor-pointer active:scale-95"
      >
        <Save className="h-4 w-4 mr-1.5" /> Guardar Conteo Actualizado
      </Button>
    </div>
  );
}
