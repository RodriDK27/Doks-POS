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
      <header className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="h-16 px-6 rounded-2xl bg-slate-200 dark:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 text-2xl font-black flex items-center gap-3 cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-8 w-8 stroke-[3]" />
          {backLabel}
        </button>
        <h1 className="text-3xl font-black truncate">{title}</h1>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-5">{children}</div>
    </div>
  );
}

interface BigKeypadProps {
  title: string;
  /** Texto de apoyo debajo del título (ej. "$189 el kilo") */
  hint?: string;
  confirmLabel: string;
  /** Monto mínimo aceptado (ej. el total a cobrar) */
  minAmount?: number;
  onConfirm: (amount: number) => void;
  onBack: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

/** Teclado numérico gigante para capturar pesos, sin teclado del sistema */
export function BigKeypad({ title, hint, confirmLabel, minAmount = 0, onConfirm, onBack }: BigKeypadProps) {
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
    <SimpleOverlay title={title} onBack={onBack}>
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        {hint && <p className="text-center text-2xl font-bold text-slate-600 dark:text-slate-400">{hint}</p>}

        <div className="h-24 rounded-3xl bg-white dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-700 flex items-center justify-center text-6xl font-black tabular-nums">
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
              className={`h-20 rounded-2xl text-4xl font-black cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center ${
                key === 'DEL' ? 'bg-slate-300 text-slate-800 dark:text-slate-200 active:bg-slate-400 dark:active:bg-slate-600' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 active:bg-slate-100 dark:active:bg-slate-800'
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
          className="h-24 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white text-4xl font-black shadow-lg cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {confirmLabel}
        </button>
      </div>
    </SimpleOverlay>
  );
}
