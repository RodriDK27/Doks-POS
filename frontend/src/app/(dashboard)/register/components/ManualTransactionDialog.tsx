import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface ManualTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjForm: {
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
  };
  setAdjForm: React.Dispatch<React.SetStateAction<{
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function ManualTransactionDialog({
  open,
  onOpenChange,
  adjForm,
  setAdjForm,
  onSubmit,
}: ManualTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-805">Movimiento de Caja</DialogTitle>
          <DialogDescription className="text-xs">
            Registra una entrada o salida de efectivo manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`h-10 rounded-xl font-black text-xs cursor-pointer border transition-all ${
                adjForm.type === 'INGRESO'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 dark:border-emerald-500/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => setAdjForm({ ...adjForm, type: 'INGRESO' })}
            >
              Ingreso (Entrada)
            </button>
            <button
              type="button"
              className={`h-10 rounded-xl font-black text-xs cursor-pointer border transition-all ${
                adjForm.type === 'EGRESO'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/50 dark:border-rose-500/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => setAdjForm({ ...adjForm, type: 'EGRESO' })}
            >
              Egreso (Salida)
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Monto ($) *</label>
            <Input
              type="number"
              step="any"
              required
              className="focus-visible:ring-indigo-500 h-10 font-bold text-sm"
              value={adjForm.amount || ''}
              onChange={(e) => setAdjForm({ ...adjForm, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto / Motivo *</label>
            <Input
              type="text"
              required
              placeholder="Ej. Pago a proveedor Bimbo, Cambio..."
              className="focus-visible:ring-indigo-500 h-10 font-bold text-xs"
              value={adjForm.description}
              onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`font-black text-xs px-5 rounded-xl h-10 cursor-pointer ${
                adjForm.type === 'INGRESO'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              Confirmar {adjForm.type === 'INGRESO' ? 'Ingreso' : 'Egreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
