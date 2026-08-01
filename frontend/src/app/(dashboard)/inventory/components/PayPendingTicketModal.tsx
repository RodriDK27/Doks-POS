import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Wallet } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';

interface PendingTicketItem {
  id: string;
  amount: number;
  scheduledDate?: string | null;
  notes?: string | null;
  supplier: { id: string; name: string };
}

interface PayPendingTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: PendingTicketItem | null;
  onConfirmPay: (id: string, payFromRegister: boolean, amountPaid: number) => Promise<void>;
}

export function PayPendingTicketModal({
  open,
  onOpenChange,
  ticket,
  onConfirmPay,
}: PayPendingTicketModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<'CAJA_GRANDE' | 'CAJA_CHICA' | 'CREDITO'>('CAJA_GRANDE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [prevTicketId, setPrevTicketId] = useState<string | null>(null);

  if (ticket && prevTicketId !== ticket?.id) {
    setPrevTicketId(ticket.id);
    setAmountPaid(String(ticket.amount));
    setPaymentSource('CAJA_GRANDE');
  }

  if (!ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = parseFloat(amountPaid);
    if (isNaN(finalVal) || finalVal <= 0) return;

    try {
      setIsSubmitting(true);
      const isRegister = paymentSource === 'CAJA_CHICA';
      await onConfirmPay(ticket.id, isRegister, finalVal);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-[420px] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-x-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Liquidar y Pagar Ticket de Preventa</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-1">
            <span className="font-black text-sm text-slate-800 dark:text-slate-100 block">{ticket.supplier.name}</span>
            {ticket.notes && <span className="text-xs text-slate-500 font-bold block">Ref: {ticket.notes}</span>}
            <span className="text-[10px] text-slate-400 block font-semibold">Día de entrega programado: {ticket.scheduledDate || 'No especificado'}</span>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Monto Real Pagado al Repartidor ($) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <Input
                type="number"
                step="0.50"
                required
                className="pl-8 h-11 text-sm font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                value={amountPaid}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Origen del Pago de Efectivo</label>
            <CustomSelect
              className="h-10 text-xs font-bold"
              value={paymentSource}
              onChange={(val) => setPaymentSource(val as 'CAJA_GRANDE' | 'CAJA_CHICA' | 'CREDITO')}
              options={[
                { value: 'CAJA_GRANDE', label: 'Caja Grande (Bóveda Principal)' },
                { value: 'CAJA_CHICA', label: 'Caja Chica (Turno Actual)' },
                { value: 'CREDITO', label: 'Sin Afectar Efectivo' },
              ]}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 gap-2 flex-row justify-end">
            <Button type="button" variant="outline" className="h-10 rounded-xl font-bold text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer">
              Confirmar Pago y Salida de Caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
