'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Copy, Heart, ImageIcon, Layers, Loader2, Plus, RotateCcw, Save, Search, SlidersHorizontal, Table2, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductImageSrc } from '@/lib/productImages';
import { useAuthStore } from '@/store/useAuthStore';
import {
  EDITABLE_COLUMNS,
  EditableColumn,
  EditorRow,
  RowStatus,
  parseCodes,
  rowStatus,
  useAdvancedEditor,
} from './hooks/useAdvancedEditor';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { CategoryCell } from './components/CategoryCell';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { QuickRestockDialog } from './components/QuickRestockDialog';

/** Alto fijo de cada fila: permite dibujar solo las filas visibles (miles de productos sin trabarse) */
const ROW_HEIGHT = 44;
/** En celular o tablet vertical las filas son más altas para tocarlas con el dedo */
const COMPACT_ROW_HEIGHT = 48;
const OVERSCAN = 12;

/** Menos de 1024px de ancho (celular o tablet en vertical): se usa la hoja compacta */
const COMPACT_QUERY = '(max-width: 1023px)';
const subscribeCompact = (onChange: () => void) => {
  const mq = window.matchMedia(COMPACT_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
function useIsCompact() {
  return useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false
  );
}

const GRID_TEMPLATE =
  '2.5rem 3rem 3.25rem minmax(15rem,2.2fr) 7.5rem minmax(9rem,1fr) 7rem 7rem 7rem 6.5rem minmax(9rem,1fr) minmax(10rem,1fr) 4.5rem';

const COLUMN_LABELS: Record<EditableColumn, string> = {
  name: 'Nombre',
  unitType: 'Tipo',
  barcode: 'Código de barras',
  purchasePrice: 'P. compra',
  sellPrice: 'P. venta',
  stock: 'Stock',
  category: 'Categoría',
  extraBarcodes: 'Otros códigos',
};

/** Fondo de la fila según su estado; la columna fija de la hoja compacta lo usa opaco */
function rowBackground(status: RowStatus, hasErrors: boolean, opaque = false) {
  if (status === 'deleted') return opaque ? 'bg-rose-100 dark:bg-rose-950' : 'bg-rose-100/70 dark:bg-rose-950/40';
  if (hasErrors) return opaque ? 'bg-rose-50 dark:bg-rose-950' : 'bg-rose-50/60 dark:bg-rose-950/20';
  if (status === 'new') return opaque ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-emerald-50/60 dark:bg-emerald-950/20';
  if (status === 'dirty') return opaque ? 'bg-amber-50 dark:bg-amber-950' : 'bg-amber-50/60 dark:bg-amber-950/20';
  return 'bg-white dark:bg-slate-900';
}

/** Producto marcado para borrar: tachado y sin poder editarse hasta que se desmarque */
const DELETED_ROW = '[&_input]:line-through [&_input]:opacity-60 [&_select]:opacity-60 [&_input]:pointer-events-none [&_select]:pointer-events-none';

/** Botón de quitar: fila nueva se quita al momento; producto guardado se marca para borrarse al guardar */
function RemoveButton({ row, onRemove, className, iconClassName }: { row: EditorRow; onRemove: (key: string) => void; className: string; iconClassName: string }) {
  const label = !row.id ? 'Quitar fila nueva' : row.toDelete ? 'No borrar este producto' : 'Borrar producto (se borra al guardar)';
  return (
    <button
      type="button"
      onClick={() => onRemove(row.key)}
      title={label}
      aria-label={label}
      className={cn(
        'rounded-lg flex items-center justify-center cursor-pointer',
        row.toDelete
          ? 'text-rose-600 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900'
          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40',
        className
      )}
    >
      {row.toDelete ? <RotateCcw className={iconClassName} /> : <Trash2 className={iconClassName} />}
    </button>
  );
}

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

/** Corazón de favoritos; las filas nuevas lo tienen apagado hasta guardarse */
function FavoriteButton({ row, onToggle, className }: { row: EditorRow; onToggle: (key: string) => void; className?: string }) {
  const label = !row.id ? 'Guarda el producto para marcarlo como favorito' : row.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
  return (
    <button
      type="button"
      onClick={() => onToggle(row.key)}
      disabled={!row.id}
      title={label}
      aria-label={label}
      aria-pressed={!!row.isFavorite}
      className={cn(
        'rounded-lg flex items-center justify-center cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', row.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-600')} />
    </button>
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
  onDuplicate: (key: string) => void;
  onToggleFavorite: (key: string) => void;
  onKeyNav: (e: React.KeyboardEvent<HTMLElement>, visibleIndex: number, column: EditableColumn) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>, key: string, column: EditableColumn) => void;
  categories: string[];
}

const RowView = memo(function RowView({ row, visibleIndex, status, errors, onChange, onImage, onRemove, onDuplicate, onToggleFavorite, onKeyNav, onPaste, categories }: RowViewProps) {
  const hasErrors = !!errors || !!row.serverError;
  const buy = Number(row.purchasePrice) || 0;
  const sell = Number(row.sellPrice) || 0;
  const profit = sell - buy;
  const margin = sell > 0 ? (profit / sell) * 100 : 0;

  const cellClass = (column: EditableColumn) =>
    cn('h-full border-r border-slate-100 dark:border-slate-800', errors?.[column] && 'bg-rose-100/70 dark:bg-rose-950/40');

  const textCell = (column: Exclude<EditableColumn, 'unitType' | 'category'>, opts: { numeric?: boolean; placeholder?: string } = {}) => (
    <div className={cellClass(column)} title={errors?.[column]}>
      <input
        value={row[column]}
        inputMode={opts.numeric ? 'decimal' : undefined}
        placeholder={opts.placeholder}
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
        rowBackground(status, hasErrors),
        status === 'deleted' && DELETED_ROW
      )}
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
      title={row.serverError ?? (status === 'deleted' ? 'Se borrará al guardar' : undefined)}
    >
      <div className="h-full flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
        <FavoriteButton row={row} onToggle={onToggleFavorite} className="h-8 w-8" />
      </div>
      <div className="h-full flex items-center justify-center gap-1 border-r border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            hasErrors || status === 'deleted' ? 'bg-rose-500' : status === 'new' ? 'bg-emerald-500' : status === 'dirty' ? 'bg-amber-500' : 'bg-transparent'
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
      {textCell('extraBarcodes', { placeholder: 'Escanea o escribe…' })}
      <div className="h-full flex items-center justify-center gap-0.5">
        <button
          type="button"
          onClick={() => onDuplicate(row.key)}
          title="Duplicar fila (Ctrl+D): copia nombre, precios, tipo y categoría"
          aria-label="Duplicar fila"
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <RemoveButton row={row} onRemove={onRemove} className="h-7 w-7" iconClassName="h-3.5 w-3.5" />
      </div>
    </div>
  );
});

/**
 * Hoja tipo Excel para celular o tablet vertical: el nombre se queda fijo a la izquierda y el resto de
 * columnas se desliza de lado. Van primero las que más se editan desde el celular (precio y stock).
 */
const COMPACT_GRID_TEMPLATE = '11rem 5.25rem 5.25rem 5rem 4.5rem 5.75rem 8.5rem 8.5rem 10rem 2.75rem 4.75rem';
const COMPACT_HEADERS = ['Nombre', 'P. venta', 'P. compra', 'Ganancia', 'Stock', 'Tipo', 'Código', 'Categoría', 'Otros códigos', 'Img', ''];

const compactInput =
  'h-full w-full bg-transparent px-2 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-none';

function CompactHeader() {
  return (
    <div
      className="grid sticky top-0 z-20 h-10 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500"
      style={{ gridTemplateColumns: COMPACT_GRID_TEMPLATE }}
    >
      {COMPACT_HEADERS.map((label, i) => (
        <span
          key={i}
          className={cn(
            'flex items-center px-2 border-r border-slate-200 dark:border-slate-800',
            i === 0 && 'sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 border-r-2',
            label === 'Ganancia' && 'justify-end',
            label === 'Img' && 'justify-center px-0'
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

const CompactRowView = memo(function CompactRowView({ row, visibleIndex, status, errors, onChange, onImage, onRemove, onDuplicate, onToggleFavorite, onKeyNav, onPaste, categories }: RowViewProps) {
  const hasErrors = !!errors || !!row.serverError;
  const buy = Number(row.purchasePrice) || 0;
  const sell = Number(row.sellPrice) || 0;
  const profit = sell - buy;
  const margin = sell > 0 ? (profit / sell) * 100 : 0;

  const cellClass = (column: EditableColumn) =>
    cn('h-full border-r border-slate-100 dark:border-slate-800', errors?.[column] && 'bg-rose-100/70 dark:bg-rose-950/40');

  const textCell = (column: Exclude<EditableColumn, 'unitType' | 'category'>, opts: { numeric?: boolean; placeholder?: string } = {}) => (
    <input
      value={row[column]}
      inputMode={opts.numeric ? 'decimal' : undefined}
      placeholder={opts.placeholder}
      enterKeyHint="next"
      data-cell={`${visibleIndex}:${column}`}
      onChange={(e) => onChange(row.key, column, e.target.value)}
      onKeyDown={(e) => onKeyNav(e, visibleIndex, column)}
      onPaste={(e) => onPaste(e, row.key, column)}
      className={cn(compactInput, opts.numeric && 'text-right tabular-nums')}
    />
  );

  return (
    <div
      className={cn(
        'grid h-full items-stretch border-b border-slate-100 dark:border-slate-800',
        rowBackground(status, hasErrors),
        status === 'deleted' && DELETED_ROW
      )}
      style={{ gridTemplateColumns: COMPACT_GRID_TEMPLATE }}
      title={row.serverError ?? (status === 'deleted' ? 'Se borrará al guardar' : undefined)}
    >
      {/* Columna fija: fondo opaco para que no se transparenten las columnas que pasan por debajo */}
      <div
        className={cn(
          'sticky left-0 z-10 h-full border-r-2 border-slate-200 dark:border-slate-700',
          rowBackground(status, hasErrors, true)
        )}
        title={errors?.name}
      >
        <span
          className={cn(
            'absolute inset-y-0 left-0 w-1',
            hasErrors || status === 'deleted' ? 'bg-rose-500' : status === 'new' ? 'bg-emerald-500' : status === 'dirty' ? 'bg-amber-500' : 'bg-transparent'
          )}
        />
        <div className="h-full flex items-center">
          <div className="min-w-0 flex-1 h-full">{textCell('name')}</div>
          <FavoriteButton row={row} onToggle={onToggleFavorite} className="h-8 w-8 shrink-0 mr-0.5" />
        </div>
      </div>
      <div className={cellClass('sellPrice')} title={errors?.sellPrice}>
        {textCell('sellPrice', { numeric: true })}
      </div>
      <div className={cellClass('purchasePrice')} title={errors?.purchasePrice}>
        {textCell('purchasePrice', { numeric: true })}
      </div>
      <div
        className={cn(
          'h-full flex flex-col items-end justify-center px-2 border-r border-slate-100 dark:border-slate-800 tabular-nums leading-tight text-xs',
          profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
        )}
      >
        <span className="font-black">{money(profit)}</span>
        <span className="text-[10px] font-bold opacity-80">{sell > 0 ? `${margin.toFixed(0)}%` : '—'}</span>
      </div>
      <div className={cellClass('stock')} title={errors?.stock}>
        {textCell('stock', { numeric: true })}
      </div>
      <div className={cellClass('unitType')}>
        <select
          value={row.unitType}
          data-cell={`${visibleIndex}:unitType`}
          onChange={(e) => onChange(row.key, 'unitType', e.target.value)}
          className={cn(compactInput, 'cursor-pointer')}
        >
          <option value="PIECE">Pieza</option>
          <option value="WEIGHT">Granel</option>
        </select>
      </div>
      <div className={cellClass('barcode')} title={errors?.barcode}>
        {textCell('barcode')}
      </div>
      <div className={cellClass('category')} title={errors?.category}>
        <CategoryCell
          value={row.category}
          categories={categories}
          cellId={`${visibleIndex}:category`}
          inputClassName={compactInput}
          onChange={(value) => onChange(row.key, 'category', value)}
          onKeyNav={(e) => onKeyNav(e, visibleIndex, 'category')}
          onPaste={(e) => onPaste(e, row.key, 'category')}
        />
      </div>
      <div className={cellClass('extraBarcodes')} title={errors?.extraBarcodes}>
        {textCell('extraBarcodes', { placeholder: 'Escanea o escribe…' })}
      </div>
      <div className="h-full flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
        <ImageCell row={row} onPick={(file) => onImage(row.key, file)} />
      </div>
      <div className="h-full flex items-center justify-center gap-0.5">
        <button
          type="button"
          onClick={() => onDuplicate(row.key)}
          title="Duplicar fila"
          aria-label="Duplicar fila"
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center cursor-pointer"
        >
          <Copy className="h-4 w-4" />
        </button>
        <RemoveButton row={row} onRemove={onRemove} className="h-8 w-8" iconClassName="h-4 w-4" />
      </div>
    </div>
  );
});

// ─── Página ───

/**
 * Inventario: tabla tipo Excel para crear y editar muchos artículos a la vez.
 * Solo se guardan las filas que cambiaron, en tandas, con el guardado por lotes del backend (/products/bulk).
 */
export default function InventoryPage() {
  const role = useAuthStore((s) => s.role);
  const canManage = role === 'ADMIN' || role === 'GERENTE';
  const editor = useAdvancedEditor();
  const compact = useIsCompact();
  const itemHeight = compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT;
  const { rows, errorsByKey, pendingRows, progress } = editor;

  // ─── Filtros ───
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('__all');
  const [type, setType] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isQuickRestockOpen, setIsQuickRestockOpen] = useState(false);
  const activeFilterCount = (category !== '__all' ? 1 : 0) + (type !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const visibleRows = useMemo(() => {
    const q = normalize(search.trim());
    const matches = (values: NonNullable<EditorRow['original']>) => {
      if (type !== 'all' && values.unitType !== type) return false;
      if (category === '__none' && values.category.trim()) return false;
      if (category !== '__all' && category !== '__none' && values.category.trim() !== category) return false;
      if (q && !normalize(`${values.name} ${values.barcode} ${values.category} ${values.extraBarcodes}`).includes(q)) return false;
      return true;
    };
    return rows.filter((row) => {
      const status = rowStatus(row);
      const hasErrors = errorsByKey.has(row.key) || !!row.serverError;
      if (statusFilter === 'changed' && status === 'clean') return false;
      if (statusFilter === 'errors' && !hasErrors) return false;
      // Las filas nuevas siempre se ven, aunque no coincidan con los filtros, para no "perderlas" mientras se llenan
      if (status === 'new') return true;
      // Una fila editada se queda donde estaba (p. ej. al cambiarle la categoría) hasta que se guarde
      return matches(row) || (status !== 'clean' && !!row.original && matches(row.original));
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
    setViewportHeight(el.clientHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [editor.isLoading]);
  // Al cambiar entre la tabla y la hoja compacta la posición ya no corresponde: se vuelve al inicio
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [compact]);
  const first = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const last = Math.min(visibleRows.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + OVERSCAN);

  /** Enfoca una celda aunque su fila no esté dibujada todavía: primero la desplaza a la vista */
  const focusCell = useCallback((visibleIndex: number, column: EditableColumn) => {
    const el = scrollRef.current;
    if (!el || visibleIndex < 0) return;
    const top = visibleIndex * itemHeight;
    const headerHeight = 40;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + itemHeight > el.scrollTop + el.clientHeight - headerHeight) {
      el.scrollTop = top + itemHeight - el.clientHeight + headerHeight;
    }
    requestAnimationFrame(() => {
      const input = el.querySelector<HTMLElement>(`[data-cell="${visibleIndex}:${column}"]`);
      input?.focus();
      if (input instanceof HTMLInputElement) input.select();
    });
  }, [itemHeight]);

  // Al duplicar, el cursor queda al final del nombre de la copia para cambiar solo lo que varía
  const pendingFocusKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = pendingFocusKeyRef.current;
    if (!key) return;
    // Se intenta una sola vez: si la búsqueda actual oculta la copia, no se enfoca más tarde por sorpresa
    pendingFocusKeyRef.current = null;
    const index = visibleKeys.indexOf(key);
    if (index === -1) return;
    focusCell(index, 'name');
    requestAnimationFrame(() => {
      const input = scrollRef.current?.querySelector<HTMLInputElement>(`[data-cell="${index}:name"]`);
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }, [visibleKeys, focusCell]);

  const { duplicateRow } = editor;
  const handleDuplicate = useCallback(
    (key: string) => {
      const newKey = duplicateRow(key);
      if (!newKey) return;
      pendingFocusKeyRef.current = newKey;
      // Con el filtro de "con errores" la copia (fila nueva sin errores) no se vería
      setStatusFilter((prev) => (prev === 'errors' ? 'all' : prev));
      toast.success('Fila duplicada: cambia el nombre y pon su código de barras.', { id: 'inventory-duplicate' });
    },
    [duplicateRow]
  );

  // Enter y flechas ↑↓ se mueven entre filas en la misma columna, como en Excel; Ctrl+D duplica la fila
  const onKeyNav = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, visibleIndex: number, column: EditableColumn) => {
      const isSelect = e.currentTarget.tagName === 'SELECT';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const key = visibleKeys[visibleIndex];
        if (key) handleDuplicate(key);
        return;
      }
      if (e.key === 'Enter' || (e.key === 'ArrowDown' && !isSelect)) {
        e.preventDefault();
        focusCell(e.shiftKey && e.key === 'Enter' ? visibleIndex - 1 : Math.min(visibleIndex + 1, visibleKeys.length - 1), column);
      } else if (e.key === 'ArrowUp' && !isSelect) {
        e.preventDefault();
        focusCell(visibleIndex - 1, column);
      }
    },
    [focusCell, visibleKeys, handleDuplicate]
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

  // ─── Lector de código de barras: al escanear (sin tocar el buscador) aparece el producto ───
  const { addRows: addEditorRows, updateCell } = editor;

  const handleScan = useCallback(
    (code: string) => {
      const clean = code.trim().toLowerCase();
      // Si el foco quedó en una celda, al filtrar esa celda pasaría a ser de otro producto
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

      const row = rows.find(
        (r) =>
          r.barcode.trim().toLowerCase() === clean || parseCodes(r.extraBarcodes).some((c) => c.toLowerCase() === clean)
      );

      if (row) {
        // Quitar filtros que pudieran esconderlo
        setCategory('__all');
        setType('all');
        setStatusFilter('all');
        // La búsqueda también revisa los otros códigos
        setSearch(code.trim());
        return;
      }

      if (!canManage) {
        toast.error(`El código ${code} no está en el inventario.`);
        return;
      }
      toast.warning(`El código ${code} no está en el inventario.`, {
        id: 'inventory-scan-missing',
        duration: 8000,
        action: {
          label: 'Darlo de alta',
          onClick: () => {
            setSearch('');
            const key = addEditorRows(1);
            updateCell(key, 'barcode', code.trim());
            setStatusFilter('all');
            requestAnimationFrame(() => focusCell(0, 'name'));
          },
        },
      });
    },
    [rows, canManage, addEditorRows, updateCell, focusCell]
  );
  useBarcodeScanner(handleScan);

  // ─── Guardar ───
  const handleSave = async () => {
    const toDelete = pendingRows.filter((r) => r.toDelete);
    if (toDelete.length) {
      const names = toDelete.slice(0, 5).map((r) => `• ${r.name}`).join('\n');
      const more = toDelete.length > 5 ? `\n…y ${toDelete.length - 5} más` : '';
      if (!window.confirm(`Se borrarán definitivamente ${toDelete.length} producto(s):\n${names}${more}\n\n¿Continuar?`)) return;
    }
    const withErrors = pendingRows.filter((r) => errorsByKey.has(r.key)).length;
    const result = await editor.save();
    if (result.error) toast.error(result.error);
    if (result.ok) toast.success(`Se guardaron ${result.ok} producto(s)`);
    if (result.deleted) toast.success(`Se borraron ${result.deleted} producto(s)`);
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
        Ingresa como administrador o gerente para administrar el inventario.
      </div>
    );
  }

  const isSaving = progress !== null;
  const selectClass =
    'h-10 min-w-0 flex-1 lg:flex-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer';
  const outlineButton =
    'h-10 px-3 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 items-center gap-1.5 cursor-pointer disabled:opacity-50';

  return (
    <div className="flex flex-col gap-2 lg:gap-3 w-full h-[calc(100dvh-10.5rem)] sm:h-[calc(100dvh-11.5rem)] lg:h-[calc(100dvh-9rem)] min-h-[360px] lg:min-h-[480px]">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-2 lg:gap-3">
        <div className="min-w-0">
          <span className="hidden sm:flex text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest items-center gap-1.5">
            <Table2 className="h-3 w-3" /> Módulo Administrativo
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
            <span className="sm:hidden">Inventario</span>
            <span className="hidden sm:inline">Inventario de Tienda</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickRestockOpen(true)}
            disabled={isSaving}
            title="Agregado rápido: suma lo que llegó del proveedor"
            aria-label="Agregado rápido"
            className={cn(outlineButton, 'flex w-10 px-0 justify-center lg:w-auto lg:px-3 text-amber-600 dark:text-amber-400')}
          >
            <Zap className="h-4 w-4" />
            <span className="hidden lg:inline">Agregado rápido</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            title="Agregar o gestionar categorías"
            aria-label="Agregar o gestionar categorías"
            className={cn(outlineButton, 'flex w-10 px-0 justify-center lg:w-auto lg:px-3 text-indigo-600 dark:text-indigo-400')}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden lg:inline">Categorías</span>
          </button>
          <button type="button" onClick={() => addRows(1)} disabled={isSaving} className={cn(outlineButton, 'hidden lg:flex')}>
            <Plus className="h-4 w-4" /> Nuevo artículo
          </button>
          <button type="button" onClick={() => addRows(10)} disabled={isSaving} className={cn(outlineButton, 'hidden lg:flex')}>
            <Plus className="h-4 w-4" /> 10 artículos
          </button>
          {pendingRows.length > 0 && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              title="Descartar cambios"
              className="h-10 w-10 lg:w-auto lg:px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden lg:inline">Descartar</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={pendingRows.length === 0 || isSaving}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? (
              <span>
                <span className="hidden sm:inline">{progress.stage === 'fotos' ? 'Subiendo fotos' : progress.stage === 'borrando' ? 'Borrando' : 'Guardando'} </span>
                {progress.done}
                <span className="hidden sm:inline"> de </span>
                <span className="sm:hidden">/</span>
                {progress.total}
              </span>
            ) : (
              `Guardar${pendingRows.length ? ` (${pendingRows.length})` : ''}`
            )}
          </button>
        </div>
      </div>

      {/* BUSCADOR Y FILTROS (en pantallas angostas los filtros se abren con un botón) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 lg:min-w-[14rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            enterKeyHint="search"
            placeholder="Buscar por nombre, código o categoría…"
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm lg:text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          title="Filtros"
          className={cn(
            outlineButton,
            'flex lg:hidden relative w-10 px-0 justify-center',
            filtersOpen && 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => addRows(1)}
          disabled={isSaving}
          className="flex lg:hidden h-10 px-3 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>

        <div className={cn('w-full lg:w-auto flex-wrap items-center gap-2 lg:flex', filtersOpen ? 'flex' : 'hidden')}>
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
          <div className="w-full lg:w-auto flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
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
                  'h-8 flex-1 lg:flex-none px-2 lg:px-3 rounded-lg text-xs font-black cursor-pointer whitespace-nowrap',
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
      </div>

      {/* TABLA (en celular / tablet vertical, hoja compacta con el nombre fijo) */}
      <div className="flex-1 min-h-0 rounded-xl lg:rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {editor.isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div ref={scrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} className="h-full overflow-auto overscroll-contain">
            <div className={compact ? 'w-max min-w-full' : 'min-w-[90.5rem]'}>
              {compact ? (
                <CompactHeader />
              ) : (
                <div
                  className="grid sticky top-0 z-10 h-10 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  <span className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800" title="Favoritos">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800">#</span>
                  <span className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800">Img</span>
                  {(['name', 'unitType', 'barcode', 'purchasePrice', 'sellPrice'] as EditableColumn[]).map((col) => (
                    <span key={col} className="flex items-center px-2 border-r border-slate-200 dark:border-slate-800">
                      {COLUMN_LABELS[col]}
                    </span>
                  ))}
                  <span className="flex items-center justify-end px-2 border-r border-slate-200 dark:border-slate-800">Ganancia</span>
                  {(['stock', 'category', 'extraBarcodes'] as EditableColumn[]).map((col) => (
                    <span key={col} className="flex items-center px-2 border-r border-slate-200 dark:border-slate-800">
                      {COLUMN_LABELS[col]}
                    </span>
                  ))}
                  <span />
                </div>
              )}

              {visibleRows.length === 0 ? (
                <p className="p-10 text-center text-sm font-bold text-slate-400">
                  {rows.length === 0 ? 'No hay productos. Usa "+ Nuevo" para agregar.' : 'Ningún producto coincide con la búsqueda.'}
                </p>
              ) : (
                <div className="relative" style={{ height: visibleRows.length * itemHeight }}>
                  {visibleRows.slice(first, last).map((row, i) => {
                    const visibleIndex = first + i;
                    const View = compact ? CompactRowView : RowView;
                    return (
                      <div key={row.key} className="absolute inset-x-0" style={{ top: visibleIndex * itemHeight, height: itemHeight }}>
                        <View
                          row={row}
                          visibleIndex={visibleIndex}
                          status={rowStatus(row)}
                          errors={errorsByKey.get(row.key)}
                          onChange={editor.updateCell}
                          onImage={editor.setRowImage}
                          onRemove={editor.removeRow}
                          onDuplicate={handleDuplicate}
                          onToggleFavorite={editor.toggleFavorite}
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
        {visibleRows.length} de {rows.length} productos
        <span className="lg:hidden"> · Desliza a los lados para ver más columnas</span>
        <span className="hidden lg:inline">
          {' '}
          · Enter o ↑↓ para moverte entre filas · Puedes pegar varias celdas copiadas de Excel (columnas en este orden:{' '}
          {EDITABLE_COLUMNS.map((c) => COLUMN_LABELS[c]).join(', ')})
        </span>
      </p>

      <CategoryManagementModal open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen} />
      <QuickRestockDialog
        open={isQuickRestockOpen}
        onOpenChange={setIsQuickRestockOpen}
        onRestocked={editor.applyStock}
        onProductCreated={editor.addProduct}
      />
    </div>
  );
}
