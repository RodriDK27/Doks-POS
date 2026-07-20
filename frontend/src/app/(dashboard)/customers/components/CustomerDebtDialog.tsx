import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer } from '../types';

interface CustomerDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: Customer | null;
  transactionType: 'ABONO' | 'DEUDA';
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
  transactionType,
  abonoAmount,
  setAbonoAmount,
  abonoNotes,
  setAbonoNotes,
  onSubmit,
}: CustomerDebtDialogProps) {
  const isAbono = transactionType === 'ABONO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">
            {isAbono ? 'Registrar Abono' : 'Registrar Cargo (Deuda)'}
          </DialogTitle>
        </DialogHeader>

        {selectedCustomer && (
          <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
              <span className="text-slate-450 dark:text-slate-500 font-bold block text-[9px] uppercase">CLIENTE</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedCustomer.name}</span>
              <div className="flex justify-between mt-2.5 text-xs font-bold">
                <span className="text-slate-500">Deuda actual:</span>
                <span className="text-rose-500">${selectedCustomer.currentDebt.toFixed(2)}</span>
              </div>
              {selectedCustomer.creditLimit > 0 && !isAbono && (
                <div className="flex justify-between mt-1 text-xs font-bold">
                  <span className="text-slate-500">Límite disponible:</span>
                  <span className="text-emerald-500">${(selectedCustomer.creditLimit - selectedCustomer.currentDebt).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {isAbono ? 'Monto a abonar ($) *' : 'Monto de la deuda ($) *'}
              </label>
              <Input
                type="number"
                step="any"
                required
                className={
                  isAbono
                    ? "focus-visible:ring-emerald-500 font-bold text-lg text-emerald-600 dark:bg-slate-950 h-11"
                    : "focus-visible:ring-indigo-500 font-bold text-lg text-indigo-600 dark:bg-slate-950 h-11"
                }
                value={abonoAmount || ''}
                onChange={(e) => setAbonoAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Observación</label>
              <Input
                type="text"
                placeholder={isAbono ? 'Ej. Abono del fin de semana...' : 'Ej. Saldo inicial anotado en libreta...'}
                className={
                  isAbono 
                    ? "focus-visible:ring-emerald-500 h-10 text-xs dark:bg-slate-950" 
                    : "focus-visible:ring-indigo-500 h-10 text-xs dark:bg-slate-950"
                }
                value={abonoNotes}
                onChange={(e) => setAbonoNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className={
                  isAbono
                    ? "bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs px-5 rounded-xl h-10 cursor-pointer border-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 cursor-pointer border-none"
                }
              >
                {isAbono ? 'Registrar Abono' : 'Registrar Cargo (Deuda)'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
