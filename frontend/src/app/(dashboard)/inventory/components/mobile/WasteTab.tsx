'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Product } from '../../types';

interface WasteTabProps {
  selectedProduct: Product | null;
  wasteQty: number;
  setWasteQty: React.Dispatch<React.SetStateAction<number>>;
  wasteReason: string;
  setWasteReason: (reason: string) => void;
  isSubmitting: boolean;
  onSaveWaste: () => void;
}

export function WasteTab({
  selectedProduct,
  wasteQty,
  setWasteQty,
  wasteReason,
  setWasteReason,
  isSubmitting,
  onSaveWaste,
}: WasteTabProps) {
  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
        <Trash2 className="h-8 w-8 text-rose-300 dark:text-rose-900/40 mb-1 animate-bounce" />
        <p className="text-xs font-bold">Escanea el producto caducado o dañado para darlo de baja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 space-y-1.5">
        <span className="font-black text-xs text-rose-700 dark:text-rose-300 block">{selectedProduct.name}</span>
        <span className="text-[9.5px] text-slate-500 font-bold block">Stock disponible: {selectedProduct.stock} uds</span>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 truncate">Cant. Mermada</label>
            <Input
              type="number"
              min="1"
              className="h-10 text-xs font-extrabold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
              value={wasteQty}
              onChange={(e) => setWasteQty(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Motivo</label>
            <CustomSelect
              value={wasteReason}
              onChange={setWasteReason}
              options={[
                { value: 'CADUCADO', label: 'Caducado' },
                { value: 'DANADO', label: 'Dañado / Roto' },
                { value: 'USO_INTERNO', label: 'Uso Interno' },
                { value: 'ROBO', label: 'Faltante / Robo' },
              ]}
            />
          </div>
        </div>
      </div>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={onSaveWaste}
        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-10 rounded-xl cursor-pointer active:scale-95"
      >
        <Trash2 className="h-4 w-4 mr-1.5" /> Registrar Baja de Merma
      </Button>
    </div>
  );
}
