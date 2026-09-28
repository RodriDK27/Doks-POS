'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ImageIcon, Loader2, Plus, RotateCcw, Save, Search, Table2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductImageSrc } from '@/lib/productImages';
import { useAuthStore } from '@/store/useAuthStore';
import {
  EDITABLE_COLUMNS,
  EditableColumn,
  EditorRow,
  RowStatus,
  rowStatus,
  useAdvancedEditor,
} from './useAdvancedEditor';
import { CategoryCell } from './CategoryCell';

/** Alto fijo de cada fila: permite dibujar solo las filas visibles (miles de productos sin trabarse) */
const ROW_HEIGHT = 44;
const OVERSCAN = 12;

const GRID_TEMPLATE =
  '3rem 3.25rem minmax(15rem,2.2fr) 7.5rem minmax(9rem,1fr) 7rem 7rem 7rem 6.5rem minmax(9rem,1fr) 2.75rem';

const COLUMN_LABELS: Record<EditableColumn, string> = {
  name: 'Nombre',
  unitType: 'Tipo',
  barcode: 'Código de barras',
  purchasePrice: 'P. compra',
  sellPrice: 'P. venta',
  stock: 'Stock',
  category: 'Categoría',
};

type StatusFilter = 'all' | 'changed' | 'errors';
type TypeFilter = 'all' | 'PIECE' | 'WEIGHT';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Celdas ───

const cellInput =
  'h-full w-full bg-transparent px-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-none';

