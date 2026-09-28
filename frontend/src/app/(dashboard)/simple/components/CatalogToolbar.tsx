'use client';

import React from 'react';
import { Mic, Search, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_CATEGORIES } from '../helpers';

interface CatalogToolbarProps {
  categories: Array<{ name: string; count: number }>;
  totalCount: number;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
  /** "Llegó el proveedor": registrar un pago que sale de la caja grande */
  onSupplierArrived: () => void;
  supplierDisabled: boolean;
}

/**
 * Barra del catálogo: buscar por voz (sin teclado de letras) y pestañas de categoría de un toque.
 * Mismo estilo que la barra de búsqueda y los chips de categoría del punto de venta, en grande.
 */
export function CatalogToolbar({
  categories,
  totalCount,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onClearSearch,
  isListening,
  onToggleVoice,
  onSupplierArrived,
  supplierDisabled,
}: CatalogToolbarProps) {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 shrink-0 space-y-3">
      <div className="flex items-center gap-2">
        {isSearching ? (
          <div className="flex-1 min-w-0 h-14 flex items-center gap-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/40">
            <Search className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 truncate">&quot;{searchQuery}&quot;</span>
          </div>
        ) : (
          // Sin texto de ayuda: los botones se explican solos y así caben en cualquier tamaño de tableta
          <div className="flex-1" />
        )}

        {isSearching && (
          <button
            type="button"
            onClick={onClearSearch}
            className="h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-lg font-extrabold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <X className="h-6 w-6" /> Ver todo
          </button>
        )}

        {/* Mismo estilo que "Pagar Proveedor" del punto de venta; se esconde mientras se busca un producto */}
        {!isSearching && (
          <button
            type="button"
            disabled={supplierDisabled}
            onClick={onSupplierArrived}
            className="h-14 px-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-lg font-black flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Truck className="h-6 w-6" /> Llegó el proveedor
          </button>
        )}

        <button
          type="button"
          onClick={onToggleVoice}
          className={cn(
            'h-14 px-5 rounded-xl flex items-center justify-center gap-2 text-lg font-black whitespace-nowrap cursor-pointer active:scale-95 transition-all shrink-0 shadow-xs',
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          )}
        >
          <Mic className="h-6 w-6" />
          {isListening ? 'Escuchando…' : 'Buscar por voz'}
        </button>
      </div>

      {/* Pestañas de categoría: se esconden mientras hay una búsqueda por voz, que busca en todo */}
      {!isSearching && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[{ name: ALL_CATEGORIES, count: totalCount }, ...categories].map((category) => {
            const isActive = category.name === activeCategory;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => onCategoryChange(category.name)}
                className={cn(
                  'h-12 px-4 rounded-xl text-base font-black uppercase tracking-wide whitespace-nowrap border shrink-0 flex items-center gap-2 cursor-pointer active:scale-95 transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {category.name === ALL_CATEGORIES ? 'Todos' : category.name}
                <span
                  className={cn(
                    'text-sm px-2 py-0.5 rounded-full font-extrabold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
