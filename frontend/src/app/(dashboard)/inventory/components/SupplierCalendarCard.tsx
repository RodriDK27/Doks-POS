'use client';

import React from 'react';
import useSWR from 'swr';
import { Calendar, Truck, AlertTriangle, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const orderList = data?.orderSuppliers || [];
  const deliveryList = data?.deliverySuppliers || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Calendario de Visitas
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Hoy es {data?.todayName}
            </h3>
          </div>
        </div>

        {data && data.lowStockCount > 0 && (
          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40 text-[10px] font-bold px-2.5 py-1">
            <AlertTriangle className="h-3 w-3 mr-1 text-rose-500" /> {data.lowStockCount} con Stock Bajo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Proveedores que toman pedido hoy */}
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2.5 text-indigo-600 dark:text-indigo-400">
            <Truck className="h-4 w-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Toma Pedido Hoy</span>
          </div>

          {orderList.length > 0 ? (
            <div className="space-y-1.5">
              {orderList.map((sup) => (
                <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-3 py-2 rounded-lg shadow-2xs">
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
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2.5 text-emerald-600 dark:text-emerald-400">
            <PackageCheck className="h-4 w-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Entrega / Surtido Hoy</span>
          </div>

          {deliveryList.length > 0 ? (
            <div className="space-y-1.5">
              {deliveryList.map((sup) => {
                const activeTicket = sup.pendingTickets && sup.pendingTickets.length > 0 ? sup.pendingTickets[0] : null;
                return (
                  <div key={sup.id} className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-3 py-2 rounded-lg shadow-2xs">
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
  );
}
