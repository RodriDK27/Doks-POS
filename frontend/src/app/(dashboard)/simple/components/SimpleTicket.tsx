'use client';

import React from 'react';
import { ArrowRight, ImageIcon, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { SimpleItem, formatMoney, itemTotal } from '../helpers';

interface SimpleTicketProps {
  items: SimpleItem[];
  total: number;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onClearAll: () => void;
  onCharge: () => void;
}

/**
 * Ticket de la venta actual. Mismo panel que el ticket del punto de venta (TicketPanel),
 * con letras y botones más grandes: foto, cantidad con +/− y un solo botón de COBRAR.
 */
export function SimpleTicket({ items, total, onIncrement, onDecrement, onClearAll, onCharge }: SimpleTicketProps) {
  const pieces = items.reduce((sum, i) => sum + (i.isWeight ? 1 : i.quantity), 0);

  return (
    <aside className="w-[380px] xl:w-[440px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden min-h-0">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 flex justify-between items-center shrink-0 min-h-[68px]">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span className="font-extrabold text-lg text-slate-700 dark:text-slate-200 uppercase tracking-wider">Venta</span>
          <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-sm font-black px-3 py-1 rounded-lg">
            {pieces} uds
          </span>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="h-11 px-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-base font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Trash2 className="h-5 w-5" /> Borrar todo
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-300 dark:text-slate-600">
              <ShoppingCart className="h-10 w-10" />
            </div>
            <p className="text-xl font-bold text-slate-400 dark:text-slate-500 leading-snug">
              Toque un producto o páselo por el lector
            </p>
          </div>
        ) : (
          items.map((item) => {
            const canChangeQuantity = !item.isWeight;
            return (
              <div
                key={item.key}
                className="p-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-2xs flex flex-col gap-3 animate-in fade-in duration-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 dark:border-slate-800 bg-white overflow-hidden flex items-center justify-center">
                    {item.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
                      <img src={item.imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-extrabold leading-tight line-clamp-2 text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.isWeight ? 'A granel' : `${formatMoney(item.price)} c/u`}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums shrink-0">
                    {formatMoney(itemTotal(item))}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canChangeQuantity ? (
                    <div className="flex-1 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 h-14 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.key)}
                        aria-label={`Quitar uno de ${item.name}`}
                        className="h-full flex-1 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
                      >
                        <Minus className="h-7 w-7 stroke-[2.5]" />
                      </button>
                      <span className="w-16 text-center text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.key)}
                        aria-label={`Agregar otro ${item.name}`}
                        className="h-full flex-1 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
                      >
                        <Plus className="h-7 w-7 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {/* Quitar el renglón completo; con "Deshacer" por si fue un error */}
                  <button
                    type="button"
                    onClick={() => onDecrement(item.key)}
                    aria-label={`Quitar ${item.name}`}
                    className={`h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer active:scale-90 transition-all shrink-0 ${
                      canChangeQuantity && item.quantity > 1 ? 'hidden' : ''
                    }`}
                  >
                    <Trash2 className="h-7 w-7 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 shrink-0">
        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="font-black text-base text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums leading-none">
            {formatMoney(total)}
          </span>
        </div>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCharge}
          className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-3xl rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
        >
          Cobrar
          <ArrowRight className="h-8 w-8" />
        </button>
      </div>
    </aside>
  );
}
