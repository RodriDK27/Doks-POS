'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Keyboard, MoreHorizontal, Receipt, Truck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosMoreMenuProps {
  onPaySupplier: () => void;
  onOpenDailySuppliers: () => void;
  onOpenShortcuts: () => void;
}

/** Acciones secundarias del punto de venta agrupadas para que no compitan con el cobro */
export function PosMoreMenu({ onPaySupplier, onOpenDailySuppliers, onOpenShortcuts }: PosMoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const run = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  const itemClass =
    'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-left';

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Más</span>
      </Button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-[200] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={run(onPaySupplier)}>
            <Truck className="h-4 w-4 text-emerald-600" />
            <span className="flex-1">Pagar a proveedor</span>
            <kbd className="text-[9px] px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-black">F7</kbd>
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={run(onOpenDailySuppliers)}>
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="flex-1">Preventas y proveedores diarios</span>
          </button>
          <Link href="/tickets" role="menuitem" className={itemClass} onClick={() => setIsOpen(false)}>
            <Receipt className="h-4 w-4 text-slate-500" />
            <span className="flex-1">Historial de tickets</span>
          </Link>
          <button type="button" role="menuitem" className={itemClass} onClick={run(onOpenShortcuts)}>
            <Keyboard className="h-4 w-4 text-slate-500" />
            <span className="flex-1">Atajos de teclado</span>
          </button>
        </div>
      )}
    </div>
  );
}
