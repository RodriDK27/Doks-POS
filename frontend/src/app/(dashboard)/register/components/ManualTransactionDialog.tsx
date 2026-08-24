'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Package, Search, Plus, Trash2, CheckCircle2, DollarSign, Landmark, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';
import { Product } from '../../inventory/types';

interface ManualTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjForm: {
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
  };
  setAdjForm: React.Dispatch<React.SetStateAction<{
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  onSuccess?: () => void;
}

export function ManualTransactionDialog({
  open,
  onOpenChange,
  adjForm,
  setAdjForm,
  onSubmit,
  onSuccess,
}: ManualTransactionDialogProps) {
  const { data: products = [] } = useSWR<Product[]>(open ? '/products' : null);
  const { data: vaultData } = useSWR(open ? '/vault' : null);
  const vaultBalance = vaultData?.vault?.balance ?? 0;

  const [paymentSource, setPaymentSource] = useState<'CAJA_GRANDE' | 'CAJA_CHICA'>('CAJA_GRANDE');
  const [withStockRestock, setWithStockRestock] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = productSearch.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.barcode && p.barcode.includes(productSearch)) ||
          (p.barcodes && p.barcodes.some((b) => b.barcode.includes(productSearch)))
      ).slice(0, 5)
    : [];

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductSearch('');
    const cost = prod.purchasePrice || (adjForm.amount > 0 ? adjForm.amount : 0);
    setUnitCost(cost);
    if (!adjForm.description) {
      setAdjForm((prev) => ({ ...prev, description: `Pago proveedor: ${prod.name}` }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si es Egreso con Restock de Producto integrado
    if (adjForm.type === 'EGRESO' && withStockRestock) {
      if (!selectedProduct) {
        toast.error('Selecciona un producto para sumar al inventario o desactiva la opción de restock.');
        return;
      }
      if (restockQty <= 0) {
        toast.error('La cantidad de piezas/kilos a ingresar debe ser mayor a 0.');
        return;
      }
      if (adjForm.amount <= 0 && unitCost <= 0) {
        toast.error('El monto a pagar debe ser mayor a $0.');
        return;
      }

      const totalCalculated = adjForm.amount > 0 ? adjForm.amount : restockQty * unitCost;

      try {
        setIsSubmitting(true);
        await api.post('/purchases', {
          items: [
            {
              productId: selectedProduct.id,
              quantity: restockQty,
              costPrice: unitCost > 0 ? unitCost : totalCalculated / restockQty,
            },
          ],
          paymentSource: paymentSource,
          payFromRegister: paymentSource === 'CAJA_CHICA',
          notes: adjForm.description.trim() || `Egreso express: ${selectedProduct.name}`,
        });

        const sourceLabel = paymentSource === 'CAJA_GRANDE' ? 'Caja Grande' : 'Caja Chica';
        toast.success(
          `¡Pago de $${totalCalculated.toFixed(2)} (${sourceLabel}) y entrada de +${restockQty} ${
            selectedProduct.unitType === 'WEIGHT' ? 'kg' : 'uds'
          } a "${selectedProduct.name}" completados!`
        );

        mutate('/register/active');
        mutate('/register');
        mutate('/products');
        mutate('/vault');
        mutate('/reports');

        onOpenChange(false);
        setWithStockRestock(false);
        setSelectedProduct(null);
        setAdjForm({ type: 'EGRESO', amount: 0, description: '' });
        if (onSuccess) onSuccess();
      } catch (error) {
        toast.error(parseAxiosError(error, 'Error al procesar egreso con restock.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Flujo normal sin restock
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl animate-in fade-in duration-200 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 text-base">Movimiento de Caja</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Registra una entrada o salida de efectivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-1 text-xs">
          {/* TABS INGRESO / EGRESO */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              type="button"
              className={`h-9 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                adjForm.type === 'INGRESO'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              onClick={() => {
                setAdjForm({ ...adjForm, type: 'INGRESO' });
                setWithStockRestock(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ingreso (Entrada)</span>
            </button>
            <button
              type="button"
              className={`h-9 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                adjForm.type === 'EGRESO'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              onClick={() => setAdjForm({ ...adjForm, type: 'EGRESO' })}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Egreso (Salida)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto a {adjForm.type === 'EGRESO' ? 'Pagar' : 'Entrar'} ($) *</label>
              <Input
                type="number"
                step="any"
                required
                className="focus-visible:ring-indigo-500 h-10 font-black text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={adjForm.amount || ''}
                placeholder="0.00"
                onChange={(e) => setAdjForm({ ...adjForm, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Concepto / Motivo *</label>
              <Input
                type="text"
                required
                placeholder={adjForm.type === 'EGRESO' ? 'Ej. Panadería, Tortillas...' : 'Ej. Cambio inicial, Aportación...'}
                className="focus-visible:ring-indigo-500 h-10 font-bold text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={adjForm.description}
                onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
              />
            </div>
          </div>

          {/* RESTOCK INTEGRADO EN EGRESO CON SELECTOR DE CAJA GRANDE / CAJA CHICA */}
          {adjForm.type === 'EGRESO' && (
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withStockRestock}
                  onChange={(e) => setWithStockRestock(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                />
                <span className="font-black text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-indigo-600" />
                  ¿Ingresar stock a producto? (2 en 1)
                </span>
              </label>

              {withStockRestock && (
                <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                  {/* SELECCIÓN DE ORIGEN DEL PAGO (CAJA GRANDE DEFAULT) */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                      Origen del Pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentSource('CAJA_GRANDE')}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          paymentSource === 'CAJA_GRANDE'
                            ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/20 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Landmark className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-black text-[11px] block truncate">Caja Grande</span>
                          <span className="text-[9px] text-slate-400 block truncate">${vaultBalance.toFixed(2)}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentSource('CAJA_CHICA')}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          paymentSource === 'CAJA_CHICA'
                            ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/20 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Coins className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-black text-[11px] block truncate">Caja Chica</span>
                          <span className="text-[9px] text-slate-400 block truncate">Turno actual</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {!selectedProduct ? (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-8 h-9 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 rounded-xl"
                      />

                      {filteredProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-10 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectProduct(p)}
                              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">{p.name}</span>
                                <span className="text-[9px] text-slate-400 block">Stock actual: {p.stock} | Costo: ${p.purchasePrice}</span>
                              </div>
                              <Plus className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            {selectedProduct.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block">
                            Stock actual: {selectedProduct.stock} {selectedProduct.unitType === 'WEIGHT' ? 'Kg' : 'uds'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">
                            {selectedProduct.unitType === 'WEIGHT' ? 'Kilos recibidos' : 'Piezas recibidas'} *
                          </label>
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={restockQty}
                            onChange={(e) => {
                              const qty = parseFloat(e.target.value) || 0;
                              setRestockQty(qty);
                              if (unitCost > 0) {
                                setAdjForm((prev) => ({ ...prev, amount: Number((qty * unitCost).toFixed(2)) }));
                              }
                            }}
                            className="h-8 text-xs font-black bg-slate-50 dark:bg-slate-800 rounded-lg text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">
                            Costo Unitario ($)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={unitCost}
                            onChange={(e) => {
                              const cost = parseFloat(e.target.value) || 0;
                              setUnitCost(cost);
                              if (restockQty > 0) {
                                setAdjForm((prev) => ({ ...prev, amount: Number((restockQty * cost).toFixed(2)) }));
                              }
                            }}
                            className="h-8 text-xs font-bold bg-slate-50 dark:bg-slate-800 rounded-lg text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`font-black text-xs px-5 rounded-xl h-10 cursor-pointer shadow-md ${
                adjForm.type === 'INGRESO'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {withStockRestock && adjForm.type === 'EGRESO'
                ? `Pagar (${paymentSource === 'CAJA_GRANDE' ? 'Caja Grande' : 'Caja Chica'}) y Sumar Stock`
                : `Confirmar ${adjForm.type === 'INGRESO' ? 'Ingreso' : 'Egreso'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
