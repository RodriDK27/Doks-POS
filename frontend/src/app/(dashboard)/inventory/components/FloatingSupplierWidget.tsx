'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, Truck, PackageCheck, Wallet, X, AlertTriangle, ChevronRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface PendingTicket {
  id: string;
  amount: number;
  scheduledDate?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  supplier: { id: string; name: string };
}

interface SupplierScheduleData {
  todayName: string;
  orderSuppliers: Array<{ id: string; name: string; phone?: string }>;
  deliverySuppliers: Array<{
    id: string;
    name: string;
    phone?: string;
    pendingTickets?: Array<{ id: string; amount: number; notes?: string }>;
  }>;
  lowStockCount: number;
}

interface FloatingSupplierWidgetProps {
  onOpenPayTicket?: (ticket: PendingTicket) => void;
  onCancelTicket?: (id: string) => Promise<void>;
}

export function FloatingSupplierWidget({
  onOpenPayTicket,
  onCancelTicket,
}: FloatingSupplierWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'VISITS'>('TICKETS');

  const { data: scheduleData } = useSWR<SupplierScheduleData>('/suppliers/schedule/today');
  const { data: pendingTickets, mutate: mutateTickets } = useSWR<PendingTicket[]>('/suppliers/pending-tickets/active');

  const orderList = scheduleData?.orderSuppliers || [];
  const deliveryList = scheduleData?.deliverySuppliers || [];
  const activeTicketsList = pendingTickets || [];

  const totalBadgeCount = activeTicketsList.length + orderList.length + deliveryList.length;

  return (
    <>
      {/* 1. BOTÓN CIRCULAR FLOTANTE (FAB) AJUSTADO PARA TABLETS Y MÓVILES SIN RECORTES */}
      <div className="fixed bottom-28 right-6 sm:bottom-32 sm:right-10 md:right-12 lg:bottom-6 lg:right-10 z-[55] w-14 h-14 pointer-events-auto shrink-0 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center cursor-pointer border-2 border-white/20 active:scale-95 transition-colors duration-150 shrink-0",
            isOpen
              ? "bg-slate-900 dark:bg-slate-800 border-slate-700 shadow-slate-950/70"
              : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          )}
          title="Proveedores y Tickets de Hoy"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white shrink-0" />
          ) : (
            <div className="relative flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6" />
              {activeTicketsList.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-ping" />
              )}
            </div>
          )}

          {/* BADGE DE CANTIDAD */}
          {!isOpen && totalBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md animate-bounce">
              {totalBadgeCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. PANEL DESPLEGABLE ADAPTADO CON MARGEN DERECHO HOLGADO */}
      {isOpen && (
        <div className="fixed bottom-[180px] right-4 sm:bottom-[196px] sm:right-10 md:right-12 lg:bottom-24 lg:right-10 z-50 w-[92vw] sm:w-[420px] max-h-[58vh] sm:max-h-[70vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
          
          {/* HEADER DEL PANEL SIN DEGRADADO */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight flex items-center gap-2 text-slate-850 dark:text-slate-100">
                  Proveedores y Tickets
                  {activeTicketsList.length > 0 && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded-full">
                      {activeTicketsList.length} PENDIENTES
                    </span>
                  )}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                  Hoy es {scheduleData?.todayName || 'hoy'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* TABS NAVEGACIÓN DENTRO DEL FLOATING PANEL */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('TICKETS')}
              className={cn(
                "py-2 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === 'TICKETS'
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-800/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Tag className="h-3.5 w-3.5" /> Tickets x Pagar ({activeTicketsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('VISITS')}
              className={cn(
                "py-2 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === 'VISITS'
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-800/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Calendar className="h-3.5 w-3.5" /> Visitas de Hoy ({orderList.length + deliveryList.length})
            </button>
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[55vh]">
            {activeTab === 'TICKETS' ? (
              activeTicketsList.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Tickets de Preventa Esperando Pago
                  </div>
                  {activeTicketsList.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-black text-xs text-slate-800 dark:text-slate-100 block">
                            {t.supplier.name}
                          </span>
                          {t.notes && (
                            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 block">
                              {t.notes}
                            </span>
                          )}
                          <span className="text-[9.5px] text-slate-400 block mt-0.5">
                            Entrega: {t.scheduledDate || 'Hoy'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                            ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* BOTONES DE ACCIÓN RÁPIDA: PAGAR / CANCELAR */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-8 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenPayTicket?.(t);
                          }}
                        >
                          Pagar Ticket (${t.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })})
                        </Button>

                        {onCancelTicket && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-[11px] h-8 px-3 rounded-xl cursor-pointer shrink-0"
                            onClick={async () => {
                              await onCancelTicket(t.id);
                              void mutateTickets();
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">¡Al día! Sin tickets pendientes</p>
                  <p className="text-[11px] text-slate-400 font-medium">No hay pagos de preventa registrados pendientes de liquidar.</p>
                </div>
              )
            ) : (
              /* TAB VISITAS DE HOY */
              <div className="space-y-3">
                {/* TOMA PEDIDO */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <Truck className="h-4 w-4" /> Toma Pedido Hoy ({orderList.length})
                  </div>
                  {orderList.length > 0 ? (
                    <div className="space-y-1.5">
                      {orderList.map((sup) => (
                        <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-800 px-3 py-2 rounded-xl">
                          <span>{sup.name}</span>
                          {sup.phone && <span className="text-[10px] text-slate-400 font-normal">{sup.phone}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sin proveedores anotados para pedido hoy.</p>
                  )}
                </div>

                {/* SURTIDO / ENTREGA */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <PackageCheck className="h-4 w-4" /> Surtido / Entrega Hoy ({deliveryList.length})
                  </div>
                  {deliveryList.length > 0 ? (
                    <div className="space-y-1.5">
                      {deliveryList.map((sup) => (
                        <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-800 px-3 py-2 rounded-xl">
                          <span>{sup.name}</span>
                          <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/40">Entrega</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sin entregas programadas para hoy.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
