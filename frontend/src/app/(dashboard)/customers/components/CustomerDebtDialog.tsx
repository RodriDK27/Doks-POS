import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer } from '../types';

interface CustomerDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: Customer | null;
  abonoAmount: number;
  setAbonoAmount: (val: number) => void;
  abonoNotes: string;
  setAbonoNotes: (notes: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CustomerDebtDialog({
  open,
  onOpenChange,
  selectedCustomer,
  abonoAmount,
  setAbonoAmount,
  abonoNotes,
  setAbonoNotes,
  onSubmit,
}: CustomerDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Registrar Abono</DialogTitle>
        </DialogHeader>

        {selectedCustomer && (
          <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
            <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1">
              <span className="text-slate-450 font-bold block text-[9px] uppercase">CLIENTE</span>
              <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
              <div className="flex justify-between mt-2.5 text-xs font-bold">
                <span className="text-slate-500">Deuda actual:</span>
                <span className="text-rose-500">${selectedCustomer.currentDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Monto a abonar ($) *</label>
              <Input
                type="number"
                step="any"
                required
                className="focus-visible:ring-emerald-500 font-bold text-lg text-emerald-655 h-11"
                value={abonoAmount || ''}
                onChange={(e) => setAbonoAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Observación</label>
              <Input
                type="text"
                placeholder="Ej. Abono del fin de semana..."
                className="focus-visible:ring-emerald-500 h-10 text-xs"
                value={abonoNotes}
                onChange={(e) => setAbonoNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs px-5 rounded-xl h-10 cursor-pointer">
                Registrar Abono
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
