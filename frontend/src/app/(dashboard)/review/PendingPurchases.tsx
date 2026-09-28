'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, FileX, ImageIcon, Loader2, PackageCheck, Plus, Search, Trash2, Truck } from 'lucide-react';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../pos/types';

export interface PendingPurchase {
  id: string;
  total: number;
  createdAt: string;
  receiptImageUrl: string | null;
  supplier: { id: string; name: string; logoUrl: string | null };
}

/** El catálogo trae el costo como purchasePrice */
type CatalogProduct = Product & { purchasePrice?: number };

interface DetailLine {
  product: CatalogProduct;
  quantity: string;
  cost: string;
}

const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`;
}

interface PendingPurchaseCardProps {
  purchase: PendingPurchase;
  allProducts: CatalogProduct[];
  onDone: () => void;
}

/**
 * Pago a proveedor hecho en el modo abuela: ya salió el dinero de la caja grande.
 * Aquí se capturan los productos que llegaron (sube el inventario) viendo la foto de la nota.
 */
export function PendingPurchaseCard({ purchase, allProducts, onDone }: PendingPurchaseCardProps) {
  const [lines, setLines] = useState<DetailLine[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<'save' | 'none' | null>(null);

  const receiptSrc = getProductImageSrc(purchase.receiptImageUrl);
  const logoSrc = getProductImageSrc(purchase.supplier.logoUrl);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return allProducts
      .filter((p) => !lines.some((l) => l.product.id === p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase() === q)
      .slice(0, 6);
  }, [search, allProducts, lines]);

  const capturedTotal = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.cost) || 0), 0);
  const linesValid = lines.length > 0 && lines.every((l) => parseFloat(l.quantity) > 0 && parseFloat(l.cost) >= 0);

  const addProduct = (product: CatalogProduct) => {
    setLines((prev) => [...prev, { product, quantity: '1', cost: String(Math.round((product.purchasePrice ?? product.costPrice ?? 0) * 100) / 100) }]);
    setSearch('');
  };

  const updateLine = (id: string, patch: Partial<DetailLine>) =>
    setLines((prev) => prev.map((l) => (l.product.id === id ? { ...l, ...patch } : l)));

  const submit = async (withItems: boolean) => {
    setBusy(withItems ? 'save' : 'none');
    try {
      await api.post(`/purchases/${purchase.id}/detail`, {
        items: withItems
          ? lines.map((l) => ({ productId: l.product.id, quantity: parseFloat(l.quantity), costPrice: parseFloat(l.cost) }))
          : [],
      });
      toast.success(withItems ? 'Productos capturados: se sumaron al inventario' : 'Marcado como revisado');
      onDone();
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo guardar el detalle de la compra.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl border border-slate-100 dark:border-slate-800 bg-white overflow-hidden flex items-center justify-center shrink-0">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- el logo viene del backend en otro dominio, ya optimizado
            <img src={logoSrc} alt={purchase.supplier.name} crossOrigin="anonymous" className="h-full w-full object-contain p-1" />
          ) : (
            <Truck className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{purchase.supplier.name}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDate(purchase.createdAt)} · Caja grande</p>
        </div>
        <p className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums shrink-0">{money(purchase.total)}</p>
      </div>

      {receiptSrc ? (
        <a href={receiptSrc} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white overflow-hidden" title="Abrir la nota en grande">
          {/* eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio */}
          <img src={receiptSrc} alt="Nota del proveedor" crossOrigin="anonymous" className="w-full max-h-72 object-contain" />
        </a>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs font-bold text-slate-400">
          <FileX className="h-4 w-4" /> Sin foto de la nota
        </p>
      )}

      {lines.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_4.5rem_5.5rem_2rem] gap-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Producto</span>
            <span>Cant.</span>
            <span>Costo c/u</span>
            <span />
          </div>
          {lines.map((line) => (
            <div key={line.product.id} className="grid grid-cols-[1fr_4.5rem_5.5rem_2rem] gap-2 items-center">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  {getProductImageSrc(line.product.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio
                    <img src={getProductImageSrc(line.product.imageUrl)!} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{line.product.name}</span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={line.quantity}
                onChange={(e) => updateLine(line.product.id, { quantity: e.target.value })}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 text-xs font-black text-right outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="number"
                min="0"
                step="any"
                value={line.cost}
                onChange={(e) => updateLine(line.product.id, { cost: e.target.value })}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 text-xs font-black text-right outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((l) => l.product.id !== line.product.id))}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer"
                title="Quitar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <p className={`text-right text-xs font-bold ${Math.abs(capturedTotal - purchase.total) < 0.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            Capturado {money(capturedTotal)} de {money(purchase.total)} pagados
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto que llegó…"
          className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent pl-9 pr-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="truncate">{p.name}</span>
                <Plus className="h-4 w-4 text-indigo-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => void submit(false)}
          disabled={busy !== null}
          className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Para pagos que no traen mercancía (ej. un servicio). No mueve inventario."
        >
          {busy === 'none' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          No lleva productos
        </button>
        <button
          type="button"
          onClick={() => void submit(true)}
          disabled={!linesValid || busy !== null}
          className="h-9 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          Sumar al inventario
        </button>
      </div>
    </div>
  );
}
