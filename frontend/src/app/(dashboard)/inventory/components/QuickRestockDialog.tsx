'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Barcode, Camera, CameraOff, Loader2, Minus, PackagePlus, Plus, Search, Tag, Trash2, X, Zap } from 'lucide-react';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category, Product } from '../types';
import { ProductFormDialog, ProductFormValues } from './ProductFormDialog';

/** El servidor acepta hasta 250 productos por petición */
const RESTOCK_BATCH = 250;
const MAX_RESULTS = 60;
/** Lo mismo que acepta el lector de teclado del punto de venta */
const BARCODE_PATTERN = /^[\w./-]{4,}$/;
const CAMERA_VIEWPORT_ID = 'quick-restock-camera';

interface RestockItem {
  product: Product;
  quantity: string;
}

interface QuickRestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stock final que devolvió el servidor (p. ej. para reflejarlo en la tabla de inventario) */
  onRestocked?: (updates: Array<{ id: string; stock: number }>) => void;
  onProductCreated?: (product: Product) => void;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const formatQty = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 3 });

function parseQuantity(value: string): number | null {
  const n = Number(value.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

const ALL_CATEGORIES = '__all';
const NO_CATEGORY = '__none';
const categoryLabel = (value: string) =>
  value === ALL_CATEGORIES ? 'Todas las categorías' : value === NO_CATEGORY ? 'Sin categoría' : value;

/**
 * Filtro de categoría con buscador: al escribir van apareciendo las que coinciden (primero las que
 * empiezan igual). La lista se dibuja dentro del modal para que tocarla no lo cierre.
 */
function CategoryFilter({ value, categories, onChange }: { value: string; categories: string[]; onChange: (value: string) => void }) {
  const [query, setQuery] = useState(categoryLabel(value));
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();

  // Mientras no se escribe nada nuevo (el texto es el de la categoría elegida) se muestran todas
  const q = query === categoryLabel(value) ? '' : normalize(query.trim());
  const options = useMemo(() => {
    const base = [ALL_CATEGORIES, NO_CATEGORY];
    if (!q) return [...base, ...categories];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const c of categories) {
      const n = normalize(c);
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(q)) contains.push(c);
    }
    return [...starts, ...contains];
  }, [categories, q]);

  const choose = (option: string) => {
    onChange(option);
    setQuery(categoryLabel(option));
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0">
      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setIsOpen(true);
          if (!e.target.value.trim()) onChange(ALL_CATEGORIES);
        }}
        onFocus={(e) => {
          e.target.select();
          setHighlight(0);
          setIsOpen(true);
        }}
        onBlur={() => {
          setIsOpen(false);
          setQuery(categoryLabel(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setHighlight((h) => (options.length ? (h + step + options.length) % options.length : 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen && options.length) choose(options[Math.min(highlight, options.length - 1)]);
          } else if (e.key === 'Escape' && isOpen) {
            // Solo cierra la lista, no el modal
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label="Categoría"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="Escribe una categoría…"
        className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-9 text-sm lg:text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      {value !== ALL_CATEGORIES && (
        <button
          type="button"
          // mousedown: el input no pierde el foco antes de limpiar
          onMouseDown={(e) => {
            e.preventDefault();
            choose(ALL_CATEGORIES);
          }}
          title="Quitar filtro de categoría"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs font-bold text-slate-400">Ninguna categoría coincide.</p>
          ) : (
            options.map((option, i) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold cursor-pointer',
                  i === highlight ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200',
                  option === value && 'font-black',
                  option === NO_CATEGORY && 'border-b border-slate-100 dark:border-slate-800'
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{categoryLabel(option)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Agregado rápido: cuando llega un proveedor se buscan o escanean los productos, se ajusta la cantidad
 * de cada uno en la lista y al final se suma todo al inventario en una sola petición.
 * La lista se conserva al cerrar el modal, hasta que se agrega o se vacía.
 */
export function QuickRestockDialog({ open, onOpenChange, onRestocked, onProductCreated }: QuickRestockDialogProps) {
  // Mismas llaves que usan Inventario y el punto de venta: SWR comparte la caché
  const { data: catalog } = useSWR<Product[]>('/products');
  const { data: categoryList } = useSWR<Category[]>('/categories');
  const products = useMemo(() => catalog ?? [], [catalog]);
  const categories = useMemo(() => {
    const names = new Set<string>();
    categoryList?.forEach((c) => names.add(c.name));
    products.forEach((p) => p.category?.trim() && names.add(p.category.trim()));
    return [...names].sort((a, b) => a.localeCompare(b, 'es'));
  }, [categoryList, products]);

  const [items, setItems] = useState<RestockItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback(() => requestAnimationFrame(() => searchRef.current?.focus()), []);

  // Código principal y adicionales → producto
  const productByCode = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      if (p.barcode) map.set(p.barcode.trim(), p);
      p.barcodes?.forEach((b) => map.set(b.barcode.trim(), p));
    }
    return map;
  }, [products]);

  const results = useMemo(() => {
    const q = normalize(search.trim());
    const matches = products.filter((p) => {
      if (category === NO_CATEGORY && p.category?.trim()) return false;
      if (category !== ALL_CATEGORIES && category !== NO_CATEGORY && (p.category ?? '').trim() !== category) return false;
      if (!q) return true;
      const codes = [p.barcode ?? '', ...(p.barcodes?.map((b) => b.barcode) ?? [])].join(' ');
      return normalize(`${p.name} ${codes}`).includes(q);
    });
    return { total: matches.length, shown: matches.slice(0, MAX_RESULTS) };
  }, [products, search, category]);

  const quantityById = useMemo(() => new Map(items.map((i) => [i.product.id, i.quantity])), [items]);
  // La lista guarda el producto como estaba al agregarlo; para mostrar la existencia se usa el catálogo al día
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // ─── Lista ───
  const addProduct = useCallback(
    (product: Product) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (!existing) return [{ product, quantity: '1' }, ...prev];
        // Cada lectura del mismo producto suma uno y lo sube al inicio de la lista
        const next = String((parseQuantity(existing.quantity) ?? 0) + 1);
        return [{ ...existing, quantity: next }, ...prev.filter((i) => i !== existing)];
      });
      setLastAddedId(product.id);
      setSearch('');
      focusSearch();
    },
    [focusSearch]
  );

  const setQuantity = (id: string, quantity: string) =>
    setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity } : i)));

  const stepQuantity = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i;
        const next = Math.max(1, (parseQuantity(i.quantity) ?? 0) + delta);
        return { ...i, quantity: String(next) };
      })
    );

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id));

  /** Código leído (lector, cámara o tecleado): si existe se agrega; si no, se registra como producto nuevo */
  const handleCode = useCallback(
    (raw: string) => {
      const code = raw.trim();
      const product = productByCode.get(code);
      if (product) {
        addProduct(product);
        return;
      }
      setSearch('');
      setNewProduct({ barcode: code });
      toast.info(`El código ${code} no está registrado. Captura el producto nuevo.`);
    },
    [productByCode, addProduct]
  );

  const handleSearchEnter = () => {
    const q = search.trim();
    if (!q) return;
    if (productByCode.has(q)) return handleCode(q);
    if (results.total === 1) return addProduct(results.shown[0]);
    if (results.total === 0 && BARCODE_PATTERN.test(q) && /\d/.test(q)) return handleCode(q);
    if (results.total > 1) toast.info('Varios productos coinciden: toca el que quieres agregar.');
  };

  // ─── Cámara ───
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const handleCodeRef = useRef(handleCode);
  useEffect(() => {
    handleCodeRef.current = handleCode;
  });

  useEffect(() => {
    if (!open || !cameraOn) return;
    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    let last: { code: string; time: number } | null = null;

    // Se espera un momento a que el modal pinte el contenedor del video
    const timer = setTimeout(async () => {
      try {
        scanner = new Html5Qrcode(CAMERA_VIEWPORT_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, aspectRatio: 1.7777778 },
          (decoded) => {
            // La cámara lee el mismo código varias veces seguidas: se toma una vez cada 1.5 s
            const now = Date.now();
            if (last && last.code === decoded && now - last.time < 1500) return;
            last = { code: decoded, time: now };
            navigator.vibrate?.(80);
            handleCodeRef.current(decoded);
          },
          () => {}
        );
        if (cancelled) await scanner.stop().catch(() => {});
        else setCameraError(null);
      } catch {
        if (!cancelled) setCameraError('No se pudo abrir la cámara. Revisa el permiso del navegador.');
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (scanner?.isScanning) {
        void scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {});
      }
    };
  }, [open, cameraOn]);

  // ─── Producto nuevo ───
  const handleCreateProduct = async (values: ProductFormValues) => {
    try {
      const { data: created } = await api.post<Product>('/products', {
        ...values,
        barcode: values.barcode?.trim() || null,
        category: values.category?.trim() || null,
        family: values.family?.trim() || null,
        additionalBarcodes: values.additionalBarcodes || [],
      });
      onProductCreated?.(created);
      void mutate('/products');
      setNewProduct(null);
      // Si ya se capturó su existencia en el formulario no se vuelve a sumar
      if (created.stock > 0) {
        toast.success(`"${created.name}" registrado con ${formatQty(created.stock)} en existencia.`);
        focusSearch();
      } else {
        toast.success(`"${created.name}" registrado. Ajusta la cantidad en la lista.`);
        addProduct(created);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo registrar el producto.'));
    }
  };

  // ─── Agregar todo ───
  const invalidCount = items.filter((i) => parseQuantity(i.quantity) === null).length;
  const totalUnits = items.reduce((sum, i) => sum + (parseQuantity(i.quantity) ?? 0), 0);

  const handleSubmit = async () => {
    if (!items.length || invalidCount) return;
    setIsSubmitting(true);
    const updates: Array<{ id: string; stock: number }> = [];
    try {
      for (let start = 0; start < items.length; start += RESTOCK_BATCH) {
        const batch = items.slice(start, start + RESTOCK_BATCH);
        const { data } = await api.post<{ updated: Array<{ id: string; stock: number }> }>('/products/restock', {
          items: batch.map((i) => ({ productId: i.product.id, quantity: parseQuantity(i.quantity)! })),
        });
        updates.push(...data.updated);
      }
      toast.success(`Se agregaron ${formatQty(totalUnits)} unidad(es) de ${items.length} producto(s) al inventario.`);
      setItems([]);
      setLastAddedId(null);
      setCameraOn(false);
      onOpenChange(false);
    } catch (error) {
      // Las tandas que ya entraron se quitan de la lista para no sumarlas dos veces
      const saved = new Set(updates.map((u) => u.id));
      setItems((prev) => prev.filter((i) => !saved.has(i.product.id)));
      toast.error(parseAxiosError(error, 'No se pudo agregar al inventario.'));
    } finally {
      if (updates.length) {
        onRestocked?.(updates);
        void mutate('/products');
      }
      setIsSubmitting(false);
    }
  };

  // Aviso del navegador si se intenta salir con productos en la lista
  useEffect(() => {
    if (items.length === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [items.length]);

  // Si el foco quedó en un botón (+, −, una categoría…), lo que se teclee o lea el lector va al buscador
  const isCreatingProduct = newProduct !== null;
  useEffect(() => {
    if (!open || isCreatingProduct) return;
    const redirect = (e: KeyboardEvent) => {
      // El espacio se deja pasar para poder activar botones con el teclado
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === ' ') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      // Al mover el foco durante keydown, el carácter se escribe en el buscador
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', redirect, true);
    return () => window.removeEventListener('keydown', redirect, true);
  }, [open, isCreatingProduct]);

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) setCameraOn(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        initialFocus={searchRef}
        data-quick-restock=""
        className="flex flex-col gap-0 overflow-hidden p-0 max-w-[calc(100%-2.5rem)] sm:max-w-[min(64rem,calc(100%-4rem))] md:max-w-[min(64rem,calc(100%-4rem))] h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-5rem)] lg:h-[min(46rem,calc(100dvh-4rem))] rounded-2xl bg-white dark:bg-slate-900"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Agregado rápido
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Escanea o busca lo que llegó, ajusta las cantidades y agrégalo todo al inventario de una vez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* BUSCADOR */}
          <section className="min-h-0 flex flex-col gap-2 p-3 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchEnter();
                    }
                  }}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Nombre o código (o usa el lector)…"
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm lg:text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setCameraOn((v) => !v)}
                title={cameraOn ? 'Apagar cámara' : 'Escanear con la cámara'}
                className={cn(
                  'h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center cursor-pointer',
                  cameraOn
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({})}
                title="Registrar un producto nuevo"
                className="h-10 px-3 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <PackagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>

            <CategoryFilter value={category} categories={categories} onChange={setCategory} />

            {cameraOn && (
              <div className="relative shrink-0 w-full aspect-video max-h-40 rounded-xl overflow-hidden bg-slate-950">
                <div id={CAMERA_VIEWPORT_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                {cameraError && (
                  <p className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs font-bold text-white bg-slate-900/90">
                    {cameraError}
                  </p>
                )}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-100 dark:border-slate-800">
              {results.total === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-xs font-bold text-slate-400">Ningún producto coincide.</p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = search.trim();
                        setNewProduct(BARCODE_PATTERN.test(q) && /\d/.test(q) && !/\s/.test(q) ? { barcode: q } : { name: q });
                      }}
                      className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PackagePlus className="h-4 w-4" /> Registrar «{search.trim()}» como nuevo
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.shown.map((p) => {
                    const inList = quantityById.get(p.id);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => addProduct(p)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate">
                              {p.barcode ? (
                                <span className="font-mono">{p.barcode}</span>
                              ) : (
                                'Sin código'
                              )}
                              {p.category ? ` · ${p.category}` : ''} · Hay {formatQty(p.stock)}
                            </p>
                          </div>
                          {inList ? (
                            <span className="shrink-0 h-6 min-w-6 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                              +{inList}
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 shrink-0 text-indigo-500" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {results.total > results.shown.length && (
                    <li className="px-3 py-2 text-[10px] font-semibold text-slate-400 text-center">
                      Mostrando {results.shown.length} de {results.total}. Escribe más para filtrar.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </section>

          {/* LISTA POR AGREGAR */}
          <section className="min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Por agregar · {items.length} producto(s)
              </p>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.confirm('¿Vaciar la lista?') && setItems([])}
                  disabled={isSubmitting}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-50"
                >
                  Vaciar
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                  <Barcode className="h-8 w-8" />
                  <p className="text-xs font-bold">Escanea o toca un producto para agregarlo a la lista.</p>
                  <p className="text-[11px] font-semibold">Leer el mismo código otra vez suma uno más.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map(({ product, quantity }) => {
                    const qty = parseQuantity(quantity);
                    const stock = productById.get(product.id)?.stock ?? product.stock;
                    return (
                      <li
                        key={product.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2',
                          product.id === lastAddedId && 'bg-emerald-50/70 dark:bg-emerald-950/20'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{product.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 tabular-nums">
                            Hay {formatQty(stock)}
                            {qty !== null && (
                              <>
                                {' → '}
                                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                  {formatQty(stock + qty)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => stepQuantity(product.id, -1)}
                            disabled={isSubmitting}
                            aria-label="Uno menos"
                            className="h-9 w-9 rounded-l-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            value={quantity}
                            onChange={(e) => setQuantity(product.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                focusSearch();
                              }
                            }}
                            inputMode="decimal"
                            enterKeyHint="done"
                            aria-label={`Cantidad de ${product.name}`}
                            className={cn(
                              'h-9 w-16 border-y border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-sm font-black tabular-nums outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                              qty === null && 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => stepQuantity(product.id, 1)}
                            disabled={isSubmitting}
                            aria-label="Uno más"
                            className="h-9 w-9 rounded-r-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          disabled={isSubmitting}
                          title="Quitar de la lista"
                          className="h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
              <p className="flex-1 min-w-0 text-[11px] font-semibold text-slate-500">
                {invalidCount > 0 ? (
                  <span className="text-rose-600 font-bold">{invalidCount} cantidad(es) no válidas</span>
                ) : (
                  items.length > 0 && <>Total: {formatQty(totalUnits)} unidad(es)</>
                )}
              </p>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={items.length === 0 || invalidCount > 0 || isSubmitting}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Agregar al inventario{items.length ? ` (${items.length})` : ''}
              </button>
            </div>
          </section>
        </div>

        {/* Dentro del modal para que quede encima como diálogo anidado */}
        <ProductFormDialog
          open={newProduct !== null}
          onOpenChange={(next) => {
            if (!next) {
              setNewProduct(null);
              focusSearch();
            }
          }}
          editingProduct={newProduct as Product | null}
          onSubmit={handleCreateProduct}
          categories={categories}
          barcodeInputRef={barcodeInputRef}
        />
      </DialogContent>
    </Dialog>
  );
}
