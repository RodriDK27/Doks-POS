'use client';

import React from 'react';
import { Banknote, CheckCircle2, Keyboard, Loader2, ShoppingCart, WifiOff } from 'lucide-react';
import { SimpleOverlay } from './SimpleOverlay';
import { formatMoney } from '../helpers';

/** Colores parecidos a los billetes mexicanos, para reconocerlos de un vistazo */
const BILL_STYLES: Record<number, { card: string; medal: string; text: string }> = {
  20: { card: 'from-sky-50 to-sky-100 border-sky-400', medal: 'bg-sky-500', text: 'text-sky-900' },
  50: { card: 'from-pink-50 to-pink-100 border-pink-400', medal: 'bg-pink-500', text: 'text-pink-900' },
  100: { card: 'from-red-50 to-red-100 border-red-400', medal: 'bg-red-500', text: 'text-red-900' },
  200: { card: 'from-green-50 to-green-100 border-green-500', medal: 'bg-green-600', text: 'text-green-900' },
  500: { card: 'from-amber-50 to-amber-100 border-amber-500', medal: 'bg-amber-600', text: 'text-amber-900' },
  1000: { card: 'from-violet-50 to-violet-100 border-violet-400', medal: 'bg-violet-500', text: 'text-violet-900' },
};
const BILLS = [20, 50, 100, 200, 500, 1000];
const COINS = [10, 5, 2, 1, 0.5];

interface PaymentStepProps {
  total: number;
  /** Cuántas piezas lleva la venta (para el resumen) */
  itemCount: number;
  /** Monto exacto que cubre el total (para "Le pagaron justo") */
  exactAmount: number;
  onPaid: (amount: number) => void;
  onOtherAmount: () => void;
  onBack: () => void;
}

