'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_SUGGESTIONS = 8;
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

interface CategoryCellProps {
  value: string;
  categories: string[];
  cellId: string;
  inputClassName: string;
  onChange: (value: string) => void;
  /** Navegación entre filas (Enter, ↑↓) cuando la lista está cerrada */
  onKeyNav: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

/**
 * Categoría con buscador: mientras se escribe aparecen las categorías que coinciden
 * (primero las que empiezan igual). Si no existe, ofrece crearla con lo escrito.
 * La lista se dibuja en un portal para que no la corte el scroll de la tabla.
 */
export function CategoryCell({ value, categories, cellId, inputClassName, onChange, onKeyNav, onPaste }: CategoryCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const query = normalize(value);
  const suggestions = useMemo(() => {
    if (!query) return categories.slice(0, MAX_SUGGESTIONS);
    const starts: string[] = [];
    const contains: string[] = [];
    for (const c of categories) {
      const n = normalize(c);
      if (n.startsWith(query)) starts.push(c);
      else if (n.includes(query)) contains.push(c);
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [categories, query]);

  const exactMatch = categories.some((c) => normalize(c) === query);
  const showCreate = !!query && !exactMatch;
  const options = showCreate ? [...suggestions, `__crear__${value.trim()}`] : suggestions;

  const openList = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setHighlight(0);
    setOpen(true);
  };

  // Al desplazar o al abrirse el teclado del celular, la lista sigue a la celda en lugar de cerrarse
  useEffect(() => {
    if (!open) return;
    const follow = () => {
      if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    };
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    window.visualViewport?.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
      window.visualViewport?.removeEventListener('resize', follow);
    };
  }, [open]);

  // Si no cabe debajo (p. ej. con el teclado del celular abierto), la lista se abre hacia arriba
  const LIST_MAX_HEIGHT = 288;
  const viewportHeight = typeof window === 'undefined' ? 0 : (window.visualViewport?.height ?? window.innerHeight);
  const openUp = !!rect && rect.bottom + 4 + LIST_MAX_HEIGHT > viewportHeight && rect.top > viewportHeight - rect.bottom;

  const choose = (option: string) => {
    onChange(option.startsWith('__crear__') ? option.slice('__crear__'.length) : option);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % options.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + options.length) % options.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (e.key === 'Enter') e.preventDefault();
        choose(options[Math.min(highlight, options.length - 1)]);
        return;
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    onKeyNav(e);
  };

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        data-cell={cellId}
        enterKeyHint="next"
        autoComplete="off"
        // Vacía: al entrar muestra todas. Con valor: la lista aparece al escribir (Enter sigue bajando de fila)
        onFocus={() => {
          if (!value.trim()) openList();
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) openList();
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={inputClassName}
      />
      {open &&
        rect &&
        options.length > 0 &&
        createPortal(
          <div
            className="fixed z-[70] max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1"
            style={{
              ...(openUp ? { top: rect.top - 4, transform: 'translateY(-100%)' } : { top: rect.bottom + 4 }),
              left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 224) - 8)),
              width: Math.max(rect.width, 224),
            }}
          >
            {options.map((option, i) => {
              const isCreate = option.startsWith('__crear__');
              return (
                <button
                  key={option}
                  type="button"
                  // mousedown en lugar de click: así el input no pierde el foco antes de elegir
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold cursor-pointer',
                    i === highlight ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200',
                    isCreate && 'border-t border-slate-100 dark:border-slate-800'
                  )}
                >
                  {isCreate ? <Plus className="h-3.5 w-3.5 shrink-0" /> : <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  <span className="truncate">{isCreate ? `Crear categoría: "${option.slice('__crear__'.length)}"` : option}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