function ImageCell({ row, onPick }: { row: EditorRow; onPick: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (row.imageFile ? URL.createObjectURL(row.imageFile) : null), [row.imageFile]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  const src = previewUrl ?? getProductImageSrc(row.imageUrl);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={src ? 'Cambiar imagen' : 'Agregar imagen'}
        className={cn(
          'm-1 h-9 w-9 rounded-lg border overflow-hidden flex items-center justify-center bg-white cursor-pointer hover:ring-2 hover:ring-indigo-400',
          row.imageFile ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend o es una vista previa local
          <img src={src} alt="" crossOrigin={previewUrl ? undefined : 'anonymous'} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-4 w-4 text-slate-300" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
    </>
  );
}

interface RowViewProps {
  row: EditorRow;
  visibleIndex: number;
  status: RowStatus;
  errors?: Partial<Record<EditableColumn, string>>;
  onChange: (key: string, column: EditableColumn, value: string) => void;
  onImage: (key: string, file: File) => void;
  onRemove: (key: string) => void;
  onKeyNav: (e: React.KeyboardEvent<HTMLElement>, visibleIndex: number, column: EditableColumn) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>, key: string, column: EditableColumn) => void;
  categories: string[];
}

const RowView = memo(function RowView({ row, visibleIndex, status, errors, onChange, onImage, onRemove, onKeyNav, onPaste, categories }: RowViewProps) {
  const hasErrors = !!errors || !!row.serverError;
  const buy = Number(row.purchasePrice) || 0;
  const sell = Number(row.sellPrice) || 0;
  const profit = sell - buy;
  const margin = sell > 0 ? (profit / sell) * 100 : 0;

  const cellClass = (column: EditableColumn) =>
    cn('h-full border-r border-slate-100 dark:border-slate-800', errors?.[column] && 'bg-rose-100/70 dark:bg-rose-950/40');

  const textCell = (column: Exclude<EditableColumn, 'unitType' | 'category'>, opts: { numeric?: boolean } = {}) => (
    <div className={cellClass(column)} title={errors?.[column]}>
      <input
        value={row[column]}
        inputMode={opts.numeric ? 'decimal' : undefined}
        data-cell={`${visibleIndex}:${column}`}
        onChange={(e) => onChange(row.key, column, e.target.value)}
        onKeyDown={(e) => onKeyNav(e, visibleIndex, column)}
        onPaste={(e) => onPaste(e, row.key, column)}
        className={cn(cellInput, opts.numeric && 'text-right tabular-nums')}
      />
    </div>
  );

  return (
    <div
      className={cn(
        'grid h-full items-stretch border-b border-slate-100 dark:border-slate-800 text-xs',
        hasErrors
          ? 'bg-rose-50/60 dark:bg-rose-950/20'
          : status === 'new'
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
            : status === 'dirty'
              ? 'bg-amber-50/60 dark:bg-amber-950/20'
              : 'bg-white dark:bg-slate-900'
      )}
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
      title={row.serverError}
    >
      <div className="h-full flex items-center justify-center gap-1 border-r border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            hasErrors ? 'bg-rose-500' : status === 'new' ? 'bg-emerald-500' : status === 'dirty' ? 'bg-amber-500' : 'bg-transparent'
          )}
        />
        {visibleIndex + 1}
      </div>
      <div className="h-full flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
        <ImageCell row={row} onPick={(file) => onImage(row.key, file)} />
      </div>
      {textCell('name')}
      <div className={cellClass('unitType')}>
        <select
          value={row.unitType}
          data-cell={`${visibleIndex}:unitType`}
          onChange={(e) => onChange(row.key, 'unitType', e.target.value)}
          onKeyDown={(e) => onKeyNav(e, visibleIndex, 'unitType')}
          className={cn(cellInput, 'cursor-pointer')}
        >
          <option value="PIECE">Pieza</option>
          <option value="WEIGHT">Granel (kg)</option>
        </select>
      </div>
      {textCell('barcode')}
      {textCell('purchasePrice', { numeric: true })}
      {textCell('sellPrice', { numeric: true })}
      <div
        className={cn(
          'h-full flex flex-col items-end justify-center px-2 border-r border-slate-100 dark:border-slate-800 tabular-nums leading-tight',
          profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
        )}
      >
        <span className="font-black">{money(profit)}</span>
        <span className="text-[10px] font-bold opacity-80">{sell > 0 ? `${margin.toFixed(0)}%` : '—'}</span>
      </div>
      {textCell('stock', { numeric: true })}
      <div className={cellClass('category')} title={errors?.category}>
        <CategoryCell
          value={row.category}
          categories={categories}
          cellId={`${visibleIndex}:category`}
          inputClassName={cellInput}
          onChange={(value) => onChange(row.key, 'category', value)}
          onKeyNav={(e) => onKeyNav(e, visibleIndex, 'category')}
          onPaste={(e) => onPaste(e, row.key, 'category')}
        />
      </div>
      <div className="h-full flex items-center justify-center">
        {!row.id && (
          <button
            type="button"
            onClick={() => onRemove(row.key)}
            title="Quitar fila nueva"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});

// ─── Página ───

/**
 * Editor avanzado de inventario: tabla tipo Excel para crear y editar muchos artículos a la vez.
 * Solo se guardan las filas que cambiaron, en tandas, con el guardado por lotes del backend (/products/bulk).
 */
export default function AdvancedInventoryEditorPage() {
  const role = useAuthStore((s) => s.role);
  const canManage = role === 'ADMIN' || role === 'GERENTE';
  const editor = useAdvancedEditor();
  const { rows, errorsByKey, pendingRows, progress } = editor;

  // ─── Filtros ───
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('__all');
  const [type, setType] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visibleRows = useMemo(() => {
    const q = normalize(search.trim());
    return rows.filter((row) => {
      const status = rowStatus(row);
      const hasErrors = errorsByKey.has(row.key) || !!row.serverError;
      if (statusFilter === 'changed' && status === 'clean') return false;
      if (statusFilter === 'errors' && !hasErrors) return false;
      // Las filas nuevas siempre se ven, aunque no coincidan con los filtros, para no "perderlas" mientras se llenan
      if (status === 'new') return true;
      if (type !== 'all' && row.unitType !== type) return false;
      if (category === '__none' && row.category.trim()) return false;
      if (category !== '__all' && category !== '__none' && row.category.trim() !== category) return false;
      if (q && !normalize(`${row.name} ${row.barcode} ${row.category}`).includes(q)) return false;
      return true;
    });
  }, [rows, search, category, type, statusFilter, errorsByKey]);

  const visibleKeys = useMemo(() => visibleRows.map((r) => r.key), [visibleRows]);
  const errorCount = useMemo(
    () => rows.filter((r) => errorsByKey.has(r.key) || !!r.serverError).length,
    [rows, errorsByKey]
  );

  // ─── Scroll virtual ───
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(visibleRows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);

  /** Enfoca una celda aunque su fila no esté dibujada todavía: primero la desplaza a la vista */
  const focusCell = useCallback((visibleIndex: number, column: EditableColumn) => {
    const el = scrollRef.current;
    if (!el || visibleIndex < 0) return;
    const top = visibleIndex * ROW_HEIGHT;
    const headerHeight = 40;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + ROW_HEIGHT > el.scrollTop + el.clientHeight - headerHeight) {
      el.scrollTop = top + ROW_HEIGHT - el.clientHeight + headerHeight;
    }
    requestAnimationFrame(() => {
      const input = el.querySelector<HTMLElement>(`[data-cell="${visibleIndex}:${column}"]`);
      input?.focus();
      if (input instanceof HTMLInputElement) input.select();
    });
  }, []);

  // Enter y flechas ↑↓ se mueven entre filas en la misma columna, como en Excel
  const onKeyNav = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, visibleIndex: number, column: EditableColumn) => {
      const isSelect = e.currentTarget.tagName === 'SELECT';
      if (e.key === 'Enter' || (e.key === 'ArrowDown' && !isSelect)) {
        e.preventDefault();
        focusCell(e.shiftKey && e.key === 'Enter' ? visibleIndex - 1 : Math.min(visibleIndex + 1, visibleKeys.length - 1), column);
      } else if (e.key === 'ArrowUp' && !isSelect) {
        e.preventDefault();
        focusCell(visibleIndex - 1, column);
      }
    },
    [focusCell, visibleKeys.length]
  );

  // Pegar desde Excel: si trae varias celdas, se reparte en la tabla; si es un solo valor, se pega normal
  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, key: string, column: EditableColumn) => {
      const text = e.clipboardData.getData('text');
      if (!text.includes('\t') && !text.replace(/\r?\n$/, '').includes('\n')) return;
      e.preventDefault();
      editor.pasteBlock(key, column, text, visibleKeys);
      const lineCount = text.replace(/\r/g, '').split('\n').filter(Boolean).length;
      toast.success(`Se pegaron ${lineCount} fila(s)`);
    },
    [editor, visibleKeys]
  );

  const addRows = (count: number) => {
    editor.addRows(count);
    setStatusFilter('all');
    requestAnimationFrame(() => focusCell(0, 'name'));
  };

  // ─── Guardar ───
  const handleSave = async () => {
    const withErrors = pendingRows.filter((r) => errorsByKey.has(r.key)).length;
    const result = await editor.save();
    if (result.error) toast.error(result.error);
    if (result.ok) toast.success(`Se guardaron ${result.ok} producto(s)`);
    if (result.failed) toast.error(`${result.failed} producto(s) no se guardaron. Revisa las filas en rojo.`);
    if (withErrors) toast.warning(`${withErrors} fila(s) con errores no se enviaron. Corrígelas y vuelve a guardar.`);
    if (result.failed || withErrors) setStatusFilter('errors');
  };

  const handleDiscard = () => {
    if (window.confirm(`¿Descartar ${pendingRows.length} cambio(s) sin guardar?`)) editor.discardChanges();
  };

  // Aviso del navegador si se intenta salir con cambios sin guardar
  useEffect(() => {
    if (pendingRows.length === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pendingRows.length]);

  if (!canManage) {
    return (
      <div className="p-6 text-sm font-semibold text-slate-500">
        Ingresa como administrador o gerente para usar el editor avanzado.
      </div>
    );
  }

  const isSaving = progress !== null;
  const selectClass =
    'h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer';

  return (
    <div className="flex flex-col gap-3 w-full h-[calc(100dvh-9rem)] min-h-[480px]">
      {/* ENCABEZADO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/inventory"
            onClick={(e) => {
              if (pendingRows.length && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) e.preventDefault();
            }}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
            title="Volver a inventario"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Table2 className="h-3 w-3" /> Inventario
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Editor avanzado</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addRows(1)}
            disabled={isSaving}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Nuevo artículo
          </button>
          <button
            type="button"
            onClick={() => addRows(10)}
            disabled={isSaving}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 10 artículos
          </button>
          {pendingRows.length > 0 && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="h-10 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Descartar
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={pendingRows.length === 0 || isSaving}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving
              ? `${progress.stage === 'fotos' ? 'Subiendo fotos' : 'Guardando'} ${progress.done} de ${progress.total}`
              : `Guardar${pendingRows.length ? ` (${pendingRows.length})` : ''}`}
          </button>
        </div>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o categoría…"
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="__all">Todas las categorías</option>
          <option value="__none">Sin categoría</option>
          {editor.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className={selectClass}>
          <option value="all">Todos los tipos</option>
          <option value="PIECE">Pieza</option>
          <option value="WEIGHT">Granel</option>
        </select>
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
          {(
            [
              ['all', 'Todos'],
              ['changed', `Con cambios${pendingRows.length ? ` · ${pendingRows.length}` : ''}`],
              ['errors', `Con errores${errorCount ? ` · ${errorCount}` : ''}`],
            ] as Array<[StatusFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-black cursor-pointer whitespace-nowrap',
                statusFilter === value
                  ? value === 'errors'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {editor.isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div ref={scrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} className="h-full overflow-auto">
            <div className="min-w-[78rem]">
              <div
                className="grid sticky top-0 z-10 h-10 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <span className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800">#</span>
                <span className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800">Img</span>
                {(['name', 'unitType', 'barcode', 'purchasePrice', 'sellPrice'] as EditableColumn[]).map((col) => (
                  <span key={col} className="flex items-center px-2 border-r border-slate-200 dark:border-slate-800">
                    {COLUMN_LABELS[col]}
                  </span>
                ))}
                <span className="flex items-center justify-end px-2 border-r border-slate-200 dark:border-slate-800">Ganancia</span>
                {(['stock', 'category'] as EditableColumn[]).map((col) => (
                  <span key={col} className="flex items-center px-2 border-r border-slate-200 dark:border-slate-800">
                    {COLUMN_LABELS[col]}
                  </span>
                ))}
                <span />
              </div>

              {visibleRows.length === 0 ? (
                <p className="p-10 text-center text-sm font-bold text-slate-400">
                  {rows.length === 0 ? 'No hay productos. Usa "+ Nuevo artículo" para agregar.' : 'Ningún producto coincide con la búsqueda.'}
                </p>
              ) : (
                <div className="relative" style={{ height: visibleRows.length * ROW_HEIGHT }}>
                  {visibleRows.slice(first, last).map((row, i) => {
                    const visibleIndex = first + i;
                    return (
                      <div key={row.key} className="absolute inset-x-0" style={{ top: visibleIndex * ROW_HEIGHT, height: ROW_HEIGHT }}>
                        <RowView
                          row={row}
                          visibleIndex={visibleIndex}
                          status={rowStatus(row)}
                          errors={errorsByKey.get(row.key)}
                          onChange={editor.updateCell}
                          onImage={editor.setRowImage}
                          onRemove={editor.removeRow}
                          onKeyNav={onKeyNav}
                          onPaste={onPaste}
                          categories={editor.categories}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      <p className="text-[11px] font-semibold text-slate-400">
        {visibleRows.length} de {rows.length} productos · Enter o ↑↓ para moverte entre filas · Puedes pegar varias celdas
        copiadas de Excel (columnas en este orden: {EDITABLE_COLUMNS.map((c) => COLUMN_LABELS[c]).join(', ')})
      </p>
    </div>
  );
}
