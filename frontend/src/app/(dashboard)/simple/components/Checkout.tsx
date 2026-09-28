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
  { value: 500, className: 'bg-amber-100 border-amber-500 text-amber-900' },
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
        <div className="rounded-2xl bg-slate-950 dark:bg-black/60 border border-slate-900 dark:border-slate-800 shadow-md py-5 text-center">
          <p className="text-3xl font-bold text-slate-400">Son</p>
          <p className="text-8xl font-black tabular-nums text-emerald-400">{formatMoney(total)}</p>
        </div>

        <p className="text-center text-4xl font-black text-slate-800 dark:text-slate-200">¿Con cuánto le pagaron?</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onPaid(exactAmount)}
            className="h-28 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="text-3xl font-black">Justo</span>
            <span className="text-xl font-bold opacity-90">{formatMoney(total)}, sin cambio</span>
          </button>

          {bills.map((bill) => (
            <button
              key={bill.value}
              type="button"
              onClick={() => onPaid(bill.value)}
              className={`h-28 rounded-2xl border-2 shadow-xs hover:shadow-lg cursor-pointer active:scale-95 transition-all text-5xl font-black tabular-nums ${bill.className}`}
            >
              {formatMoney(bill.value)}
            </button>
          ))}

          <button
            type="button"
            onClick={onOtherAmount}
            className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 shadow-xs active:scale-95 transition-all cursor-pointer text-3xl font-extrabold"
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
          <div className="w-full rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500 shadow-md py-8">
            <p className="text-4xl font-black uppercase tracking-wider text-slate-500">Dé de cambio</p>
            <p className="text-[9rem] leading-none font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">{formatMoney(change)}</p>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500 shadow-md py-10">
            <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">Sin cambio</p>
          </div>
        )}

        {!isOnline && (
          <p className="flex items-center gap-2 text-2xl font-bold text-slate-600 dark:text-slate-400">
            <WifiOff className="h-7 w-7" /> Sin internet: la venta se guarda en la tableta
          </p>
        )}

        {error && (
          <p className="w-full rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-2xl font-bold p-4">
            No se guardó la venta: {error} Toque el botón verde para intentar otra vez.
          </p>
        )}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          className="w-full h-24 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer text-4xl font-black uppercase tracking-wider flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-wait"
        >
          {isSubmitting ? <Loader2 className="h-12 w-12 animate-spin" /> : <CheckCircle2 className="h-12 w-12" />}
          {change > 0 ? 'Ya di el cambio' : 'Listo'}
        </button>
      </div>
    </SimpleOverlay>
  );
}
