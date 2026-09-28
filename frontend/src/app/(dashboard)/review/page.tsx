'use client';

import React, { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { Check, CheckCircle2, HelpCircle, ImageIcon, Loader2, PackageX, Search, Sparkles, Truck } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc } from '@/lib/productImages';
import { useAuthStore } from '@/store/useAuthStore';
import { ModulePageHeader } from '../inventory/components/ModulePageHeader';
import { Product } from '../pos/types';
import { PendingPurchase, PendingPurchaseCard } from './PendingPurchases';

interface Candidate {
  id: string;
  name: string;
  sellPrice: number;
  imageUrl?: string | null;
  stock: number;
}

interface PendingItem {
  id: string;
  saleId: number;
  soldAt: string;
  productName: string;
  pendingFamily: string | null;
  price: number;
  quantity: number;
  total: number;
  candidates: Candidate[];
  suggestedProductId: string | null;
}

const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatSoldAt(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Hoy ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ayer ${time}`;
  return `${date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} ${time}`;
}

function Thumb({ imageUrl, alt }: { imageUrl?: string | null; alt: string }) {
  const src = getProductImageSrc(imageUrl);
  if (!src) {
    return (
      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <ImageIcon className="h-4 w-4 text-slate-400" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
  return <img src={src} alt={alt} crossOrigin="anonymous" loading="lazy" className="h-10 w-10 rounded-lg object-contain bg-white shrink-0" />;
}

interface PendingCardProps {
  item: PendingItem;
  allProducts: Product[];
  onDone: () => void;
}

function PendingCard({ item, allProducts, onDone }: PendingCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(item.suggestedProductId);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<'resolve' | 'dismiss' | null>(null);

  // Sin familia ("Otro producto") o si no está entre las variantes: se busca en todo el catálogo
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return allProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase() === q)
      .slice(0, 8);
  }, [search, allProducts]);

  const options: Candidate[] = useMemo(() => {
    const extra = searchResults.filter((p) => !item.candidates.some((c) => c.id === p.id));
    return [...item.candidates, ...extra];
  }, [item.candidates, searchResults]);

  const selected = options.find((o) => o.id === selectedId) ?? allProducts.find((p) => p.id === selectedId);

  const resolve = async () => {
    if (!selectedId) return;
    setBusy('resolve');
    try {
      await api.post(`/sales/items/${item.id}/resolve`, { productId: selectedId });
      toast.success(`Aclarado: ${selected?.name ?? 'producto'} (se descontó del inventario)`);
      onDone();
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo aclarar el artículo.'));
    } finally {
      setBusy(null);
    }
  };

  const dismiss = async () => {
    setBusy('dismiss');
    try {
      await api.post(`/sales/items/${item.id}/dismiss`);
      toast.success('Se envió a Solicitudes para darlo de alta');
      onDone();
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo descartar el artículo.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
            {item.pendingFamily ?? item.productName}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatSoldAt(item.soldAt)} · Venta #{item.saleId}
            {!item.pendingFamily && ' · "Otro producto"'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums">{money(item.price)}</p>
          {item.quantity !== 1 && (
            <p className="text-xs font-bold text-slate-500 tabular-nums">× {item.quantity} = {money(item.total)}</p>
          )}
        </div>
      </div>

      {options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => {
            const isSelected = option.id === selectedId;
            const isSuggested = option.id === item.suggestedProductId;
            const priceMatches = Math.abs(option.sellPrice - item.price) < 0.005;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-2 text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )}
              >
                <Thumb imageUrl={option.imageUrl} alt={option.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{option.name}</p>
                  <p className={cn('text-[11px] font-semibold tabular-nums', priceMatches ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')}>
                    {money(option.sellPrice)} · {option.stock} en existencia
                  </p>
                </div>
                {isSuggested && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase shrink-0">
                    <Sparkles className="h-3 w-3" /> Sugerido
                  </span>
                )}
                {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={item.pendingFamily ? 'Buscar otro producto…' : 'Buscar el producto…'}
          className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent pl-9 pr-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={busy !== null}
          className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Se cierra sin descontar inventario y se agrega a Solicitudes"
        >
          {busy === 'dismiss' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageX className="h-4 w-4" />}
          No está en el catálogo
        </button>
        <button
          type="button"
          onClick={() => void resolve()}
          disabled={!selectedId || busy !== null}
          className="h-9 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'resolve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {selected ? `Confirmar: ${selected.name}` : 'Elige el producto'}
        </button>
      </div>
    </div>
  );
}

/**
 * Bandeja "Por aclarar" del modo abuela:
 * - Pagos a proveedores hechos sin productos: se capturan viendo la foto de la nota y sube el inventario.
 * - Ventas cobradas sin saber el producto exacto ("No sé cuál" y "Otro producto"): se asigna el producto
 *   y se descuenta el inventario.
 */
export default function ReviewPage() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'ADMIN';
  const { data: items, isLoading } = useSWR<PendingItem[]>(isAdmin ? '/sales/pending-review' : null);
  const { data: products } = useSWR<Product[]>(isAdmin ? '/products' : null);
  const { data: purchases } = useSWR<PendingPurchase[]>(isAdmin ? '/purchases/pending-detail' : null);

  const refresh = () => {
    void mutate('/sales/pending-review');
    void mutate('/sales/pending-review/count');
    void mutate('/products');
    void mutate('/requested-products');
  };

  const refreshPurchases = () => {
    void mutate('/purchases/pending-detail');
    void mutate('/purchases/pending-detail/count');
    void mutate('/products');
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4 w-full pb-20">
        <ModulePageHeader title="Por aclarar" eyebrow="Ventas" />
        <p className="text-sm font-semibold text-slate-500">Ingresa como administrador para revisar esta bandeja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full pb-20">
      <ModulePageHeader title="Por aclarar" eyebrow="Ventas" />

      {purchases && purchases.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-indigo-600" /> Pagos a proveedores sin productos
            <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-lg">
              {purchases.length}
            </span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-2xl">
            El dinero ya salió de la caja grande. Captura qué llegó viendo la foto de la nota y se suma al inventario.
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {purchases.map((purchase) => (
              <PendingPurchaseCard key={purchase.id} purchase={purchase} allProducts={products ?? []} onDone={refreshPurchases} />
            ))}
          </div>
        </section>
      )}

      <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Ventas</h2>
      <p className="flex items-start gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-2xl">
        <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
        Ventas del modo abuela cobradas con &quot;No sé cuál&quot; u &quot;Otro producto&quot;. El dinero ya está en caja;
        al confirmar el producto se descuenta del inventario.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm font-black text-slate-700 dark:text-slate-200">Ventas al día</p>
          <p className="text-xs font-semibold text-slate-500">No hay ventas pendientes de revisar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {items.map((item) => (
            <PendingCard key={item.id} item={item} allProducts={products ?? []} onDone={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
