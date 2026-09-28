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
    <div className="fixed inset-0 z-40 flex flex-col bg-stone-100 text-stone-900 animate-in fade-in duration-150">
      <header className="flex items-center gap-4 px-5 py-4 bg-white border-b-2 border-stone-200 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="h-16 px-6 rounded-2xl bg-stone-200 active:bg-stone-300 text-stone-800 text-2xl font-black flex items-center gap-3 cursor-pointer shrink-0"
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
        {hint && <p className="text-center text-2xl font-bold text-stone-600">{hint}</p>}

        <div className="h-24 rounded-3xl bg-white border-4 border-stone-300 flex items-center justify-center text-6xl font-black tabular-nums">
          {value ? `$${value}` : <span className="text-stone-300">$0</span>}
        </div>

        {minAmount > 0 && amount > 0 && amount < minAmount && (
          <p className="text-center text-2xl font-black text-rose-600">Tiene que ser {formatMoney(minAmount)} o más</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={`h-20 rounded-2xl text-4xl font-black cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center ${
                key === 'DEL' ? 'bg-stone-300 text-stone-800 active:bg-stone-400' : 'bg-white text-stone-900 border-2 border-stone-200 active:bg-stone-100'
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
          className="h-24 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white text-4xl font-black shadow-lg cursor-pointer disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {confirmLabel}
        </button>
      </div>
    </SimpleOverlay>
  );
}
