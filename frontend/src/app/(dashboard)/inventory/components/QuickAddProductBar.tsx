'use client';

import React from 'react';
import { Barcode, Check, PackagePlus, Plus, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Product, UNCATEGORIZED } from '../types';

interface QuickAddProductBarProps {
  products: Product[];
  categories: string[];
  /** '' = todas, UNCATEGORIZED = sin categoría, otro = nombre de la categoría activa */
  selectedCategory: string;
  onClose: () => void;
}

const inputClass =
  'h-11 sm:h-10 text-sm sm:text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus-visible:ring-indigo-500';

function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('space-y-1 block min-w-0', className)}>
      <span className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
        <span className="truncate">{label}</span>
        {hint}
      </span>
      {children}
    </label>
  );
}

export function QuickAddProductBar({ products, categories, selectedCategory, onClose }: QuickAddProductBarProps) {
  const [barcode, setBarcode] = React.useState('');
  const [name, setName] = React.useState('');
  // Estos cuatro se conservan entre altas: en una misma categoría los precios suelen repetirse.
  const [purchase, setPurchase] = React.useState('');
  const [sell, setSell] = React.useState('');
  const [stock, setStock] = React.useState('');
  const [minStock, setMinStock] = React.useState('1');

  // En pantallas chicas el código de barras va oculto tras un enlace (desde `sm` siempre se ve)
  const [showBarcode, setShowBarcode] = React.useState(false);
  const [pickedCategory, setPickedCategory] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const submittingRef = React.useRef(false);
  const barcodeRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const sellRef = React.useRef<HTMLInputElement>(null);

  // Primer campo: el código si es visible (lector de escritorio), si no el nombre
  const focusFirst = React.useCallback(() => {
    const wide = window.matchMedia('(min-width: 640px)').matches;
    (wide || showBarcode ? barcodeRef : nameRef).current?.focus();
  }, [showBarcode]);

  React.useEffect(() => {
    // Subir el formulario para que se vea completo (en móvil queda bajo el doblez y tras la barra inferior)
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    focusFirst();
    // Solo al abrir la barra
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryIsFixed = selectedCategory !== '';
  const targetCategory = categoryIsFixed
    ? selectedCategory === UNCATEGORIZED
      ? ''
      : selectedCategory
    : pickedCategory;
  const targetLabel = targetCategory || 'Sin categoría';

  // Avisos de duplicado mientras se escribe
  const nameMatch = React.useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 2) return null;
    return products.find((p) => p.name.trim().toLowerCase() === q) ?? null;
  }, [name, products]);

  const barcodeMatch = React.useMemo(() => {
    const code = barcode.trim();
    if (!code) return null;
    return products.find((p) => p.barcode === code || p.barcodes?.some((b) => b.barcode === code)) ?? null;
  }, [barcode, products]);

  const purchaseNum = parseFloat(purchase);
  const sellNum = parseFloat(sell);
  const marginPct = sellNum > 0 && purchaseNum >= 0 ? ((sellNum - purchaseNum) / sellNum) * 100 : null;

  const submit = async () => {
    if (submittingRef.current) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Escribe el nombre del producto.');
      nameRef.current?.focus();
      return;
    }
    if (!(sellNum > 0)) {
      toast.error('Indica un precio de venta mayor a cero.');
      sellRef.current?.focus();
      return;
    }
    if (barcodeMatch) {
      toast.error(`Ese código ya pertenece a "${barcodeMatch.name}".`);
      barcodeRef.current?.focus();
      return;
    }

    const minStockNum = parseFloat(minStock);

    // El ref bloquea el doble envío inmediato (p. ej. un lector que manda Enter dos veces)
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api.post('/products', {
        name: trimmedName,
        barcode: barcode.trim() || null,
        category: targetCategory || null,
        unitType: 'PIECE',
        purchasePrice: Math.max(0, purchaseNum || 0),
        sellPrice: sellNum,
        stock: Math.max(0, parseFloat(stock) || 0),
        minStock: Number.isNaN(minStockNum) ? 1 : Math.max(0, minStockNum),
      });
      await mutate('/products');
      toast.success(`"${trimmedName}" agregado a ${targetLabel}.`);
      setRecent((prev) => [trimmedName, ...prev].slice(0, 4));
      setName('');
      setBarcode('');
      focusFirst();
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo guardar el producto.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'barcode' | 'other') => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // Un lector de códigos termina con Enter: si aún no hay nombre, pasar al nombre
    if (field === 'barcode' && !name.trim()) {
      nameRef.current?.focus();
      return;
    }
    void submit();
  };

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div
      ref={rootRef}
      className="scroll-mt-16 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-3 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 px-2 py-1 rounded-lg shrink-0">
            <Zap className="h-3 w-3" /> Alta rápida
          </span>
          {categoryIsFixed ? (
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
              en <span className="text-indigo-600 dark:text-indigo-400">{targetLabel}</span>
            </span>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 shrink-0">en</span>
              <div className="w-36 sm:w-44">
                <CustomSelect
                  value={pickedCategory}
                  onChange={setPickedCategory}
                  placeholder="Sin categoría"
                  className="h-9"
                  options={[{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c, label: c }))]}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cerrar alta rápida"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* NOMBRE (y código de barras, que en pantalla chica queda oculto) */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-2.5">
        <Field
          label="Código de barras"
          hint={<span className="normal-case font-semibold text-slate-400">opcional</span>}
          className={cn('order-2 sm:order-1', !showBarcode && 'hidden sm:block')}
        >
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              ref={barcodeRef}
              type="text"
              inputMode="numeric"
              placeholder="Escanea o teclea..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'barcode')}
              className={cn(inputClass, 'pl-9 font-mono', barcodeMatch && 'border-rose-400 focus-visible:ring-rose-500')}
            />
          </div>
        </Field>

        <Field label="Nombre del producto *" className="order-1 sm:order-2">
          <Input
            ref={nameRef}
            type="text"
            placeholder="Ej. Sabritas Original 45g"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'other')}
            className={inputClass}
          />
        </Field>
      </div>

      {!showBarcode && (
        <button
          type="button"
          onClick={() => setShowBarcode(true)}
          className="sm:hidden flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Código de barras
        </button>
      )}

      {/* PRECIOS Y EXISTENCIAS */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-2.5 items-end">
        <Field label="Compra ($)">
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="0.00"
            value={purchase}
            onFocus={selectOnFocus}
            onChange={(e) => setPurchase(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'other')}
            className={inputClass}
          />
        </Field>

        <Field
          label="Venta ($) *"
          hint={
            marginPct !== null && (
              <span className={cn('normal-case font-black shrink-0', marginPct >= 20 ? 'text-emerald-500' : 'text-amber-500')}>
                {marginPct.toFixed(0)}%
              </span>
            )
          }
        >
          <Input
            ref={sellRef}
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="0.00"
            value={sell}
            onFocus={selectOnFocus}
            onChange={(e) => setSell(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'other')}
            className={cn(inputClass, 'text-indigo-600 dark:text-indigo-400 font-black')}
          />
        </Field>

        <Field label="Existencia">
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="0"
            value={stock}
            onFocus={selectOnFocus}
            onChange={(e) => setStock(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'other')}
            className={inputClass}
          />
        </Field>

        <Field label="Alerta bajo">
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="1"
            value={minStock}
            onFocus={selectOnFocus}
            onChange={(e) => setMinStock(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'other')}
            className={inputClass}
          />
        </Field>

        <Button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="col-span-2 sm:col-span-1 h-12 sm:h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <PackagePlus className="h-4 w-4" />
          {submitting ? 'Guardando...' : 'Agregar'}
        </Button>
      </div>

      {/* AVISOS Y AYUDA */}
      {(barcodeMatch || nameMatch) && (
        <div className="space-y-0.5">
          {barcodeMatch && (
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              Ese código ya está registrado en &quot;{barcodeMatch.name}&quot;; no se puede repetir.
            </p>
          )}
          {nameMatch && !barcodeMatch && (
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Ya existe &quot;{nameMatch.name}&quot;{nameMatch.category ? ` en ${nameMatch.category}` : ''}; si continúas se creará otro igual.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap text-[10px] text-slate-400 dark:text-slate-500">
        <span className="hidden sm:inline">
          <kbd className="font-mono font-black text-slate-500">Enter</kbd> guarda y deja listo el siguiente; compra, venta y existencia se conservan.
        </span>
        <span className="sm:hidden">Compra, venta y existencia se conservan para el siguiente.</span>
        {recent.length > 0 && (
          <span className="flex items-center gap-1.5 flex-wrap">
            {recent.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold max-w-[10rem]"
              >
                <Check className="h-2.5 w-2.5 shrink-0" /> <span className="truncate">{item}</span>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
