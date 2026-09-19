'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Truck,
  Zap,
  DollarSign,
  Wallet,
  Landmark,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Tag,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { Supplier, Product } from '@/app/(dashboard)/inventory/types';

interface PendingTicket {
  id: string;
  amount: number;
  scheduledDate?: string | null;
  notes?: string | null;
  status?: string;
  supplier: { id: string; name: string };
}

interface QuickSupplierPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSupplierId?: string | null;
  preselectedTicket?: PendingTicket | null;
  onSuccess?: () => void;
}

export function QuickSupplierPaymentModal({
  open,
  onOpenChange,
  preselectedSupplierId = null,
  preselectedTicket = null,
  onSuccess,
}: QuickSupplierPaymentModalProps) {
  const { data: suppliers = [] } = useSWR<Supplier[]>(open ? '/suppliers' : null);
  const { data: pendingTickets = [] } = useSWR<PendingTicket[]>(open ? '/suppliers/pending-tickets/active' : null);
  const { data: products = [] } = useSWR<Product[]>(open ? '/products' : null);
  const { data: vaultData } = useSWR(open ? '/vault' : null);
  const { data: registerData } = useSWR(open ? '/register/active' : null);

  const vaultBalance = vaultData?.vault?.balance ?? 0;
  const isRegisterOpen = registerData && registerData.status === 'ABIERTO';

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<'CAJA_CHICA' | 'CAJA_GRANDE' | 'CREDITO'>('CAJA_CHICA');
  const [notes, setNotes] = useState<string>('');
  const [settleTicketId, setSettleTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modo detallado opcional
  const [mode, setMode] = useState<'EXPRESS' | 'DETAILED'>('EXPRESS');
  const [detailedItems, setDetailedItems] = useState<Array<{
    productId: string;
    productName: string;
    costPrice: number;
    quantity: number;
  }>>([]);
  const [selectedAddProdId, setSelectedAddProdId] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(1);
  const [addCost, setAddCost] = useState<number>(0);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (open) {
      if (preselectedTicket) {
        setSelectedSupplierId(preselectedTicket.supplier.id);
        setAmount(String(preselectedTicket.amount));
        setSettleTicketId(preselectedTicket.id);
        setNotes(preselectedTicket.notes ? `Liquidación ticket: ${preselectedTicket.notes}` : 'Liquidación de ticket previo');
      } else if (preselectedSupplierId) {
        setSelectedSupplierId(preselectedSupplierId);
        setAmount('');
        setSettleTicketId(null);
        setNotes('');
      } else {
        setSelectedSupplierId('');
        setAmount('');
        setSettleTicketId(null);
        setNotes('');
      }
      setMode('EXPRESS');
      setDetailedItems([]);

      // Auto enfoque en monto después de render
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [open, preselectedSupplierId, preselectedTicket]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Checar si el proveedor seleccionado tiene ticket pendiente
  const activeSupplierTicket = useMemo(() => {
    if (!selectedSupplierId) return null;
    return pendingTickets.find(
      (t) => t.supplier.id === selectedSupplierId && (t.status === 'PENDING' || !t.status)
    ) || null;
  }, [selectedSupplierId, pendingTickets]);

  // Proveedores frecuentes / más habituales para acceso de 1 toque
  const frequentSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.isActive !== false).slice(0, 6);
  }, [suppliers]);

  // Total calculado
  const calculatedTotal = useMemo(() => {
    if (mode === 'DETAILED' && detailedItems.length > 0) {
      return detailedItems.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
    }
    const val = parseFloat(amount);
    return isNaN(val) ? 0 : val;
  }, [mode, detailedItems, amount]);

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    // Si este proveedor tiene un ticket pendiente, auto sugerir liquidarlo
    const ticket = pendingTickets.find((t) => t.supplier.id === supplierId && (t.status === 'PENDING' || !t.status));
    if (ticket && !amount) {
      setAmount(String(ticket.amount));
      setSettleTicketId(ticket.id);
      if (ticket.notes) setNotes(`Liquidación ticket: ${ticket.notes}`);
    } else {
      setSettleTicketId(null);
    }
    amountInputRef.current?.focus();
  };

  const handleApplyTicket = (ticket: PendingTicket) => {
    setAmount(String(ticket.amount));
    setSettleTicketId(ticket.id);
    if (ticket.notes) setNotes(`Liquidación ticket: ${ticket.notes}`);
    toast.info(`Monto ajustado al ticket pendiente: $${ticket.amount}`);
  };

  const handleAddDetailedProduct = () => {
    if (!selectedAddProdId || addQty <= 0 || addCost < 0) return;
    const prod = products.find((p) => p.id === selectedAddProdId);
    if (!prod) return;

    setDetailedItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        costPrice: addCost,
        quantity: addQty,
      },
    ]);
    setSelectedAddProdId('');
    setAddQty(1);
    setAddCost(0);
  };

  const handleRemoveDetailedProduct = (index: number) => {
    setDetailedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error('Por favor selecciona el proveedor que recibe el pago.');
      return;
    }

    if (calculatedTotal <= 0) {
      toast.error('Por favor ingresa un monto válido mayor a $0.');
      return;
    }

    if (paymentSource === 'CAJA_CHICA' && !isRegisterOpen) {
      toast.error('La Caja Chica no está abierta en este turno. Elige Caja Grande o abre turno.');
      return;
    }

    if (paymentSource === 'CAJA_GRANDE' && vaultBalance < calculatedTotal) {
      toast.error(`Saldo insuficiente en Caja Grande ($${vaultBalance.toFixed(2)}) para cubrir $${calculatedTotal.toFixed(2)}.`);
      return;
    }

    try {
      setIsSubmitting(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        supplierId: selectedSupplierId,
        paymentSource,
        payFromRegister: paymentSource === 'CAJA_CHICA',
        notes: notes.trim() || undefined,
        settleTicketId: settleTicketId || undefined,
      };

      if (mode === 'DETAILED' && detailedItems.length > 0) {
        payload.items = detailedItems.map((item) => ({
          productId: item.productId,
          costPrice: item.costPrice,
          quantity: item.quantity,
        }));
      } else {
        payload.total = calculatedTotal;
      }

      await api.post('/purchases', payload);

      const sourceLabel =
        paymentSource === 'CAJA_CHICA'
          ? 'Caja Chica'
          : paymentSource === 'CAJA_GRANDE'
          ? 'Caja Grande'
          : 'Crédito';

      toast.success(
        `¡Pago de $${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} registrado exitosamente a ${selectedSupplier?.name || 'proveedor'} (${sourceLabel})!`,
        { duration: 4500 }
      );

      // Mutaciones de caché globales para actualizar la UI en tiempo real
      await Promise.allSettled([
        mutate('/purchases'),
        mutate('/suppliers'),
        mutate('/suppliers/pending-tickets/active'),
        mutate('/suppliers/pending-tickets/history'),
        mutate('/register/active'),
        mutate('/register'),
        mutate('/vault'),
        mutate('/products'),
        mutate('/reports'),
      ]);

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(parseAxiosError(err, 'Error al registrar el pago al proveedor.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[540px] max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                <Zap className="h-5 w-5 fill-amber-500/20 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                  Pago Express a Proveedor
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Salida de dinero para repartidor, preventa o mercancía recibida.
                </DialogDescription>
              </div>
            </div>

            {/* Alternador de Modo: Express vs Detallado */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setMode('EXPRESS')}
                className={cn(
                  'text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                  mode === 'EXPRESS'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                ⚡ 1 Paso
              </button>
              <button
                type="button"
                onClick={() => setMode('DETAILED')}
                className={cn(
                  'text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                  mode === 'DETAILED'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                📦 +Productos
              </button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* SELECCIÓN DE PROVEEDOR */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider flex items-center justify-between">
              <span>Proveedor *</span>
              {selectedSupplier && (
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold normal-case">
                  Seleccionado: {selectedSupplier.name}
                </span>
              )}
            </label>

            {/* Chips de Proveedores Habituales */}
            {frequentSuppliers.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {frequentSuppliers.map((sup) => {
                  const isSelected = selectedSupplierId === sup.id;
                  const hasTicket = pendingTickets.some(
                    (t) => t.supplier.id === sup.id && (t.status === 'PENDING' || !t.status)
                  );

                  return (
                    <button
                      key={sup.id}
                      type="button"
                      onClick={() => handleSelectSupplier(sup.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 shrink-0',
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Truck className={cn('h-3.5 w-3.5', isSelected ? 'text-white' : 'text-slate-400')} />
                      <span>{sup.name}</span>
                      {hasTicket && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dropdown de Selección Completa */}
            <div className="w-full">
              <CustomSelect
                className="h-10 text-xs font-bold"
                value={selectedSupplierId}
                onChange={handleSelectSupplier}
                placeholder="-- O busca en todos los proveedores --"
                options={[
                  { value: '', label: '-- Selecciona Proveedor --' },
                  ...suppliers
                    .filter((s) => s.isActive !== false)
                    .map((s) => ({
                      value: s.id,
                      label: `${s.name}${s.expectedPayment ? ` (Est. $${s.expectedPayment})` : ''}`,
                    })),
                ]}
              />
            </div>
          </div>

          {/* ALERTA DE TICKET PREVIO DETECTADO */}
          {activeSupplierTicket && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-amber-900 dark:text-amber-200 truncate">
                    Ticket pendiente detectado: ${activeSupplierTicket.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 truncate">
                    {activeSupplierTicket.notes || 'Preventa agendada para hoy'}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10.5px] h-8 rounded-xl px-3 cursor-pointer shrink-0 shadow-xs"
                onClick={() => handleApplyTicket(activeSupplierTicket)}
              >
                Liquidar Ticket
              </Button>
            </div>
          )}

          {/* MONTO A PAGAR (MODO EXPRESS) */}
          {mode === 'EXPRESS' ? (
            <div className="space-y-1.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                Monto a Pagar ($) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <Input
                  ref={amountInputRef}
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11 h-13 text-2xl font-black text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                  required
                />
              </div>
            </div>
          ) : (
            /* MODO DETALLADO: PRODUCTOS + TOTAL */
            <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Desglose de Artículos Surtidos
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Total Factura: ${calculatedTotal.toFixed(2)}
                </span>
              </div>

              {/* Agregar fila de producto */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <CustomSelect
                    className="h-9 text-xs"
                    value={selectedAddProdId}
                    onChange={(val) => {
                      setSelectedAddProdId(val);
                      const prod = products.find((p) => p.id === val);
                      if (prod) setAddCost(prod.purchasePrice);
                    }}
                    placeholder="Elegir producto..."
                    options={[
                      { value: '', label: 'Elegir producto...' },
                      ...products.map((p) => ({ value: p.id, label: `${p.name} ($${p.purchasePrice})` })),
                    ]}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Cant."
                    className="h-9 text-xs font-bold rounded-xl"
                    value={addQty || ''}
                    onChange={(e) => setAddQty(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Costo"
                    className="h-9 text-xs font-bold rounded-xl"
                    value={addCost || ''}
                    onChange={(e) => setAddCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddDetailedProduct}
                    className="h-9 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lista de productos agregados */}
              {detailedItems.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {detailedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {item.productName}
                      </span>
                      <div className="flex items-center gap-2 font-black">
                        <span className="text-slate-500">
                          {item.quantity} x ${item.costPrice.toFixed(2)}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100">
                          ${(item.quantity * item.costPrice).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailedProduct(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORIGEN DEL PAGO (CAJA CHICA / CAJA GRANDE / CRÉDITO) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider block">
              Origen del Dinero *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentSource('CAJA_CHICA')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all cursor-pointer text-center',
                  paymentSource === 'CAJA_CHICA'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                )}
              >
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-black">Caja Chica</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  {isRegisterOpen ? 'Turno en curso' : 'Sin turno'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSource('CAJA_GRANDE')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all cursor-pointer text-center',
                  paymentSource === 'CAJA_GRANDE'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                )}
              >
                <Landmark className="h-4 w-4" />
                <span className="text-xs font-black">Caja Grande</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  ${vaultBalance.toLocaleString('es-MX', { minimumFractionDigits: 0 })} disp.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSource('CREDITO')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all cursor-pointer text-center',
                  paymentSource === 'CREDITO'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-500 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-black">Crédito / Otro</span>
                <span className="text-[9px] font-semibold text-slate-400">Sin salida efec.</span>
              </button>
            </div>
          </div>

          {/* NOTAS / NÚMERO DE NOTA O FACTURA */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider block">
              Folio / Referencia / Comentarios (Opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej. Nota de remisión #1029, Factura bimbo, Pan dulce del día..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* BOTÓN PRINCIPAL DE ACCIÓN */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl font-bold text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || calculatedTotal <= 0 || !selectedSupplierId}
              className="h-11 px-6 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  <span>Procesando Pago...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  <span>
                    Confirmar Pago de ${calculatedTotal > 0 ? calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