/** Botón con forma de billete: su color, "BILLETE", el valor en grande y el cambio que daría */
function BillButton({ value, total, onClick }: { value: number; total: number; onClick: () => void }) {
  const style = BILL_STYLES[value];
  const change = Math.round((value - total) * 100) / 100;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-36 rounded-2xl border-2 bg-gradient-to-br ${style.card} shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer overflow-hidden text-left px-5 py-3 flex flex-col justify-between`}
    >
      {/* Marco interior como el de un billete */}
      <span className="pointer-events-none absolute inset-2 rounded-xl border border-white/70" />
      <span className="relative flex items-center gap-2">
        <span className={`h-9 w-9 rounded-full ${style.medal} text-white flex items-center justify-center shadow-xs`}>
          <Banknote className="h-5 w-5" />
        </span>
        <span className={`text-sm font-black uppercase tracking-widest ${style.text} opacity-70`}>Billete</span>
      </span>
      <span className="relative flex items-end justify-between gap-2">
        <span className={`text-5xl font-black tabular-nums leading-none ${style.text}`}>{formatMoney(value)}</span>
        <span className={`text-base font-bold ${style.text} opacity-80 whitespace-nowrap`}>
          {change > 0 ? `Cambio ${formatMoney(change)}` : 'Sin cambio'}
        </span>
      </span>
    </button>
  );
}

/** "¿Con cuánto le pagaron?": un toque en el billete y listo */
export function PaymentStep({ total, itemCount, exactAmount, onPaid, onOtherAmount, onBack }: PaymentStepProps) {
  const bills = BILLS.filter((value) => value >= total);

  return (
    <SimpleOverlay title="Cobrar" onBack={onBack}>
      <div className="max-w-6xl mx-auto grid gap-5 landscape:lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        {/* Resumen: mismo recuadro del total que el panel de cobro del punto de venta */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-950 dark:bg-black/60 border border-slate-900 dark:border-slate-800 shadow-md px-6 py-6 text-center">
            <p className="text-xl font-black uppercase tracking-widest text-slate-400">Total a cobrar</p>
            <p className="text-8xl font-black tabular-nums tracking-tight text-emerald-400 leading-none mt-3">{formatMoney(total)}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-lg font-bold text-slate-300">
              <ShoppingCart className="h-5 w-5" />
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPaid(exactAmount)}
            className="h-32 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-4 px-5"
          >
            <CheckCircle2 className="h-14 w-14 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-4xl font-black">Le pagaron justo</span>
              <span className="text-xl font-bold opacity-90">{formatMoney(total)} · sin cambio</span>
            </span>
          </button>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">¿Con cuánto le pagaron?</h2>
          <div className="grid grid-cols-2 gap-4">
            {bills.map((value) => (
              <BillButton key={value} value={value} total={total} onClick={() => onPaid(value)} />
            ))}
            <button
              type="button"
              onClick={onOtherAmount}
              className="h-36 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 shadow-xs active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Keyboard className="h-10 w-10" />
              <span className="text-2xl font-extrabold">Otra cantidad</span>
            </button>
          </div>
        </section>
      </div>
    </SimpleOverlay>
  );
}

/** Billetes y monedas para dar un cambio (de mayor a menor). Lo que no se completa con monedas queda en centavos. */
function changeBreakdown(change: number): { pieces: Array<{ value: number; count: number; isBill: boolean }>; cents: number } {
  let remaining = Math.round(change * 100);
  const pieces: Array<{ value: number; count: number; isBill: boolean }> = [];
  for (const value of [...BILLS].reverse().concat(COINS)) {
    const unit = Math.round(value * 100);
    const count = Math.floor(remaining / unit);
    if (count > 0) {
      pieces.push({ value, count, isBill: value >= 20 });
      remaining -= count * unit;
    }
  }
  return { pieces, cents: remaining / 100 };
}

function ChangePiece({ value, count, isBill }: { value: number; count: number; isBill: boolean }) {
  const label = value < 1 ? `${Math.round(value * 100)}¢` : formatMoney(value);
  return (
    <div className="flex items-center gap-2">
      {count > 1 && <span className="text-2xl font-black text-slate-500">{count} ×</span>}
      {isBill ? (
        <span
          className={`h-16 min-w-28 px-3 rounded-xl border-2 bg-gradient-to-br ${BILL_STYLES[value].card} ${BILL_STYLES[value].text} flex items-center justify-center text-3xl font-black tabular-nums shadow-xs`}
        >
          {label}
        </span>
      ) : (
        <span className="h-16 w-16 rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center text-xl font-black tabular-nums shadow-xs">
          {label}
        </span>
      )}
    </div>
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
 * Muestra el cambio en grande y cómo darlo en billetes y monedas. La venta se guarda al tocar
 * "Ya di el cambio": así, si se equivocó de billete, "Me equivoqué" regresa sin haber registrado nada.
 */
export function ChangeStep({ total, amountPaid, isSubmitting, isOnline, error, onConfirm, onBack }: ChangeStepProps) {
  const change = Math.max(0, Math.round((amountPaid - total) * 100) / 100);
  const { pieces, cents } = changeBreakdown(change);

  return (
    <SimpleOverlay title="Cambio" onBack={onBack} backLabel="Me equivoqué">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs px-5 py-4">
            <p className="text-lg font-black uppercase tracking-wider text-slate-400">Le pagaron</p>
            <p className="text-5xl font-black tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(amountPaid)}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs px-5 py-4">
            <p className="text-lg font-black uppercase tracking-wider text-slate-400">Son</p>
            <p className="text-5xl font-black tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(total)}</p>
          </div>
        </div>

        {change > 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500 shadow-md px-6 py-6 text-center">
            <p className="text-3xl font-black uppercase tracking-wider text-slate-500">Dé de cambio</p>
            <p className="text-[8rem] leading-none font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
              {formatMoney(change)}
            </p>

            {/* Cómo darlo: evita hacer cuentas con los billetes en la mano */}
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xl font-bold text-slate-500 mb-3">Así lo puede dar:</p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
                {pieces.map((piece) => (
                  <ChangePiece key={piece.value} {...piece} />
                ))}
                {cents > 0 && <span className="text-2xl font-black text-slate-500">+ {formatMoney(cents)} en centavos</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500 shadow-md py-10 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
            <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">Sin cambio</p>
          </div>
        )}

        {!isOnline && (
          <p className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-600 dark:text-slate-400">
            <WifiOff className="h-7 w-7" /> Sin internet: la venta se guarda en la tableta
          </p>
        )}

        {error && (
          <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-2xl font-bold p-4">
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
