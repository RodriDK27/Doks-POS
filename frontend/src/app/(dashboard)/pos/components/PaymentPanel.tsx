import React from 'react';
import { ArrowLeft, User, Banknote, CreditCard, Landmark, AlertCircle, Info, Check } from 'lucide-react';
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
    <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-y-auto scrollbar-none gap-4 ${isUnified ? 'p-3' : 'p-4'}`}>
      {/* Botón de Regresar (Sólo si no está unificado) */}
      {!isUnified && (
        <>
          <div className="flex items-center justify-between shrink-0">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-extrabold text-xs flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-2.5 py-1.5"
              onClick={onBackToTicket}
            >
              <ArrowLeft className="h-4 w-4" /> Volver al Ticket
            </Button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Consola de Pago
            </span>
          </div>

          {/* Tarjeta de Total */}
          <div className="bg-slate-950 dark:bg-black/40 border border-slate-900 dark:border-slate-850 p-4.5 rounded-2xl text-white flex flex-col justify-center items-center gap-1 shadow-sm shrink-0">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Monto Neto a Cobrar</span>
            <span className="text-3xl font-black tracking-tight text-emerald-455">${currentTotal.toFixed(2)}</span>
          </div>

          {/* Selector de Cliente Duplicado para facilidad en cobro */}
          <div className="space-y-1 shrink-0">
            <label className="text-[9px] font-black text-slate-455 dark:text-slate-505 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Cliente
            </label>
            <CustomSelect
              className="h-9.5 rounded-xl text-[11px] bg-white dark:bg-slate-900 dark:border-slate-800 border-slate-200"
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
        </>
      )}

      {/* Botones de Métodos de Pago */}
      <div className="space-y-1.5 shrink-0">
        <label className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Método de Pago</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                className={`h-12 px-0 border rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold active:scale-95 transition-all cursor-pointer ${
                  isActive
                    ? `border-2 ${m.activeClass} shadow-xs`
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setPaymentMethod(m.id)}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modos dinámicos en base al método de pago */}
      <div className="flex-1 min-h-0">
        {paymentMethod === 'EFECTIVO' && (
          <div className="p-3 border border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Billetes rápidos en scroll horizontal */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase shrink-0 mr-1">Rápido:</span>
              {[20, 50, 100, 200, 500, 1000].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  className="h-8 px-2.5 text-[10px] font-extrabold shrink-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all cursor-pointer shadow-none"
                  onClick={() => setAmountPaid(val)}
                >
                  ${val}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2.5 text-[10px] font-black shrink-0 border-indigo-200/60 text-indigo-650 bg-indigo-50/20 dark:border-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-50/50 rounded-lg active:scale-95 transition-all cursor-pointer shadow-none"
                onClick={() => setAmountPaid(currentTotal)}
              >
                Exacto
              </Button>
            </div>

            {/* Dinero recibido y Cambio */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Efectivo Recibido</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">$</span>
                  <Input
                    ref={amountPaidInputRef}
                    type="number"
                    step="any"
                    className="pl-6.5 h-9.5 text-xs font-black border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus-visible:ring-indigo-500 rounded-lg"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[9px] font-black text-slate-455 dark:text-slate-505 uppercase tracking-wider block">Su Cambio</span>
                <span
                  className={`text-xl font-black block leading-tight ${
                    changeAmount > 0 ? 'text-emerald-600 dark:text-emerald-450 animate-pulse' : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  ${changeAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'FIADO' && (
          <div className="p-3 border border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600 dark:text-rose-455 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[10px] uppercase tracking-wider">Fiado (Venta a Crédito)</p>
              <p className="text-[10px] text-rose-500 dark:text-rose-400 leading-normal mt-0.5">
                {selectedCustomerId
                  ? `Esta venta se registrará a nombre de "${customers.find((c) => c.id === selectedCustomerId)?.name}".`
                  : '⚠️ ATENCIÓN: Debe seleccionar un cliente de la lista para autorizar el fiado.'}
              </p>
            </div>
          </div>
        )}

        {['TARJETA', 'TRANSFERENCIA'].includes(paymentMethod) && (
          <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">
              Asegúrate de que la transacción electrónica haya sido aprobada y procesada correctamente en la terminal o banca antes de guardar la venta.
            </p>
          </div>
        )}
      </div>

      {/* Botón de Confirmar Cobro Principal */}
      <div className="space-y-3 shrink-0">
        <Button
          ref={confirmButtonRef}
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-12 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          <Check className="h-4.5 w-4.5" /> Registrar Venta [F8]
        </Button>
      </div>
    </div>
  );
}
