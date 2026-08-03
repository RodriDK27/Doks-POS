'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, Truck, AlertTriangle, PackageCheck, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number }>;
}

export function SupplierCalendarCard() {
  const { data, isLoading } = useSWR<SupplierScheduleData>('/suppliers/schedule/today');
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-3 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const orderList = data?.orderSuppliers || [];
  const deliveryList = data?.deliverySuppliers || [];
  const hasActivity = orderList.length > 0 || deliveryList.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
      {/* BANNER TIPO NOTIFICACIÓN COMPACTO */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 select-none transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Bell className="h-4 w-4" />
            </div>
            {hasActivity && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <span className="font-extrabold text-xs text-slate-850 dark:text-slate-100 whitespace-nowrap">
              Visitas de Hoy ({data?.todayName}):
            </span>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {hasActivity ? (
                <>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{orderList.length} toma pedido</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{deliveryList.length} entrega</span>
                </>
              ) : (
                <span className="italic text-slate-400">Sin visitas programadas para hoy</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {data && data.lowStockCount > 0 && (
            <Badge variant="outline" className="hidden sm:inline-flex bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40 text-[9.5px] font-bold px-2 py-0.5">
              <AlertTriangle className="h-3 w-3 mr-1 text-rose-500" /> {data.lowStockCount} Stock Bajo
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Ocultar' : 'Ver detalle'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* DETALLE EXPANDIBLE CUANDO SE PRESIONA */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Proveedores que toman pedido hoy */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 mb-2.5 text-indigo-600 dark:text-indigo-400">
                <Truck className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Toma Pedido Hoy</span>
              </div>

              {orderList.length > 0 ? (
                <div className="space-y-1.5">
                  {orderList.map((sup) => (
                    <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/80 px-3 py-2 rounded-lg">
                      <span>{sup.name}</span>
                      {sup.phone && <span className="text-[10px] text-slate-400 font-normal">{sup.phone}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium italic">Sin proveedores programados para tomar pedido hoy.</p>
              )}
            </div>

            {/* Proveedores que surten mercancía hoy */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 mb-2.5 text-emerald-600 dark:text-emerald-400">
                <PackageCheck className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">Entrega / Surtido Hoy</span>
              </div>

              {deliveryList.length > 0 ? (
                <div className="space-y-1.5">
                  {deliveryList.map((sup) => {
                    const activeTicket = sup.pendingTickets && sup.pendingTickets.length > 0 ? sup.pendingTickets[0] : null;
                    return (
                      <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/80 px-3 py-2 rounded-lg">
                        <div className="flex flex-col">
                          <span>{sup.name}</span>
                          {activeTicket?.notes && <span className="text-[9.5px] text-slate-400 font-normal">{activeTicket.notes}</span>}
                        </div>
                        {activeTicket ? (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 px-2.5 py-1 rounded-md font-black">
                            Ticket: ${activeTicket.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-bold">
                            Pago al Entregar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium italic">Sin entregas programadas para hoy.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
