'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ImageIcon, Truck } from 'lucide-react';
import { formatMoney } from '../helpers';
import { ChangeNotice } from './Checkout';

export type ScanFlashState =
  | { kind: 'added'; name: string; price: number; imageSrc: string | null }
  | { kind: 'unknown'; code: string }
  // Venta ya guardada: solo queda dar el cambio
  | { kind: 'sold'; change: number; isOffline: boolean }
  | { kind: 'supplierPaid'; supplierName: string; amount: number };

/** Cuánto dura cada aviso antes de quitarse solo ("no registrado" espera una decisión) */
const FLASH_MS: Record<Exclude<ScanFlashState['kind'], 'unknown'>, number> = {
  added: 1800,
  supplierPaid: 2500,
  sold: 2500,
};
// Con cambio se queda más tiempo para contar los billetes; un toque o el siguiente producto lo quitan antes
const CHANGE_MS = 30000;

interface ScanFlashProps {
  flash: ScanFlashState;
  onClose: () => void;
  onChargeUnknown: (code: string) => void;
}

/**
 * Aviso grande que se quita solo: producto escaneado (la foto lo confirma sin tener que leer),
 * venta guardada con el cambio, o pago al proveedor guardado. Así no hay que acordarse de tocar "Listo".
 */
export function ScanFlash({ flash, onClose, onChargeUnknown }: ScanFlashProps) {
  useEffect(() => {
    if (flash.kind === 'unknown') return;
    const ms = flash.kind === 'sold' && flash.change > 0 ? CHANGE_MS : FLASH_MS[flash.kind];
    const timer = setTimeout(onClose, ms);
    return () => clearTimeout(timer);
  }, [flash, onClose]);

  if (flash.kind === 'sold') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-100 p-4"
        onClick={onClose}
      >
        <ChangeNotice change={flash.change} isOffline={flash.isOffline} />
      </div>
    );
  }

  if (flash.kind === 'supplierPaid') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div className="w-[min(90vw,560px)] rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl p-8 flex flex-col items-center gap-3 text-center">
          <Truck className="h-20 w-20 text-emerald-600 dark:text-emerald-400" />
          <p className="flex items-center gap-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" /> Pago guardado
          </p>
          <p className="text-5xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{formatMoney(flash.amount)}</p>
          <p className="text-2xl font-bold text-slate-500">a {flash.supplierName}</p>
        </div>
      </div>
    );
  }

  if (flash.kind === 'added') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div className="w-[min(90vw,520px)] rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="h-56 w-56 rounded-3xl bg-white flex items-center justify-center overflow-hidden">
            {flash.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
              <img src={flash.imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-24 w-24 text-slate-300 dark:text-slate-600" />
            )}
          </div>
          <p className="flex items-center gap-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" /> Agregado
          </p>
          <p className="text-3xl font-black leading-tight text-slate-900 dark:text-slate-100">{flash.name}</p>
          <p className="text-5xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{formatMoney(flash.price)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-100">
      <div className="w-[min(92vw,600px)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xl p-8 flex flex-col items-center gap-5 text-center">
        <AlertTriangle className="h-20 w-20 text-amber-500" />
        <p className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight">Este producto no está registrado</p>
        <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">Puede cobrarlo poniendo el precio a mano</p>
        <div className="w-full grid grid-cols-2 gap-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-2xl font-extrabold cursor-pointer active:scale-95 transition-all"
          >
            No cobrar
          </button>
          <button
            type="button"
            onClick={() => onChargeUnknown(flash.code)}
            className="h-20 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-black shadow-md cursor-pointer active:scale-95 transition-all"
          >
            Poner precio
          </button>
        </div>
      </div>
    </div>
  );
}
