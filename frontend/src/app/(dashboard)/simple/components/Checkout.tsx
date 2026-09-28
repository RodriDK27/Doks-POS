'use client';

import React from 'react';
import { CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { SimpleOverlay } from './SimpleOverlay';
import { formatMoney } from '../helpers';

// Colores parecidos a los billetes mexicanos, para reconocerlos de un vistazo
const BILLS = [
  { value: 20, className: 'bg-sky-100 border-sky-400 text-sky-900' },
  { value: 50, className: 'bg-pink-100 border-pink-400 text-pink-900' },
  { value: 100, className: 'bg-red-100 border-red-400 text-red-900' },
  { value: 200, className: 'bg-green-100 border-green-500 text-green-900' },
  { value: 500, className: 'bg-amber-100 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-300' },
  { value: 1000, className: 'bg-violet-100 border-violet-400 text-violet-900' },
];

interface PaymentStepProps {
  total: number;
  /** Monto exacto que cubre el total (para "Le pagaron justo") */
  exactAmount: number;
  onPaid: (amount: number) => void;
  onOtherAmount: () => void;
  onBack: () => void;
}

/** "¿Con cuánto le pagaron?": un toque en el billete y listo */
export function PaymentStep({ total, exactAmount, onPaid, onOtherAmount, onBack }: PaymentStepProps) {
  const bills = BILLS.filter((b) => b.value >= total);

  return (
    <SimpleOverlay title="Cobrar" onBack={onBack}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Mismo recuadro del total que el panel de cobro del punto de venta */}
        <div className="rounded-3xl bg-slate-950 dark:bg-black/60 border border-slate-900 dark:border-slate-800 shadow-md py-5 text-center">
          <p className="text-3xl font-bold text-slate-400">Son</p>
          <p className="text-8xl font-black tabular-nums text-emerald-400">{formatMoney(total)}</p>
        </div>

        <p className="text-center text-4xl font-black text-slate-800 dark:text-slate-200">¿Con cuánto le pagaron?</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onPaid(exactAmount)}
            className="h-28 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white shadow-lg cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="text-3xl font-black">Justo</span>
            <span className="text-xl font-bold opacity-90">{formatMoney(total)}, sin cambio</span>
          </button>

          {bills.map((bill) => (
            <button
              key={bill.value}
              type="button"
              onClick={() => onPaid(bill.value)}
              className={`h-28 rounded-3xl border-4 shadow-sm cursor-pointer active:scale-95 transition-transform text-5xl font-black tabular-nums ${bill.className}`}
            >
              {formatMoney(bill.value)}
            </button>
          ))}

          <button
            type="button"
            onClick={onOtherAmount}
            className="h-28 rounded-3xl bg-white dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer text-3xl font-black"
          >
            Otra cantidad
          </button>
        </div>
      </div>
    </SimpleOverlay>
  );
}

interface ChangeStepProps {
  total: number;
  amountPaid: number;
  isSubmitting: boolean;
  isOnline: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Muestra el cambio en grande. La venta se guarda al tocar "Listo", después de dar el cambio:
 * así, si se equivocó de billete, "Me equivoqué" regresa sin haber registrado nada.
 */
export function ChangeStep({ total, amountPaid, isSubmitting, isOnline, error, onConfirm, onBack }: ChangeStepProps) {
  const change = Math.max(0, Math.round((amountPaid - total) * 100) / 100);

  return (
    <SimpleOverlay title="Cambio" onBack={onBack} backLabel="Me equivoqué">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
        <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">
          Le pagaron {formatMoney(amountPaid)} · Son {formatMoney(total)}
        </p>

        {change > 0 ? (
          <div className="w-full rounded-[2.5rem] bg-amber-100 dark:bg-amber-950/40 border-4 border-amber-400 py-8">
            <p className="text-5xl font-black text-amber-900 dark:text-amber-300">DÉ DE CAMBIO</p>
            <p className="text-[9rem] leading-none font-black tabular-nums text-amber-950 dark:text-amber-200 mt-2">{formatMoney(change)}</p>
          </div>
        ) : (
          <div className="w-full rounded-[2.5rem] bg-emerald-50 dark:bg-emerald-950/40 border-4 border-emerald-300 dark:border-emerald-800 py-10">
            <p className="text-6xl font-black text-emerald-800 dark:text-emerald-300">Sin cambio</p>
          </div>
        )}

        {!isOnline && (
          <p className="flex items-center gap-2 text-2xl font-bold text-slate-600 dark:text-slate-400">
            <WifiOff className="h-7 w-7" /> Sin internet: la venta se guarda en la tableta
          </p>
        )}

        {error && (
          <p className="w-full rounded-2xl bg-rose-100 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-2xl font-bold p-4">
            No se guardó la venta: {error} Toque el botón verde para intentar otra vez.
          </p>
        )}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          className="w-full h-28 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white shadow-lg cursor-pointer text-5xl font-black flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-wait"
        >
          {isSubmitting ? <Loader2 className="h-12 w-12 animate-spin" /> : <CheckCircle2 className="h-12 w-12" />}
          {change > 0 ? 'Ya di el cambio' : 'Listo'}
        </button>
      </div>
    </SimpleOverlay>
  );
}
