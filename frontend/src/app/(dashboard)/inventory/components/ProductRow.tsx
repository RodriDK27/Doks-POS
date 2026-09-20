'use client';

import React from 'react';
import { Check, ChevronDown, Copy, Edit3, History, Minus, Plus, Tag, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Product } from '../types';
import { formatQty, getStockStatus, StockStatus } from '../utils/stockStatus';

interface ProductRowProps {
  product: Product;
  expanded: boolean;
  /** Marcado para imprimir etiqueta */
  selected: boolean;
  canManage: boolean;
  /** Muestra la categoría junto al código (solo útil al ver varias categorías) */
  showCategory: boolean;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onOpenMovements: (product: Product) => void;
  onOpenWaste: (product: Product) => void;
  onOpenDuplicate: (product: Product) => void;
  onOpenEdit: (product: Product) => void;
  onOpenDelete: (product: Product) => void;
}

const ROW_TONE: Record<StockStatus, string> = {
  OUT: 'bg-rose-50/60 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-900/50 border-l-rose-500',
  LOW: 'bg-amber-50/60 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-900/50 border-l-amber-500',
  OK: 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 border-l-slate-200 dark:border-l-slate-700',
};

const QTY_TONE: Record<StockStatus, string> = {
  OUT: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60',
  LOW: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/60',
  OK: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
};

/** Los toques se acumulan y se guardan juntos tras este tiempo sin tocar. */
const SAVE_DELAY_MS = 600;

/** Estado mutable de una fila; vive fuera de React para que el guardado agrupado no dependa de renders. */
interface QuantityEditor {
  pending: number | null;
  saving: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  target: { id: string; name: string; isWeight: boolean };
  setPending: (value: number | null) => void;
  setSaving: (value: boolean) => void;
}

async function flushEditor(editor: QuantityEditor): Promise<void> {
  if (editor.timer) {
    clearTimeout(editor.timer);
    editor.timer = null;
  }
  // Si ya hay un guardado en curso, este reintenta al terminar (ver `finally`)
  if (editor.saving) return;
  const value = editor.pending;
  if (value === null) return;

  const { id, name, isWeight } = editor.target;
  editor.saving = true;
  editor.setSaving(true);
  try {
    await api.patch(`/products/${id}/stock`, { stock: value });
    await mutate('/products');
    toast.success(`${name}: ${formatQty(value, isWeight)}`, { id: `stock-${id}` });
    if (editor.pending === value) {
      editor.pending = null;
      editor.setPending(null);
    }
  } catch (error) {
    toast.error(parseAxiosError(error, 'Error al actualizar existencias.'));
    editor.pending = null;
    editor.setPending(null);
  } finally {
    editor.saving = false;
    editor.setSaving(false);
    // Toques hechos mientras se guardaba
    if (editor.pending !== null) void flushEditor(editor);
  }
}

/**
 * Cantidad editable desde la fila: la pantalla se actualiza al instante y el guardado se agrupa
 * (sumar 5 = 5 toques, un solo PATCH). Si la fila se desmonta con cambios pendientes, los guarda.
 */
function useQuantityEditor(product: Product) {
  const isWeight = product.unitType === 'WEIGHT';
  const [pending, setPending] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  const editorRef = React.useRef<QuantityEditor | null>(null);
  if (editorRef.current === null) {
    editorRef.current = {
      pending: null,
      saving: false,
      timer: null,
      target: { id: product.id, name: product.name, isWeight },
      setPending,
      setSaving,
    };
  }

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.target = { id: product.id, name: product.name, isWeight };
  }, [product.id, product.name, isWeight]);

  React.useEffect(() => {
    const editor = editorRef.current;
    return () => {
      if (editor && editor.pending !== null) void flushEditor(editor);
    };
  }, []);

  const schedule = (next: number, immediate: boolean) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.pending = next;
    setPending(next);
    if (editor.timer) clearTimeout(editor.timer);
    if (immediate) {
      void flushEditor(editor);
    } else {
      editor.timer = setTimeout(() => void flushEditor(editor), SAVE_DELAY_MS);
    }
  };

  /** Suma (o resta) sobre lo que ya se ve en pantalla; nunca baja de 0 */
  const add = (delta: number) => {
    const base = editorRef.current?.pending ?? product.stock ?? 0;
    schedule(Math.max(0, Number((base + delta).toFixed(3))), false);
  };

  /** Cantidad exacta: se guarda de inmediato */
  const setExact = (value: number) => schedule(Math.max(0, value), true);

  return { value: pending ?? product.stock, unsaved: pending !== null, saving, add, setExact, isWeight };
}

