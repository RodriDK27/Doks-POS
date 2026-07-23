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
        <span className="text-[10px] text-slate-400 font-bold block">Código: {selectedProduct.barcode || 'Sin código'}</span>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black block">Precio Venta</span>
            <span className="text-sm font-black text-emerald-600">${selectedProduct.sellPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black block">Precio Compra</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">${selectedProduct.purchasePrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Conteo Físico de Stock</span>
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
