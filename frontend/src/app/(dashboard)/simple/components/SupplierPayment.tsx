'use client';

import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getProductImageSrc } from '@/lib/productImages';
import { formatMoney } from '../helpers';
import { NumericKeypad, SimpleOverlay } from './SimpleOverlay';

export interface SimpleSupplier {
  id: string;
  name: string;
  logoUrl: string | null;
  expectedPayment: number;
  comesToday: boolean;
  pendingTickets: Array<{ id: string; amount: number; scheduledDate: string | null; notes: string | null }>;
}

/** El pago de "Llegó el proveedor" que se guarda al elegir el monto */
export interface SupplierPaymentDraft {
  supplier: SimpleSupplier;
  amount: number;
  /** Nota de preventa que se liquida con este pago */
  ticketId?: string;
}

// Colores de respaldo para proveedores sin logo (siempre el mismo color para el mismo proveedor)
const FALLBACK_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-sky-600', 'bg-violet-600'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function SupplierLogo({ supplier, className = 'h-full w-full' }: { supplier: Pick<SimpleSupplier, 'name' | 'logoUrl'>; className?: string }) {
  const src = getProductImageSrc(supplier.logoUrl);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- el logo viene del backend en otro dominio, ya optimizado
    return <img src={src} alt={supplier.name} crossOrigin="anonymous" className={`${className} object-contain p-2`} />;
  }
  const color = FALLBACK_COLORS[[...supplier.name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % FALLBACK_COLORS.length];
  return (
    <div className={`${className} ${color} flex items-center justify-center text-white text-5xl font-black`}>
      {initials(supplier.name)}
    </div>
  );
}

function SupplierCard({ supplier, onPick }: { supplier: SimpleSupplier; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col text-left rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer"
    >
      <div className="aspect-[4/3] w-full bg-white border-b border-slate-100 dark:border-slate-800/60 overflow-hidden">
        <SupplierLogo supplier={supplier} />
      </div>
      <div className="px-3 py-3">
        <p className="text-xl font-black leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">{supplier.name}</p>
        {supplier.pendingTickets.length > 0 && (
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">Tiene nota por pagar</p>
        )}
      </div>
    </button>
  );
}

interface SupplierPickStepProps {
  suppliers: SimpleSupplier[] | undefined;
  onPick: (supplier: SimpleSupplier) => void;
  onBack: () => void;
}

/** "¿Quién vino?": primero los que tienen entrega hoy, luego todos en orden alfabético */
export function SupplierPickStep({ suppliers, onPick, onBack }: SupplierPickStepProps) {
  const today = useMemo(() => suppliers?.filter((s) => s.comesToday) ?? [], [suppliers]);
  const others = useMemo(() => suppliers?.filter((s) => !s.comesToday) ?? [], [suppliers]);

  return (
    <SimpleOverlay title="¿Qué proveedor vino?" onBack={onBack}>
      {!suppliers ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-slate-400" />
        </div>
      ) : suppliers.length === 0 ? (
        <p className="text-2xl font-bold text-slate-500 text-center mt-10">Todavía no hay proveedores registrados.</p>
      ) : (
        <div className="space-y-5">
          {today.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Vienen hoy</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] portrait:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
                {today.map((s) => <SupplierCard key={s.id} supplier={s} onPick={() => onPick(s)} />)}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section className="space-y-3">
              {today.length > 0 && (
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-400">Todos los demás</h2>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] portrait:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
                {others.map((s) => <SupplierCard key={s.id} supplier={s} onPick={() => onPick(s)} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </SimpleOverlay>
  );
}

function SupplierHeader({ supplier, subtitle }: { supplier: SimpleSupplier; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs p-3">
      <div className="h-20 w-20 rounded-xl overflow-hidden bg-white border border-slate-100 dark:border-slate-800 shrink-0">
        <SupplierLogo supplier={supplier} className="h-full w-full text-2xl!" />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-black truncate text-slate-900 dark:text-slate-100">{supplier.name}</p>
        {subtitle && <p className="text-lg font-bold text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

interface SupplierAmountStepProps {
  supplier: SimpleSupplier;
  /** Guarda el pago de inmediato, sin pantalla de confirmación */
  onAmount: (amount: number, ticketId?: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * "¿Cuánto le pagó?": el teclado va directo porque con proveedores el monto casi siempre cambia.
 * Si hay nota pendiente o "lo de siempre", aparecen como atajos de un toque. Elegir el monto ya guarda el pago.
 */
export function SupplierAmountStep({ supplier, onAmount, onBack, isSubmitting, error }: SupplierAmountStepProps) {
  const hasTickets = supplier.pendingTickets.length > 0;
  const showUsual = !hasTickets && supplier.expectedPayment > 0;
  const hasShortcuts = hasTickets || showUsual;

  return (
    <SimpleOverlay title="¿Cuánto le pagó?" onBack={onBack}>
      <div className={`mx-auto grid gap-5 items-start ${hasShortcuts ? 'max-w-6xl landscape:lg:grid-cols-2' : 'max-w-xl'}`}>
        <section className="flex flex-col gap-4">
          <SupplierHeader supplier={supplier} subtitle="Sale de la caja grande" />

          {error && (
            <p className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-2xl font-bold p-4">
              No se guardó el pago: {error}
            </p>
          )}

          {supplier.pendingTickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onAmount(ticket.amount, ticket.id)}
              disabled={isSubmitting}
              className="h-32 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center disabled:opacity-70 disabled:cursor-wait"
            >
              <span className="text-2xl font-bold">Lo de la nota{ticket.scheduledDate ? ` del ${ticket.scheduledDate}` : ''}</span>
              <span className="text-6xl font-black tabular-nums leading-none mt-1">{formatMoney(ticket.amount)}</span>
            </button>
          ))}

          {showUsual && (
            <button
              type="button"
              onClick={() => onAmount(supplier.expectedPayment)}
              disabled={isSubmitting}
              className="h-32 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center disabled:opacity-70 disabled:cursor-wait"
            >
              <span className="text-2xl font-bold">Lo de siempre</span>
              <span className="text-6xl font-black tabular-nums leading-none mt-1">{formatMoney(supplier.expectedPayment)}</span>
            </button>
          )}

          {hasShortcuts && (
            <p className="text-center text-xl font-bold text-slate-500">
              <span className="landscape:lg:hidden">O escriba cuánto le pagó:</span>
              <span className="hidden landscape:lg:inline">O escriba cuánto le pagó en el teclado →</span>
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs p-4">
          {isSubmitting ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
              <p className="text-2xl font-bold text-slate-500">Guardando el pago…</p>
            </div>
          ) : (
            <NumericKeypad confirmLabel="Ya le pagué" onConfirm={(amount) => onAmount(amount)} />
          )}
        </section>
      </div>
    </SimpleOverlay>
  );
}
