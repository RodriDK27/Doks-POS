'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Product } from '../types';
import { UtensilsCrossed, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';

interface WasteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

const wasteTypeOptions = [
  { value: 'CONSUMO_INTERNO', label: 'Consumo Interno (Autoconsumo)' },
  { value: 'MERMA_ROTO', label: 'Producto Roto / Dañado' },
  { value: 'MERMA_CADUCADO', label: 'Producto Caducado / Vencido' },
  { value: 'DEVOLUCION', label: 'Devolución a Inventario' },
];

export function WasteModal({ open, onOpenChange, product, onSuccess }: WasteModalProps) {
  const [type, setType] = useState<string>('CONSUMO_INTERNO');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [responsibleName, setResponsibleName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const prevOpenRef = React.useRef(open);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setType('CONSUMO_INTERNO');
      setQuantity(1);
      setResponsibleName('');
      setNotes('');
    }
    prevOpenRef.current = open;
  }, [open]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      return;
    }

    if (type !== 'DEVOLUCION' && qty > product.stock) {
      toast.error(`No puedes registrar más de las ${product.stock} unidades en stock actual`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/products/waste', {
        productId: product.id,
        type,
        quantity: qty,
        responsibleName: responsibleName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(
        type === 'CONSUMO_INTERNO'
          ? 'Consumo interno registrado'
          : type === 'DEVOLUCION'
          ? 'Devolución aplicada al stock'
          : 'Merma registrada exitosamente'
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(parseAxiosError(err, 'Ocurrió un error al registrar la merma'));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {type === 'CONSUMO_INTERNO' ? (
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
            ) : type === 'DEVOLUCION' ? (
              <RefreshCw className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            )}
            Registrar Merma o Consumo
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ajusta el inventario por productos consumidos, dañados o caducados sin afectar la caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Información del producto */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{product.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Costo: ${product.purchasePrice.toFixed(2)} | Venta: ${product.sellPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Stock Actual</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{product.stock}</span>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Motivo / Tipo de Salida</label>
            <CustomSelect
              className="w-full h-10 text-xs font-bold"
              value={type}
              onChange={setType}
              options={wasteTypeOptions}
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Cantidad</label>
            <Input
              type="number"
              step={product.unitType === 'WEIGHT' ? 'any' : '1'}
              min={product.unitType === 'WEIGHT' ? '0.01' : '1'}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl"
              placeholder="Ej. 1"
              required
            />
          </div>


          {/* Responsable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Responsable / Quién Consumió <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <Input
              type="text"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="Ej. Admin, Juan, etc."
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Observaciones / Notas <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="Ej. Paquete roto durante estibado"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {submitting ? 'Guardando...' : 'Aplicar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
