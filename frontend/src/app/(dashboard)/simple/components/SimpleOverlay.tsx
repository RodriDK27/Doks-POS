'use client';

import React, { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { formatMoney } from '../helpers';

interface SimpleOverlayProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  children: React.ReactNode;
}

/** Pantalla completa para cada paso: un solo título, un solo "Regresar" grande */
export function SimpleOverlay({ title, onBack, backLabel = 'Regresar', children }: SimpleOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-in fade-in duration-150">
      <header className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="h-14 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xl font-extrabold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
          {backLabel}
        </button>
        <h1 className="text-3xl font-black truncate">{title}</h1>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

interface NumericKeypadProps {
  /** Texto de apoyo arriba del monto (ej. "$189 el kilo") */
  hint?: string;
  confirmLabel: string;
  /** Monto mínimo aceptado (ej. el total a cobrar) */
  minAmount?: number;
  onConfirm: (amount: number) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

/** Teclado numérico gigante para capturar pesos, sin teclado del sistema. Se puede poner dentro de cualquier pantalla. */
export function NumericKeypad({ hint, confirmLabel, minAmount = 0, onConfirm }: NumericKeypadProps) {
  const [value, setValue] = useState('');
  const amount = parseFloat(value) || 0;
  const isValid = amount > 0 && amount >= minAmount;

  const press = (key: string) => {
    if (key === 'DEL') {
      setValue((v) => v.slice(0, -1));
      return;
    }
    setValue((v) => {
      if (key === '.' && v.includes('.')) return v;
      if (v.includes('.') && v.split('.')[1].length >= 2) return v;
      if (v.replace('.', '').length >= 6) return v;
      if (key === '.' && v === '') return '0.';
      if (v === '0' && key !== '.') return key;
      return v + key;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {hint && <p className="text-center text-2xl font-bold text-slate-600 dark:text-slate-400">{hint}</p>}

      <div className="h-24 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-center text-6xl font-black tabular-nums">
        {value ? `$${value}` : <span className="text-slate-300 dark:text-slate-600">$0</span>}
      </div>

      {minAmount > 0 && amount > 0 && amount < minAmount && (
        <p className="text-center text-2xl font-black text-rose-600 dark:text-rose-400">Tiene que ser {formatMoney(minAmount)} o más</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className={`h-20 rounded-2xl text-4xl font-black cursor-pointer shadow-2xs active:scale-95 transition-transform flex items-center justify-center ${
              key === 'DEL' ? 'bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 active:bg-slate-200' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            {key === 'DEL' ? <Delete className="h-10 w-10" /> : key}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!isValid}
        onClick={() => onConfirm(amount)}
        className="h-20 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-3xl font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

interface BigKeypadProps extends NumericKeypadProps {
  title: string;
  onBack: () => void;
}

/** El teclado numérico en su propia pantalla completa */
export function BigKeypad({ title, onBack, ...keypad }: BigKeypadProps) {
  return (
    <SimpleOverlay title={title} onBack={onBack}>
      <div className="max-w-xl mx-auto">
        <NumericKeypad {...keypad} />
      </div>
    </SimpleOverlay>
  );
}
