'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Undo2, Repeat, Minus, Plus, Search, Trash2, Loader2, PackageCheck, PackageX } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Product } from '../../pos/types';
import { Sale, SaleReturnResult } from '../types';

interface SaleReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onCompleted: (result: SaleReturnResult) => void;
}

type Mode = 'DEVOLUCION' | 'CAMBIO';

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
const roundQty = (qty: number) => Math.round((qty + Number.EPSILON) * 1000) / 1000;

const REFUND_LABEL: Record<string, string> = {
  EFECTIVO: 'Se saca de la caja en efectivo',
  FIADO: 'Se descuenta de la deuda del cliente',
  TARJETA: 'Reembolsar por la terminal de tarjeta',
  TRANSFERENCIA: 'Reembolsar por transferencia',
};

export function SaleReturnDialog({ open, onOpenChange, sale, onCompleted }: SaleReturnDialogProps) {
  const [mode, setMode] = useState<Mode>('DEVOLUCION');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [replacements, setReplacements] = useState<{ product: Product; quantity: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // El estado arranca limpio en cada apertura porque la página remonta el diálogo con otra `key`
  const { data: products } = useSWR<Product[]>(open && mode === 'CAMBIO' ? '/products' : null);

  const returnableItems = useMemo(
    () =>
      (sale?.items ?? []).map((item) => ({
        ...item,
        available: roundQty(item.quantity - (item.returnedQuantity ?? 0)),
      })),
    [sale],
  );

  // Si la venta tuvo descuento, cada artículo se reembolsa en proporción a lo que realmente se pagó
  const paidRatio = useMemo(() => {
    const itemsSum = (sale?.items ?? []).reduce((acc, i) => acc + i.total, 0);
    return sale && itemsSum > 0 ? sale.total / itemsSum : 0;
  }, [sale]);

  const refund = useMemo(() => {
    if (!sale) return 0;
    const raw = returnableItems.reduce(
      (acc, item) => acc + roundMoney((item.total / item.quantity) * (quantities[item.id] ?? 0) * paidRatio),
      0,
    );
    return Math.min(roundMoney(raw), roundMoney(sale.total - (sale.refundedAmount ?? 0)));
  }, [sale, returnableItems, quantities, paidRatio]);

  const replacementTotal = roundMoney(
    replacements.reduce((acc, r) => acc + roundMoney(r.product.sellPrice * r.quantity), 0),
  );
  const difference = roundMoney(replacementTotal - refund);
  const hasReturnItems = Object.values(quantities).some((q) => q > 0);

  const searchResults = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q || !products) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode === q || p.barcodes?.some((b) => b.barcode === q))
      .slice(0, 6);
  }, [productSearch, products]);

  if (!sale) return null;

  const setQty = (itemId: string, value: number, max: number) => {
    const clamped = Math.min(Math.max(0, roundQty(value)), max);
    setQuantities((prev) => ({ ...prev, [itemId]: isNaN(clamped) ? 0 : clamped }));
  };

  const addReplacement = (product: Product) => {
    setReplacements((prev) => {
      const existing = prev.find((r) => r.product.id === product.id);
      if (existing) {
        return prev.map((r) => (r.product.id === product.id ? { ...r, quantity: r.quantity + 1 } : r));
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch('');
  };

  const setReplacementQty = (productId: string, value: number) => {
    setReplacements((prev) =>
      prev
        .map((r) => (r.product.id === productId ? { ...r, quantity: roundQty(value) } : r))
        .filter((r) => r.quantity > 0 && !isNaN(r.quantity)),
    );
  };

  const canSubmit = hasReturnItems && !isSubmitting && (mode === 'DEVOLUCION' || replacements.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const response = await api.post<SaleReturnResult>(`/sales/${sale.id}/returns`, {
        items: Object.entries(quantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([saleItemId, quantity]) => ({ saleItemId, quantity })),
        restock,
        reason: reason.trim() || undefined,
        replacementItems:
          mode === 'CAMBIO'
            ? replacements.map((r) => ({ productId: r.product.id, quantity: r.quantity }))
            : undefined,
      });
      onCompleted(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo registrar la devolución.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">
            Devolución / Cambio · Ticket #{sale.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Tipo de operación */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'DEVOLUCION', label: 'Devolución', hint: 'Se le regresa su dinero', icon: Undo2 },
              { id: 'CAMBIO', label: 'Cambio', hint: 'Se lleva otro producto', icon: Repeat },
            ] as const).map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${isActive
                    ? 'border-2 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <span className={`flex items-center gap-1.5 text-xs font-black ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    <Icon className="h-4 w-4" /> {m.label}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{m.hint}</span>
                </button>
              );
            })}
          </div>

          {/* Artículos que regresa */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">¿Qué regresa el cliente?</span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {returnableItems.map((item) => {
                const qty = quantities[item.id] ?? 0;
                const fullyReturned = item.available <= 0;
                return (
                  <div key={item.id} className={`flex items-center gap-2 p-2.5 ${fullyReturned ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.productName}</span>
                      <span className="text-[10px] text-slate-400">
                        {fullyReturned
                          ? 'Ya devuelto'
                          : `${item.available} de ${item.quantity} · $${item.price.toFixed(2)} c/u`}
                      </span>
                    </div>
                    {!fullyReturned && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg cursor-pointer"
                          onClick={() => setQty(item.id, qty - 1, item.available)}
                          disabled={qty <= 0}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={item.available}
                          step="any"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => setQty(item.id, parseFloat(e.target.value || '0'), item.available)}
                          className="h-8 w-16 text-center text-xs font-black rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg cursor-pointer"
                          onClick={() => setQty(item.id, qty + 1, item.available)}
                          disabled={qty >= item.available}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ¿Regresa al inventario? */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRestock(true)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${restock
                ? 'border-2 border-emerald-500 bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
            >
              <PackageCheck className="h-4 w-4 shrink-0" /> Está bien, regresa al inventario
            </button>
            <button
              type="button"
              onClick={() => setRestock(false)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${!restock
                ? 'border-2 border-rose-500 bg-rose-50/60 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
            >
              <PackageX className="h-4 w-4 shrink-0" /> Dañado / caducado, no regresa
            </button>
          </div>

          {/* Productos que se lleva a cambio */}
          {mode === 'CAMBIO' && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">¿Qué se lleva a cambio?</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  className="pl-9 h-10 rounded-xl text-xs"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addReplacement(p)}
                      className="w-full flex justify-between items-center p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
                      <span className="text-xs font-black text-indigo-600 shrink-0 ml-2">${p.sellPrice.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
              {replacements.length > 0 && (
                <div className="border border-indigo-200 dark:border-indigo-900 rounded-xl divide-y divide-indigo-100 dark:divide-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                  {replacements.map((r) => (
                    <div key={r.product.id} className="flex items-center gap-2 p-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{r.product.name}</span>
                        <span className="text-[10px] text-slate-400">${r.product.sellPrice.toFixed(2)} c/u</span>
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={r.quantity}
                        onChange={(e) => setReplacementQty(r.product.id, parseFloat(e.target.value || '0'))}
                        className="h-8 w-16 text-center text-xs font-black rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-rose-500 cursor-pointer"
                        onClick={() => setReplacementQty(r.product.id, 0)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input
            type="text"
            placeholder="Motivo (opcional): caducado, se equivocó de producto..."
            className="h-10 rounded-xl text-xs"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {/* Resumen de dinero */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Valor de lo que regresa</span>
              <span className="font-bold">${refund.toFixed(2)}</span>
            </div>
            {mode === 'CAMBIO' && (
              <div className="flex justify-between text-slate-500">
                <span>Valor de lo que se lleva</span>
                <span className="font-bold">${replacementTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-black text-sm">
              {mode === 'DEVOLUCION' || difference < 0 ? (
                <>
                  <span className="text-rose-600">Regresar al cliente</span>
                  <span className="text-rose-600">${(mode === 'DEVOLUCION' ? refund : -difference).toFixed(2)}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-600">{difference > 0 ? 'El cliente paga' : 'Sin diferencia'}</span>
                  <span className="text-emerald-600">${difference.toFixed(2)}</span>
                </>
              )}
            </div>
            <span className="block text-[10px] text-slate-400">
              Venta en {sale.paymentMethod.toLowerCase()}: {REFUND_LABEL[sale.paymentMethod] ?? 'mismo método de la venta'}.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 flex items-center gap-1.5 cursor-pointer"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'CAMBIO' ? <Repeat className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
            {mode === 'CAMBIO' ? 'Registrar cambio' : 'Registrar devolución'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
