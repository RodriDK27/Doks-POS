'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ImageIcon, Undo2 } from 'lucide-react';
import { formatMoney } from '../helpers';

export type ScanFlashState =
  | { kind: 'added'; name: string; price: number; imageSrc: string | null }
  | { kind: 'unknown'; code: string };

interface ScanFlashProps {
  flash: ScanFlashState;
  onClose: () => void;
  onChargeUnknown: (code: string) => void;
}

/** Aviso grande después de escanear: la foto confirma el producto sin tener que leer */
export function ScanFlash({ flash, onClose, onChargeUnknown }: ScanFlashProps) {
  // El aviso de "agregado" se quita solo; el de "no registrado" espera una decisión
  useEffect(() => {
    if (flash.kind !== 'added') return;
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [flash, onClose]);

  if (flash.kind === 'added') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div className="w-[min(90vw,520px)] rounded-[2.5rem] bg-white border-4 border-emerald-500 shadow-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="h-56 w-56 rounded-3xl bg-white flex items-center justify-center overflow-hidden">
            {flash.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
              <img src={flash.imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-24 w-24 text-stone-300" />
            )}
          </div>
          <p className="flex items-center gap-2 text-2xl font-black text-emerald-700">
            <CheckCircle2 className="h-8 w-8" /> Agregado
          </p>
          <p className="text-3xl font-black leading-tight text-stone-900">{flash.name}</p>
          <p className="text-5xl font-black text-emerald-700 tabular-nums">{formatMoney(flash.price)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-100">
      <div className="w-[min(92vw,600px)] rounded-[2.5rem] bg-white border-4 border-amber-400 shadow-2xl p-8 flex flex-col items-center gap-5 text-center">
        <AlertTriangle className="h-20 w-20 text-amber-500" />
        <p className="text-4xl font-black text-stone-900 leading-tight">Este producto no está registrado</p>
        <p className="text-2xl font-bold text-stone-600">Puede cobrarlo poniendo el precio a mano</p>
        <div className="w-full grid grid-cols-2 gap-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-24 rounded-3xl bg-stone-200 active:bg-stone-300 text-stone-800 text-3xl font-black cursor-pointer"
          >
            No cobrar
          </button>
          <button
            type="button"
            onClick={() => onChargeUnknown(flash.code)}
            className="h-24 rounded-3xl bg-emerald-600 active:bg-emerald-700 text-white text-3xl font-black cursor-pointer"
          >
            Poner precio
          </button>
        </div>
      </div>
    </div>
  );
}

interface UndoBarProps {
  message: string;
  onUndo: () => void;
}

/** "Deshacer" en lugar de "¿Está seguro?": quitar algo es inmediato y se puede revertir */
export function UndoBar({ message, onUndo }: UndoBarProps) {
  return (
    <div className="fixed bottom-6 left-6 z-30 flex items-center gap-4 rounded-3xl bg-stone-900 text-white shadow-2xl pl-6 pr-3 py-3 animate-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-460px)]">
      <span className="text-2xl font-bold truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="h-16 px-6 rounded-2xl bg-amber-400 active:bg-amber-500 text-stone-900 text-2xl font-black flex items-center gap-2 cursor-pointer shrink-0"
      >
        <Undo2 className="h-7 w-7 stroke-[3]" /> Deshacer
      </button>
    </div>
  );
}
