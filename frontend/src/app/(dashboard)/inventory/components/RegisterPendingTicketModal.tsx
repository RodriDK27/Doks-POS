'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/CustomSelect';
import { Supplier } from '../types';
import { Ticket, DollarSign } from 'lucide-react';

interface RegisterPendingTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  onSavePendingTicket: (data: { supplierId: string; amount: number; scheduledDate?: string; notes?: string }) => Promise<void>;
}

export function RegisterPendingTicketModal({
  open,
  onOpenChange,
  suppliers,
  onSavePendingTicket,
}: RegisterPendingTicketModalProps) {
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('Jueves');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      setIsSubmitting(true);
      await onSavePendingTicket({
        supplierId,
        amount: numAmount,
        scheduledDate,
        notes: notes.trim() || undefined,
      });
      setSupplierId('');
      setAmount('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-[450px] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-x-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Anotar Ticket / Nota de Preventa</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Proveedor *</label>
            <CustomSelect
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Seleccionar proveedor (ej. Coca-Cola)"
              options={suppliers.filter(s => s.isActive !== false).map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Monto del Ticket ($) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                <Input
                  type="number"
                  step="0.50"
                  required
                  placeholder="0.00"
                  className="pl-8 h-10 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 rounded-xl"
                  value={amount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Día de Entrega / Pago</label>
              <CustomSelect
                value={scheduledDate}
                onChange={setScheduledDate}
                options={[
                  { value: 'Lunes', label: 'Lunes' },
                  { value: 'Martes', label: 'Martes' },
                  { value: 'Miércoles', label: 'Miércoles' },
                  { value: 'Jueves', label: 'Jueves' },
                  { value: 'Viernes', label: 'Viernes' },
                  { value: 'Sábado', label: 'Sábado' },
                  { value: 'Domingo', label: 'Domingo' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Folio / Nota / Observaciones</label>
            <Input
              type="text"
              placeholder="Ej. Nota #4521 - Refrescos y jugos"
              className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <p className="text-[10px] text-slate-400 italic bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            Nota: Este ticket quedará reservado en la agenda sin descontar dinero de la caja chica hasta el día que registres el pago al repartidor.
          </p>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 gap-2 flex-row justify-end">
            <Button type="button" variant="outline" className="h-10 rounded-xl font-bold text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !supplierId || !amount} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer">
              Guardar Ticket Previo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
