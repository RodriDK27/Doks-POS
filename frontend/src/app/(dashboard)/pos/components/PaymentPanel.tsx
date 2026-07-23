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
}: PaymentPanelProps) {
  const currentTotal = getTotal();

  const handleAmountChange = (val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setAmountPaid(0);
    } else {
      // Redondear a máximo 2 decimales para evitar problemas como 46.992
      setAmountPaid(Math.round(parsed * 100) / 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-4 sm:p-6 gap-4">
      {/* Botón de Regresar / Encabezado */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-1.5 h-8"
          onClick={onBackToTicket}
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Ticket
        </Button>
        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
          Consola de Pago
        </span>
      </div>

      {/* Tarjeta Destacada de Total */}
      <div className="bg-slate-950 dark:bg-black/60 border border-slate-900 dark:border-slate-800 py-3.5 px-4 rounded-2xl text-white flex justify-between items-center shadow-md shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto Neto a Cobrar</span>
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">${currentTotal.toFixed(2)}</span>
      </div>

      {/* Selector de Cliente */}
      <div className="space-y-1 shrink-0">
        <label className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> Cliente
        </label>
        <CustomSelect
          className="h-10 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 dark:border-slate-800 border-slate-200"
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

      {/* Botones de Métodos de Pago */}
      <div className="space-y-1 shrink-0">
        <label className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Método de Pago</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: 'EFECTIVO', name: 'Efectivo', icon: Banknote, activeClass: 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
            { id: 'TARJETA', name: 'Tarjeta', icon: CreditCard, activeClass: 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
            { id: 'TRANSFERENCIA', name: 'Transfer', icon: Landmark, activeClass: 'border-amber-500 bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
            { id: 'FIADO', name: 'Fiado', icon: User, activeClass: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-950/40' },
          ] as const).map((m) => {
            const Icon = m.icon;
            const isActive = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`h-11 px-2 border rounded-xl flex items-center justify-center gap-2 text-xs font-black active:scale-95 transition-all cursor-pointer ${
                  isActive
                    ? `border-2 ${m.activeClass} shadow-xs scale-[1.02]`
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setPaymentMethod(m.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modos dinámicos en base al método de pago */}
      <div className="shrink-0">
        {paymentMethod === 'EFECTIVO' && (
          <div className="p-3 border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Billetes rápidos en cuadrícula táctil */}
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Billetes Rápidos:</span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {[20, 50, 100, 200, 500, 1000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    className="h-9 px-1 text-xs font-black shrink-0 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl active:scale-95 transition-all cursor-pointer shadow-2xs"
                    onClick={() => setAmountPaid(val)}
                  >
                    ${val}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-1 text-xs font-black shrink-0 border-indigo-200 text-indigo-600 bg-indigo-50 dark:border-indigo-900/40 dark:text-indigo-300 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-xl active:scale-95 transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
                  onClick={() => setAmountPaid(currentTotal)}
                >
                  Exacto
                </Button>
              </div>
            </div>

            {/* Dinero recibido y Cambio */}
            <div className="grid grid-cols-2 gap-3 items-center pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Efectivo Recibido</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm text-slate-400">$</span>
                  <Input
                    ref={amountPaidInputRef}
                    type="number"
                    step="0.01"
                    className="pl-7 h-10 text-sm font-black border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus-visible:ring-indigo-500 rounded-xl"
                    value={amountPaid ? String(amountPaid) : ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-right space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Su Cambio</span>
                <span
                  className={`text-xl sm:text-2xl font-black block leading-none ${
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
          <div className="p-3 border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs uppercase tracking-wider">Fiado (Venta a Crédito)</p>
              <p className="text-xs text-rose-500 dark:text-rose-400 leading-tight mt-0.5">
                {selectedCustomerId
                  ? `Esta venta se registrará a nombre de "${customers.find((c) => c.id === selectedCustomerId)?.name}".`
                  : '⚠️ ATENCIÓN: Debe seleccionar un cliente de la lista para autorizar el fiado.'}
              </p>
            </div>
          </div>
        )}

        {['TARJETA', 'TRANSFERENCIA'].includes(paymentMethod) && (
          <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Asegúrate de que la transacción electrónica haya sido aprobada y procesada correctamente en la terminal o banca antes de guardar la venta.
            </p>
          </div>
        )}
      </div>

      {/* Botón de Confirmar Cobro Principal */}
      <div className="shrink-0 pt-2">
        <Button
          ref={confirmButtonRef}
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-12 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canCheckout || isSubmitting}
          onClick={onCheckout}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span>Procesando Venta...</span>
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              <span>Registrar Venta [F8]</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