const stepButton =
  'h-10 w-10 flex items-center justify-center rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-all cursor-pointer select-none disabled:opacity-30 disabled:cursor-default disabled:active:scale-100';

function QuantityStepper({ product }: { product: Product }) {
  const qty = useQuantityEditor(product);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const cancelRef = React.useRef(false);

  const status = getStockStatus({ stock: qty.value, minStock: product.minStock });

  const finishEdit = () => {
    setEditing(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    const value = parseFloat(draft);
    if (!Number.isNaN(value) && value >= 0 && value !== qty.value) qty.setExact(value);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        aria-label="Restar 1"
        disabled={qty.value <= 0}
        onClick={() => qty.add(-1)}
        className={stepButton}
      >
        <Minus className="h-4 w-4" />
      </button>

      {editing ? (
        <Input
          type="number"
          step="any"
          inputMode="decimal"
          autoFocus
          value={draft}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancelRef.current = true;
              e.currentTarget.blur();
            }
          }}
          className="h-10 w-[4.5rem] px-1 text-center text-base font-black rounded-xl border-indigo-400 focus-visible:ring-indigo-500"
        />
      ) : (
        <button
          type="button"
          title="Tocar para escribir la cantidad exacta"
          onClick={() => {
            setDraft(String(Number(qty.value.toFixed(3))));
            setEditing(true);
          }}
          className={cn(
            'h-10 min-w-[3.25rem] px-2 rounded-xl border text-base font-black tabular-nums cursor-pointer transition-colors',
            QTY_TONE[status],
            (qty.unsaved || qty.saving) && 'ring-2 ring-indigo-400/60'
          )}
        >
          {formatQty(qty.value, qty.isWeight)}
        </button>
      )}

      <button type="button" aria-label="Sumar 1" onClick={() => qty.add(1)} className={stepButton}>
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Sumar 10"
        onClick={() => qty.add(10)}
        className={cn(stepButton, 'hidden sm:flex w-11 text-xs font-black text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30')}
      >
        +10
      </button>
    </div>
  );
}

const panelInput =
  'h-11 text-sm font-black rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500';

const actionButton =
  'h-11 flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';

type PanelProps = Pick<
  ProductRowProps,
  'product' | 'selected' | 'canManage' | 'onToggleSelect' | 'onOpenMovements' | 'onOpenWaste' | 'onOpenDuplicate' | 'onOpenEdit' | 'onOpenDelete'
>;

