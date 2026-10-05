'use client';

import React from 'react';
import { ArrowLeft, LayoutGrid, Mic, Search, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleCategory } from '../helpers';
import { CategoryImage } from './CatalogGrid';

interface CatalogToolbarProps {
  /**
   * Categoría abierta: null mientras se ven los cuadros de categorías,
   * 'all' cuando tocó "Ver todo".
   */
  activeCategory: SimpleCategory | 'all' | null;
  onShowCategories: () => void;
  searchQuery: string;
  onClearSearch: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
  /** "Llegó el proveedor": registrar un pago que sale de la caja grande */
  onSupplierArrived: () => void;
  supplierDisabled: boolean;
}

/**
 * Barra del catálogo: buscar por voz (sin teclado de letras) y, dentro de una categoría,
 * un botón grande para regresar a los cuadros de categorías.
 */
export function CatalogToolbar({
  activeCategory,
  onShowCategories,
  searchQuery,
  onClearSearch,
  isListening,
  onToggleVoice,
  onSupplierArrived,
  supplierDisabled,
}: CatalogToolbarProps) {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 shrink-0">
      <div className="flex items-center gap-2">
        {isSearching ? (
          <div className="flex-1 min-w-0 h-14 flex items-center gap-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/40">
            <Search className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 truncate">&quot;{searchQuery}&quot;</span>
          </div>
        ) : activeCategory ? (
          // Dentro de una categoría: regresar a los cuadros y, junto, cuál está viendo
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <button
              type="button"
              onClick={onShowCategories}
              className="h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-lg font-extrabold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="h-6 w-6 stroke-[2.5]" /> Categorías
            </button>
            <div className="min-w-0 h-14 flex items-center gap-2.5 pl-1.5 pr-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/40">
              <div className="h-11 w-11 rounded-lg overflow-hidden bg-white shrink-0">
                {activeCategory === 'all' ? (
                  <div className="h-full w-full bg-indigo-600 text-white flex items-center justify-center">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                ) : (
                  <CategoryImage category={activeCategory} className="h-full w-full p-0!" />
                )}
              </div>
              <span className="text-xl font-black uppercase text-indigo-700 dark:text-indigo-300 truncate">
                {activeCategory === 'all' ? 'Todo' : activeCategory.name}
              </span>
            </div>
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
    </div>
  );
}
