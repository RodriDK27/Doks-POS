'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/CustomSelect';
import { Product, Supplier } from '../../types';

interface SupplierTabProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  receivedItems: Array<{ product: Product; quantity: number; costPrice: number }>;
  isSubmitting: boolean;
  onConfirmSupplierReceipt: () => void;
}

export function SupplierTab({
  suppliers,
  selectedSupplierId,
  setSelectedSupplierId,
  receivedItems,
  isSubmitting,
  onConfirmSupplierReceipt,
}: SupplierTabProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Seleccionar Proveedor *</label>
        <CustomSelect
          value={selectedSupplierId}
          onChange={setSelectedSupplierId}
          placeholder="-- Seleccionar Proveedor --"
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
        Mercancía Escaneada ({receivedItems.length})
      </span>

      {receivedItems.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 max-h-36 overflow-y-auto">
          {receivedItems.map((item, idx) => (
            <div key={idx} className="p-1.5 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{item.product.name}</span>
                <span className="text-[9px] text-slate-400 block">${item.costPrice} c/u</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-indigo-600">{item.quantity} uds</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-4">Escanea los productos que te va entregando el repartidor.</p>
      )}

      <Button
        type="button"
        disabled={isSubmitting || receivedItems.length === 0 || !selectedSupplierId}
        onClick={onConfirmSupplierReceipt}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 rounded-xl cursor-pointer active:scale-95"
      >
        <Check className="h-4 w-4 mr-1.5" /> Confirmar Entrada de Mercancía
      </Button>
    </div>
  );
}