/** Lo poco frecuente: precio y acciones. Se monta al expandir, así el borrador parte del valor actual. */
function ProductPanel({
  product,
  selected,
  canManage,
  onToggleSelect,
  onOpenMovements,
  onOpenWaste,
  onOpenDuplicate,
  onOpenEdit,
  onOpenDelete,
}: PanelProps) {
  const [priceDraft, setPriceDraft] = React.useState(product.sellPrice.toFixed(2));
  const [costDraft, setCostDraft] = React.useState(product.purchasePrice.toFixed(2));
  const [saving, setSaving] = React.useState(false);

  const priceNum = parseFloat(priceDraft);
  const costNum = parseFloat(costDraft);
  const priceChanged = !Number.isNaN(priceNum) && priceNum !== product.sellPrice;
  // El costo solo lo ve y edita quien administra (igual que antes con "Costo" y "Margen")
  const costChanged = canManage && !Number.isNaN(costNum) && costNum !== product.purchasePrice;
  const hasChanges = priceChanged || costChanged;

  // Margen en vivo con lo que se está escribiendo
  const livePrice = priceNum > 0 ? priceNum : product.sellPrice;
  const liveCost = !Number.isNaN(costNum) && costNum >= 0 ? costNum : product.purchasePrice;
  const margin = livePrice > 0 ? ((livePrice - liveCost) / livePrice) * 100 : 0;

  const savePrices = async () => {
    if (saving || !hasChanges) return;
    if (priceChanged && !(priceNum > 0)) {
      toast.error('El precio de venta debe ser mayor a cero.');
      return;
    }
    if (costChanged && costNum < 0) {
      toast.error('El precio de compra no puede ser negativo.');
      return;
    }
    // Solo se envía lo que cambió
    const payload: { sellPrice?: number; purchasePrice?: number } = {};
    if (priceChanged) payload.sellPrice = priceNum;
    if (costChanged) payload.purchasePrice = costNum;

    setSaving(true);
    try {
      await api.patch(`/products/${product.id}`, payload);
      const parts = [
        payload.purchasePrice !== undefined ? `compra $${payload.purchasePrice.toFixed(2)}` : null,
        payload.sellPrice !== undefined ? `venta $${payload.sellPrice.toFixed(2)}` : null,
      ].filter(Boolean);
      toast.success(`${product.name}: ${parts.join(' · ')}`);
      await mutate('/products');
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar precios.'));
    } finally {
      setSaving(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void savePrices();
    }
  };

  return (
    <div className="px-3 pb-3 pt-3 space-y-3 border-t border-slate-200/60 dark:border-slate-800/70">
      <div className={cn('grid gap-2', canManage ? 'grid-cols-2' : 'grid-cols-1')}>
        {canManage && (
          <label className="space-y-1 block min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Precio compra
            </span>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              value={costDraft}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCostDraft(e.target.value)}
              onKeyDown={onEnter}
              className={panelInput}
            />
          </label>
        )}
        <label className="space-y-1 block min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Precio venta{product.unitType === 'WEIGHT' ? ' x kg' : ''}
          </span>
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            value={priceDraft}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setPriceDraft(e.target.value)}
            onKeyDown={onEnter}
            className={cn(panelInput, 'text-indigo-600 dark:text-indigo-400')}
          />
        </label>
      </div>

      {canManage && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          <span className={cn('font-bold', margin >= 20 ? 'text-emerald-500' : 'text-amber-500')}>
            Margen {margin.toFixed(0)}%
          </span>{' '}
          · alerta de stock bajo en {product.minStock}
        </p>
      )}

      <button
        type="button"
        disabled={saving || !hasChanges}
        onClick={() => void savePrices()}
        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Guardando...' : canManage ? 'Guardar precios' : 'Guardar precio'}
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={actionButton} onClick={() => onOpenMovements(product)}>
          <History className="h-3.5 w-3.5" /> Historial
        </button>
        <button type="button" className={actionButton} onClick={() => onOpenWaste(product)}>
          <UtensilsCrossed className="h-3.5 w-3.5" /> Merma
        </button>
        <button
          type="button"
          className={cn(actionButton, selected && 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300')}
          onClick={() => onToggleSelect(product.id)}
        >
          <Tag className="h-3.5 w-3.5" /> {selected ? 'Sin etiqueta' : 'Etiqueta'}
        </button>
        {canManage && (
          <>
            <button type="button" className={actionButton} onClick={() => onOpenDuplicate(product)}>
              <Copy className="h-3.5 w-3.5" /> Duplicar
            </button>
            <button type="button" className={actionButton} onClick={() => onOpenEdit(product)}>
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              type="button"
              className={cn(actionButton, 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30')}
              onClick={() => onOpenDelete(product)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ProductRow({ expanded, showCategory, onToggleExpand, ...panelProps }: ProductRowProps) {
  const { product, selected } = panelProps;
  const status = getStockStatus(product);

  const details = [product.barcode, showCategory ? product.category : null].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'rounded-xl border border-l-4 overflow-hidden transition-shadow',
        ROW_TONE[status],
        expanded && 'shadow-md',
        selected && 'ring-2 ring-indigo-500/50'
      )}
    >
      <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-2 min-h-[64px]">
        {/* Nombre y datos: tocar abre/cierra el detalle */}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => onToggleExpand(product.id)}
          className="min-w-0 flex-1 text-left cursor-pointer py-0.5"
        >
          <span className="block text-[13px] font-black leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
            {product.name}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] leading-tight text-slate-400 dark:text-slate-500 min-w-0 mt-0.5">
            <span className="font-black text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
              ${product.sellPrice.toFixed(2)}
            </span>
            {status !== 'OK' && (
              <span className={cn('font-black uppercase shrink-0', status === 'OUT' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}>
                {status === 'OUT' ? 'Agotado' : 'Stock bajo'}
              </span>
            )}
            {selected && <span className="font-black uppercase text-indigo-600 dark:text-indigo-400 shrink-0">Etiqueta</span>}
            {details && <span className="truncate font-mono">{details}</span>}
          </span>
        </button>

        <QuantityStepper product={product} />

        <button
          type="button"
          aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
          onClick={() => onToggleExpand(product.id)}
          className="h-10 w-7 shrink-0 flex items-center justify-center text-slate-400 cursor-pointer"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && <ProductPanel {...panelProps} />}
    </div>
  );
}
