import React from 'react';
import { ArrowLeft, User, Banknote, CreditCard, Landmark, AlertCircle, Info, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Customer } from '../types';

interface PaymentPanelProps {
  getTotal: () => number;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  customers: Customer[];
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO';
  setPaymentMethod: (method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO') => void;
  amountPaid: number;
  setAmountPaid: (val: number) => void;
  isSubmitting?: boolean;
  changeAmount: number;
  amountPaidInputRef: React.RefObject<HTMLInputElement | null>;
  confirmButtonRef: React.RefObject<HTMLButtonElement | null>;
  canCheckout: boolean;
  onCheckout: () => void;
  onBackToTicket: () => void;
  isUnified?: boolean;
}

export function PaymentPanel({
  getTotal,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  isSubmitting = false,
  changeAmount,
  amountPaidInputRef,
  confirmButtonRef,
  canCheckout,
  onCheckout,
  onBackToTicket,
  isUnified = false,
}: PaymentPanelProps) {

  const currentTotal = getTotal();

  return (
    <div className={`flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden gap-2 ${isUnified ? 'p-2.5' : 'p-2.5 sm:p-3.5'}`}>
      {/* Botón de Regresar (Sólo si no está unificado) */}
      {!isUnified && (
        <div className="flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-2 py-1 h-7"
            onClick={onBackToTicket}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Ticket
          </Button>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Consola de Pago
          </span>
        </div>
      )}

      {/* Tarjeta de Total */}
      <div className="bg-slate-950 dark:bg-black/40 border border-slate-900 dark:border-slate-850 py-2 px-3 rounded-xl text-white flex justify-between items-center shadow-sm shrink-0">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Monto Neto a Cobrar</span>
        <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400">${currentTotal.toFixed(2)}</span>
      </div>

      {/* Selector de Cliente Duplicado para facilidad en cobro */}
      {!isUnified && (
        <div className="space-y-0.5 shrink-0">
          <label className="text-[8.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User className="h-3 w-3" /> Cliente
          </label>
          <CustomSelect
            className="h-8 rounded-xl text-[10px] bg-white dark:bg-slate-900 dark:border-slate-800 border-slate-200"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            placeholder="-- Público General --"
            options={[
              { value: '', label: '-- Público General --' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.name} ${c.currentDebt > 0 ? `(Debe: $${c.currentDebt.toFixed(0)})` : ''}`,
              })),
            ]}
          />
        </div>
      )}

      {/* Botones de Métodos de Pago */}
      <div className="space-y-0.5 shrink-0">
        <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Método de Pago</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {([
            { id: 'EFECTIVO', name: 'Efectivo', icon: Banknote, activeClass: 'border-emerald-500 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' },
            { id: 'TARJETA', name: 'Tarjeta', icon: CreditCard, activeClass: 'border-blue-500 bg-blue-50/40 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' },
            { id: 'TRANSFERENCIA', name: 'Transfer', icon: Landmark, activeClass: 'border-amber-500 bg-amber-50/40 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' },
            { id: 'FIADO', name: 'Fiado', icon: User, activeClass: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-950/40' },
          ] as const).map((m) => {
            const Icon = m.icon;
            const isActive = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`h-9 px-0 border rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold active:scale-95 transition-all cursor-pointer ${
                  isActive
                    ? `border-2 ${m.activeClass} shadow-xs`
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setPaymentMethod(m.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modos dinámicos en base al método de pago */}
      <div className="shrink-0">
        {paymentMethod === 'EFECTIVO' && (
          <div className="p-2 border border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Billetes rápidos en scroll horizontal */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase shrink-0 mr-0.5">Rápido:</span>
              {[20, 50, 100, 200, 500, 1000].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  className="h-6 px-1.5 text-[8.5px] font-extrabold shrink-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-md active:scale-95 transition-all cursor-pointer shadow-none"
                  onClick={() => setAmountPaid(val)}
                >
                  ${val}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-6 px-1.5 text-[8.5px] font-black shrink-0 border-indigo-200/60 text-indigo-600 bg-indigo-50/20 dark:border-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-50/50 rounded-md active:scale-95 transition-all cursor-pointer shadow-none"
                onClick={() => setAmountPaid(currentTotal)}
              >
                Exacto
              </Button>
            </div>

            {/* Dinero recibido y Cambio */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Efectivo Recibido</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">$</span>
                  <Input
                    ref={amountPaidInputRef}
                    type="number"
                    step="any"
                    className="pl-5.5 h-7.5 text-xs font-black border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus-visible:ring-indigo-500 rounded-lg"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Su Cambio</span>
                <span
                  className={`text-base font-black block leading-tight ${
                    changeAmount > 0 ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  ${changeAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'FIADO' && (
          <div className="p-2 border border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[8.5px] uppercase tracking-wider">Fiado (Venta a Crédito)</p>
              <p className="text-[8.5px] text-rose-500 dark:text-rose-400 leading-tight mt-0.5">
                {selectedCustomerId
                  ? `Esta venta se registrará a nombre de "${customers.find((c) => c.id === selectedCustomerId)?.name}".`
                  : '⚠️ ATENCIÓN: Debe seleccionar un cliente de la lista para autorizar el fiado.'}
              </p>
            </div>
          </div>
        )}

        {['TARJETA', 'TRANSFERENCIA'].includes(paymentMethod) && (
          <div className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 rounded-xl flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight">
              Asegúrate de que la transacción electrónica haya sido aprobada y procesada correctamente en la terminal o banca antes de guardar la venta.
            </p>
          </div>
        )}
      </div>

      {/* Botón de Confirmar Cobro Principal */}
      <div className="shrink-0">
        <Button
          ref={confirmButtonRef}
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canCheckout || isSubmitting}
          onClick={onCheckout}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Procesando Venta...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Registrar Venta [F8]</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}



