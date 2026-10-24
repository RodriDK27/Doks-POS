'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Banknote, CreditCard, Landmark, User, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/CustomSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer } from '../../pos/types';
import { PaymentMethod, Sale } from '../types';

interface ChangePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onCompleted: (updatedSale: Sale) => void;
}

const METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo', icon: Banknote, activeClass: 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  { id: 'TARJETA', name: 'Tarjeta', icon: CreditCard, activeClass: 'border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' },
  { id: 'TRANSFERENCIA', name: 'Transfer', icon: Landmark, activeClass: 'border-amber-500 bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  { id: 'FIADO', name: 'Fiado', icon: User, activeClass: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-950/40' },
] as const;

export function ChangePaymentMethodDialog({ open, onOpenChange, sale, onCompleted }: ChangePaymentMethodDialogProps) {
  // El estado arranca limpio en cada apertura porque la página remonta el diálogo con otra `key`
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [customerId, setCustomerId] = useState(sale?.customer?.id ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useSWR<Customer[]>(open && method === 'FIADO' ? '/customers' : null);

  if (!sale) return null;

  const canSubmit = !!method && method !== sale.paymentMethod && !(method === 'FIADO' && !customerId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const response = await api.patch<Sale>(`/sales/${sale.id}/payment-method`, {
        paymentMethod: method,
        customerId: method === 'FIADO' ? customerId : undefined,
      });
      onCompleted(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo cambiar el método de pago.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">
            Corregir método de pago · Ticket #{sale.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-xs text-slate-500">
            Se registró como <strong className="text-slate-700 dark:text-slate-200">{sale.paymentMethod.toLowerCase()}</strong> por{' '}
            <strong className="text-slate-700 dark:text-slate-200">${sale.total.toFixed(2)}</strong>. ¿Con qué pagó realmente?
          </p>

          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isCurrent = sale.paymentMethod === m.id;
              const isActive = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setMethod(m.id)}
                  className={`h-11 px-2 border rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${isActive
                    ? `border-2 ${m.activeClass}`
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{m.name}{isCurrent ? ' (actual)' : ''}</span>
                </button>
              );
            })}
          </div>

          {method === 'FIADO' && (
            <CustomSelect
              value={customerId}
              onChange={setCustomerId}
              placeholder="Seleccione el cliente que se lo lleva fiado..."
              options={(customers ?? []).map((c) => ({
                value: c.id,
                label: `${c.name} (debe $${c.currentDebt.toFixed(2)})`,
              }))}
            />
          )}

          {method && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                {sale.paymentMethod.toLowerCase()} <ArrowRight className="h-3 w-3" /> {method.toLowerCase()}
              </span>
              {sale.paymentMethod === 'EFECTIVO' && <span className="block">Se quitan ${sale.total.toFixed(2)} del efectivo esperado en caja.</span>}
              {sale.paymentMethod === 'FIADO' && <span className="block">Se quita el cargo de ${sale.total.toFixed(2)} de la deuda de {sale.customer?.name ?? 'el cliente'}.</span>}
              {method === 'EFECTIVO' && <span className="block">Se suman ${sale.total.toFixed(2)} al efectivo esperado en caja.</span>}
              {method === 'FIADO' && <span className="block">Se carga ${sale.total.toFixed(2)} a la deuda del cliente.</span>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 flex items-center gap-1.5 cursor-pointer"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar método
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
