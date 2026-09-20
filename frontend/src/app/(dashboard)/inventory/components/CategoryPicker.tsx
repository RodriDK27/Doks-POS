'use client';

import React from 'react';
import { ChevronDown, Layers, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Product, UNCATEGORIZED } from '../types';

interface CategoryPickerProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  /** Si existe, muestra el botón para agregar/gestionar categorías junto al selector */
  onManage?: () => void;
}

function Option({ label, count, selected, onClick }: { label: string; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer',
        selected
          ? 'bg-indigo-600 text-white'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
      )}
    >
      <span className="truncate">{label}</span>
      <span className={cn('text-[11px] font-extrabold tabular-nums shrink-0', selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>
        {count}
      </span>
    </button>
  );
}

/** Selector de categoría del card del catálogo: lista con buscador y el total de productos de cada una. */
export function CategoryPicker({ products, categories, selectedCategory, onSelect, onManage }: CategoryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Totales sobre TODOS los productos: no dependen del filtro activo
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const key = p.category || UNCATEGORIZED;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [products]);

  // Categorías registradas + cualquiera que exista solo en algún producto
  const names = React.useMemo(() => {
    const set = new Set<string>(categories);
    for (const p of products) if (p.category) set.add(p.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [categories, products]);

  const uncategorized = counts.get(UNCATEGORIZED) ?? 0;
  const q = query.trim().toLowerCase();
  const visibleNames = React.useMemo(
    () => (q ? names.filter((name) => name.toLowerCase().includes(q)) : names),
    [names, q]
  );

  React.useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const currentLabel =
    selectedCategory === '' ? 'Todas las categorías' : selectedCategory === UNCATEGORIZED ? 'Sin categoría' : selectedCategory;
  const currentCount = selectedCategory === '' ? products.length : (counts.get(selectedCategory) ?? 0);

  const choose = (category: string) => {
    onSelect(category);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="flex items-center gap-2">
      <div ref={containerRef} className="relative flex-1 min-w-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            // mismo fondo que el card que lo contiene
            'w-full h-12 flex items-center gap-2.5 px-3.5 rounded-xl border bg-white dark:bg-slate-900 text-left transition-all cursor-pointer',
            open
              ? 'border-indigo-400 ring-1 ring-indigo-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
              Categoría
            </span>
            <span className="block truncate text-sm font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
              {currentLabel}
            </span>
          </span>
          <span className="text-[11px] font-extrabold tabular-nums text-slate-400 dark:text-slate-500 shrink-0">{currentCount}</span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {names.length > 6 && (
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/60">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    autoFocus
                    placeholder="Buscar categoría..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div role="listbox" className="max-h-[min(55vh,380px)] overflow-y-auto p-2 space-y-0.5">
              {!q && <Option label="Todas las categorías" count={products.length} selected={selectedCategory === ''} onClick={() => choose('')} />}

              {visibleNames.map((name) => (
                <Option key={name} label={name} count={counts.get(name) ?? 0} selected={selectedCategory === name} onClick={() => choose(name)} />
              ))}

              {!q && uncategorized > 0 && (
                <Option label="Sin categoría" count={uncategorized} selected={selectedCategory === UNCATEGORIZED} onClick={() => choose(UNCATEGORIZED)} />
              )}

              {visibleNames.length === 0 && <p className="text-center text-[11px] text-slate-400 py-6">Sin coincidencias.</p>}
            </div>
          </div>
        )}
      </div>

      {onManage && (
        <button
          type="button"
          onClick={onManage}
          title="Agregar o gestionar categorías"
          aria-label="Agregar o gestionar categorías"
          className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
        >
          <Layers className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
