'use client';

import React from 'react';
import { ImageIcon, Minus, Plus, ScanBarcode, Trash2 } from 'lucide-react';
import { SimpleItem, formatMoney, itemTotal } from '../helpers';

interface SimpleTicketProps {
  items: SimpleItem[];
  total: number;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onClearAll: () => void;
  onCharge: () => void;
}

/** Ticket de la venta actual: foto, precio, botones +/− grandes y un solo botón de COBRAR */
export function SimpleTicket({ items, total, onIncrement, onDecrement, onClearAll, onCharge }: SimpleTicketProps) {
  return (
    <aside className="w-[380px] xl:w-[420px] shrink-0 flex flex-col bg-white border-l-2 border-stone-200 min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-stone-100 shrink-0">
        <h2 className="text-2xl font-black text-stone-900">Venta</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="h-12 px-4 rounded-xl bg-stone-100 active:bg-stone-200 text-stone-700 text-lg font-bold flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-5 w-5" /> Borrar todo
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-stone-400 px-6">
            <ScanBarcode className="h-20 w-20" />
            <p className="text-2xl font-bold leading-snug">Toque un producto o páselo por el lector</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="rounded-2xl border-2 border-stone-200 p-3 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 rounded-xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center">
                  {item.imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
                    <img src={item.imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-stone-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black leading-tight line-clamp-2 text-stone-900">{item.name}</p>
                  <p className="text-lg font-bold text-stone-500 mt-0.5">
                    {item.isWeight
                      ? `${formatMoney(itemTotal(item))} a granel`
                      : item.quantity > 1
                        ? `${item.quantity} × ${formatMoney(item.price)}`
                        : formatMoney(item.price)}
                  </p>
                </div>
                <p className="text-2xl font-black text-stone-900 tabular-nums shrink-0">{formatMoney(itemTotal(item))}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onDecrement(item.key)}
                  aria-label={`Quitar uno de ${item.name}`}
                  className="h-14 flex-1 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 active:bg-rose-100 flex items-center justify-center cursor-pointer"
                >
                  {item.isWeight || !item.productId || item.quantity === 1 ? (
                    <Trash2 className="h-7 w-7" />
                  ) : (
                    <Minus className="h-8 w-8 stroke-[3]" />
                  )}
                </button>
                {!item.isWeight && item.productId && (
                  <>
                    <span className="w-14 text-center text-3xl font-black tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.key)}
                      aria-label={`Agregar otro ${item.name}`}
                      className="h-14 flex-1 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 active:bg-emerald-100 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-8 w-8 stroke-[3]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t-2 border-stone-200 shrink-0">
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCharge}
          className="w-full h-28 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white shadow-lg cursor-pointer flex flex-col items-center justify-center disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <span className="text-2xl font-black tracking-wide">COBRAR</span>
          <span className="text-5xl font-black tabular-nums leading-none mt-1">{formatMoney(total)}</span>
        </button>
      </div>
    </aside>
  );
}
