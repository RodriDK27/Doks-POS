'use client';

import React from 'react';
import { Banknote, ImageIcon, Keyboard, Scale } from 'lucide-react';
import { getProductImageSrc } from '@/lib/productImages';
import { roundMoney, weightQuantityForAmount } from '@/lib/utils';
import { Product } from '../../pos/types';
import { formatMoney, formatWeight } from '../helpers';
import { SimpleOverlay } from './SimpleOverlay';

/** Lo que más se pide a granel: "un cuarto", "medio", "un kilo"... */
const KILO_OPTIONS = [
  { kg: 0.25, label: 'Un cuarto' },
  { kg: 0.5, label: 'Medio kilo' },
  { kg: 0.75, label: 'Tres cuartos' },
  { kg: 1, label: 'Un kilo' },
  { kg: 1.5, label: 'Kilo y medio' },
  { kg: 2, label: 'Dos kilos' },
];

/** "Deme $20 de jamón" */
const MONEY_OPTIONS = [10, 20, 50, 100];

interface WeightStepProps {
  product: Product;
  /** Un toque agrega directo: por kilos o por dinero */
  onPickKilos: (kg: number) => void;
  onPickAmount: (amount: number) => void;
  onOtherAmount: () => void;
  onBack: () => void;
}

/**
 * Producto a granel: botones con el precio ya calculado, así no tiene que saber cuánto cuesta el medio.
 * Si le piden otra cantidad de dinero, el teclado sigue disponible.
 */
export function WeightStep({ product, onPickKilos, onPickAmount, onOtherAmount, onBack }: WeightStepProps) {
  const imageSrc = getProductImageSrc(product.imageUrl);
  const pricePerKg = product.sellPrice;

  return (
    <SimpleOverlay title={`¿Cuánto de ${product.name}?`} onBack={onBack}>
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs p-3">
          <div className="h-20 w-20 rounded-xl overflow-hidden bg-white border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
              <img src={imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-9 w-9 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-black truncate text-slate-900 dark:text-slate-100">{product.name}</p>
            <p className="text-xl font-bold text-slate-500">{formatMoney(pricePerKg)} el kilo</p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-800 dark:text-slate-100">
            <Scale className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Por kilo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {KILO_OPTIONS.map(({ kg, label }) => (
              <button
                key={kg}
                type="button"
                onClick={() => onPickKilos(kg)}
                className="h-32 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400 shadow-xs hover:shadow-lg active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{label}</span>
                <span className="text-lg font-bold text-slate-400">{formatWeight(kg)}</span>
                <span className="text-4xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">
                  {formatMoney(roundMoney(pricePerKg * kg))}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-800 dark:text-slate-100">
            <Banknote className="h-7 w-7 text-emerald-600 dark:text-emerald-400" /> Por dinero
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {MONEY_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onPickAmount(amount)}
                className="h-28 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 shadow-xs hover:shadow-lg active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-4xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">{formatMoney(amount)}</span>
                <span className="text-lg font-bold text-slate-400">{formatWeight(weightQuantityForAmount(amount, pricePerKg))}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onOtherAmount}
              className="h-28 col-span-2 md:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 shadow-xs active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
            >
              <Keyboard className="h-9 w-9" />
              <span className="text-xl font-extrabold">Otra cantidad</span>
            </button>
          </div>
        </section>
      </div>
    </SimpleOverlay>
  );
}
