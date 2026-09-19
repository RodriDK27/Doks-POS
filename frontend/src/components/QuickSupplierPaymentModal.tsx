'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Truck,
  DollarSign,
  Wallet,
  Landmark,
  CheckCircle2,
  Search,
  Loader2,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { Supplier } from '@/app/(dashboard)/inventory/types';

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

interface FormContentProps {
  onOpenChange: (open: boolean) => void;
  preselectedSupplierId?: string | null;
  preselectedTicket?: PendingTicket | null;
  onSuccess?: () => void;
}

function QuickSupplierPaymentForm({
  onOpenChange,
  preselectedSupplierId = null,
  preselectedTicket = null,
  onSuccess,
}: FormContentProps) {
  const { data: suppliers = [] } = useSWR<Supplier[]>('/suppliers');
  const { data: pendingTickets = [] } = useSWR<PendingTicket[]>('/suppliers/pending-tickets/active');
  const { data: vaultData } = useSWR('/vault');
  const { data: registerData } = useSWR('/register/active');

  const vaultBalance = vaultData?.vault?.balance ?? 0;
  const isRegisterOpen = registerData && registerData.status === 'ABIERTO';

  // Estados del formulario inicializados directamente en el montaje
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    return preselectedTicket?.supplier?.id || preselectedSupplierId || '';
  });
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const [paymentSource, setPaymentSource] = useState<'CAJA_GRANDE' | 'CAJA_CHICA'>('CAJA_GRANDE');

  const [amount, setAmount] = useState<string>(() => {
    return preselectedTicket ? String(preselectedTicket.amount) : '';
  });

  const [notes, setNotes] = useState<string>(() => {
    if (preselectedTicket?.notes) return `Liquidación ticket: ${preselectedTicket.notes}`;
    if (preselectedTicket) return 'Liquidación de ticket previo';
    return '';
  });

  const [settleTicketId, setSettleTicketId] = useState<string | null>(() => {
    return preselectedTicket?.id || null;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-foco inteligente al abrir
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedSupplierId) {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      } else {
        searchInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedSupplierId]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Proveedores filtrados en tiempo real según la búsqueda
  const filteredSuppliers = useMemo(() => {
    const active = suppliers.filter((s) => s.isActive !== false);
    const query = supplierSearchQuery.trim().toLowerCase();
    if (!query) return active.slice(0, 8);
    return active.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 10);
  }, [suppliers, supplierSearchQuery]);

  // Ticket pendiente del proveedor seleccionado
  const activeSupplierTicket = useMemo(() => {
    if (!selectedSupplierId) return null;
    return pendingTickets.find(
      (t) => t.supplier.id === selectedSupplierId && (t.status === 'PENDING' || !t.status)
    ) || null;
  }, [selectedSupplierId, pendingTickets]);

  const numericAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) ? 0 : val;
  }, [amount]);

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setSupplierSearchQuery('');
    setIsDropdownOpen(false);

    // Si tiene ticket pendiente y no se ha ingresado monto, autollenar
    const ticket = pendingTickets.find(
      (t) => t.supplier.id === supplier.id && (t.status === 'PENDING' || !t.status)
    );
    if (ticket && !amount) {
      setAmount(String(ticket.amount));
      setSettleTicketId(ticket.id);
      if (ticket.notes) setNotes(`Liquidación ticket: ${ticket.notes}`);
    }

    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 50);
  };

  const handleClearSelectedSupplier = () => {
    setSelectedSupplierId('');
    setSupplierSearchQuery('');
    setSettleTicketId(null);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filteredSuppliers.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredSuppliers.length) % (filteredSuppliers.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuppliers[highlightedIndex]) {
        handleSelectSupplier(filteredSuppliers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleApplyTicket = (ticket: PendingTicket) => {
    setAmount(String(ticket.amount));
    setSettleTicketId(ticket.id);
    if (ticket.notes) setNotes(`Liquidación ticket: ${ticket.notes}`);
    toast.info(`Monto ajustado al ticket: $${ticket.amount}`);
    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error('Por favor selecciona el proveedor que recibe el pago.');
      searchInputRef.current?.focus();
      return;
    }

    if (numericAmount <= 0) {
      toast.error('Por favor ingresa un monto válido mayor a $0.');
      amountInputRef.current?.focus();
      return;
    }

    if (paymentSource === 'CAJA_CHICA' && !isRegisterOpen) {
      toast.error('La Caja Chica no está abierta en este turno. Elige Caja Grande o abre turno.');
      return;
    }

    if (paymentSource === 'CAJA_GRANDE' && vaultBalance < numericAmount) {
      toast.error(`Saldo insuficiente en Caja Grande ($${vaultBalance.toFixed(2)}) para cubrir $${numericAmount.toFixed(2)}.`);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        supplierId: selectedSupplierId,
        paymentSource,
        payFromRegister: paymentSource === 'CAJA_CHICA',
        total: numericAmount,
        notes: notes.trim() || undefined,
        settleTicketId: settleTicketId || undefined,
      };

      await api.post('/purchases', payload);

      const sourceLabel =
        paymentSource === 'CAJA_GRANDE' ? 'Caja Grande' : 'Caja Chica';

      toast.success(
        `¡Pago de $${numericAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} registrado a ${selectedSupplier?.name || 'proveedor'} (${sourceLabel})!`,
        { duration: 4000 }
      );

      // Actualizar información en tiempo real
      await Promise.allSettled([
        mutate('/purchases'),
        mutate('/suppliers'),
        mutate('/suppliers/pending-tickets/active'),
        mutate('/suppliers/pending-tickets/history'),
        mutate('/register/active'),
        mutate('/register'),
        mutate('/vault'),
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
    <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
      {/* HEADER SIN LÍNEAS SEPARADORAS - ICONO Y TEXTO ARMONIZADOS */}
      <DialogHeader className="p-0 space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-xs">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
              Pago a Proveedor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Salida rápida de dinero para mercancía o preventa en 1 paso.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-3">
        {/* 1. SELECCIÓN DE PROVEEDOR (BUSCADOR RÁPIDO) */}
        <div className="space-y-1.5" ref={searchContainerRef}>
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
            Proveedor *
          </label>

          {selectedSupplier ? (
            /* PROVEEDOR SELECCIONADO ARMONIZADO */
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {selectedSupplier.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                    {selectedSupplier.expectedPayment
                      ? `Pago esperado: $${selectedSupplier.expectedPayment.toLocaleString('es-MX')}`
                      : 'Proveedor activo'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearSelectedSupplier}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-xs font-bold cursor-pointer"
                title="Cambiar de proveedor"
              >
                <X className="h-3.5 w-3.5" />
                <span className="text-[11px]">Cambiar</span>
              </button>
            </div>
          ) : (
            /* INPUT DE BÚSQUEDA */
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe para buscar proveedor..."
                  value={supplierSearchQuery}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setHighlightedIndex(0);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 pr-8 h-11 text-xs font-bold rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                />
                {supplierSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* DROPDOWN DE SUGERENCIAS */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((sup, idx) => {
                      const hasTicket = pendingTickets.some(
                        (t) => t.supplier.id === sup.id && (t.status === 'PENDING' || !t.status)
                      );
                      const isHighlighted = highlightedIndex === idx;

                      return (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => handleSelectSupplier(sup)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={cn(
                            'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs',
                            isHighlighted
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-bold truncate">{sup.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                            {hasTicket && (
                              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-black">
                                Ticket pendiente
                              </span>
                            )}
                            {sup.expectedPayment && (
                              <span className="text-slate-400 font-semibold">
                                Est. ${sup.expectedPayment}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No se encontró ningún proveedor con &ldquo;{supplierSearchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ALERTA DE TICKET DETECTADO */}
        {activeSupplierTicket && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <Tag className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-900 dark:text-amber-200 truncate">
                  Ticket pendiente: ${activeSupplierTicket.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 truncate">
                  {activeSupplierTicket.notes || 'Preventa o entrega registrada'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-black text-[10.5px] h-8 rounded-xl px-3 cursor-pointer shrink-0 shadow-xs"
              onClick={() => handleApplyTicket(activeSupplierTicket)}
            >
              Liquidar Ticket
            </Button>
          </div>
        )}

        {/* 2. ORIGEN DEL DINERO (ARRIBA DEL MONTO) - CAJA GRANDE PRIMERO */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
            Origen del Dinero *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentSource('CAJA_GRANDE')}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all cursor-pointer text-center',
                paymentSource === 'CAJA_GRANDE'
                  ? 'bg-emerald-500/10 border-emerald-500/70 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Landmark className="h-4 w-4" />
              <span className="text-xs font-black">Caja Grande</span>
              <span className="text-[10px] font-semibold text-slate-400">
                ${vaultBalance.toLocaleString('es-MX', { minimumFractionDigits: 0 })} disp.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentSource('CAJA_CHICA')}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all cursor-pointer text-center',
                paymentSource === 'CAJA_CHICA'
                  ? 'bg-emerald-500/10 border-emerald-500/70 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-black">Caja Chica</span>
              <span className="text-[10px] font-semibold text-slate-400">
                {isRegisterOpen ? 'Turno en curso' : 'Sin turno'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. MONTO A PAGAR (ABAJO DEL ORIGEN) - SIN CAJA ENVOLVENTE ANIDADA */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
            Monto a Pagar ($) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <Input
              ref={amountInputRef}
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 h-12 text-2xl font-black text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              required
            />
          </div>

          {paymentSource === 'CAJA_GRANDE' && numericAmount > vaultBalance && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 dark:text-rose-400 pt-0.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Saldo insuficiente en Caja Grande (${vaultBalance.toFixed(2)} disponible).</span>
            </div>
          )}

          {paymentSource === 'CAJA_CHICA' && !isRegisterOpen && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 dark:text-amber-400 pt-0.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Turno de caja cerrado. Abre caja o usa Caja Grande.</span>
            </div>
          )}
        </div>

        {/* 4. NOTAS / FOLIO O REFERENCIA */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
            Folio / Referencia / Comentarios (Opcional)
          </label>
          <Input
            type="text"
            placeholder="Ej. Factura #8920, Pan dulce, Hielo, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-11 text-xs font-bold rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
          />
        </div>

        {/* 5. BOTONES DE ACCIÓN (SIN LÍNEA SEPARADORA - COLORES ARMONIZADOS) */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 px-5 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || numericAmount <= 0 || !selectedSupplierId}
            className={cn(
              'h-11 px-6 rounded-2xl text-xs transition-all',
              numericAmount > 0 && selectedSupplierId && !isSubmitting
                ? 'font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95'
                : 'font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-80'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                <span>
                  Confirmar Pago de ${numericAmount > 0 ? numericAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'}
                </span>
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export function QuickSupplierPaymentModal({
  open,
  onOpenChange,
  preselectedSupplierId = null,
  preselectedTicket = null,
  onSuccess,
}: QuickSupplierPaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <QuickSupplierPaymentForm
          onOpenChange={onOpenChange}
          preselectedSupplierId={preselectedSupplierId}
          preselectedTicket={preselectedTicket}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
}
