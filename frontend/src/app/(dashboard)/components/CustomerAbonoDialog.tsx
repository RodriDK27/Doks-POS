import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DebtorCustomer } from '../hooks/useDashboard';

interface CustomerAbonoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: DebtorCustomer | null;
  abonoAmount: number;
  setAbonoAmount: (val: number) => void;
  abonoNotes: string;
  setAbonoNotes: (notes: string) => void;
  onSubmit: () => void;
}

export function CustomerAbonoDialog({
  open,
  onOpenChange,
  selectedCustomer,
  abonoAmount,
  setAbonoAmount,
  abonoNotes,
  setAbonoNotes,
  onSubmit,
}: CustomerAbonoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Registrar Abono</DialogTitle>
        </DialogHeader>
        {selectedCustomer && (
          <div className="space-y-4 py-2 text-sm">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">CLIENTE</span>
              <span className="font-bold text-slate-800 block text-xs mt-1">{selectedCustomer.name}</span>
              <div className="flex justify-between mt-3 text-xs font-semibold">
                <span className="text-slate-500">Deuda actual:</span>
                <span className="text-rose-500 font-bold">${selectedCustomer.currentDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Monto del Abono ($)</label>
              <Input
                type="number"
                step="any"
                className="focus-visible:ring-indigo-500 font-bold text-lg text-indigo-600 h-11"
                value={abonoAmount || ''}
                onChange={(e) => setAbonoAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Notas</label>
              <Input
                type="text"
                placeholder="Ej. Pago en efectivo..."
                value={abonoNotes}
                onChange={(e) => setAbonoNotes(e.target.value)}
                className="focus-visible:ring-indigo-500 h-10 text-xs"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-4 cursor-pointer"
            disabled={abonoAmount <= 0}
            onClick={onSubmit}
          >
            Registrar Abono
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
