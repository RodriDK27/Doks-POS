'use client';

import React from 'react';
import { CheckCircle2, Printer, X } from 'lucide-react';
import type { LastSale } from '../hooks/usePOS';

interface LastSaleBarProps {
  lastSale: LastSale;
  onViewTicket: () => void;
  onDismiss: () => void;
}

/** Resumen de la venta recién cobrada: el cambio se queda a la vista mientras se cuenta el dinero */
export function LastSaleBar({ lastSale, onViewTicket, onDismiss }: LastSaleBarProps) {
  const showChange = lastSale.paymentMethod === 'EFECTIVO';

  return (
    <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 animate-in fade-in slide-in-from-top-1 duration-200">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-300">
          {lastSale.id ? `Última venta #${lastSale.id}` : 'Última venta (sin conexión)'}
        </span>
        <span className="font-bold text-slate-500">
          ${lastSale.total.toFixed(2)} · {lastSale.paymentMethod.toLowerCase()}
        </span>
        {showChange && (
          <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
            Cambio: ${lastSale.change.toFixed(2)}
          </span>
        )}
      </div>
      {lastSale.id && (
        <button
          type="button"
          onClick={onViewTicket}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950 cursor-pointer shrink-0"
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ver / imprimir</span>
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
        aria-label="Ocultar última venta"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
