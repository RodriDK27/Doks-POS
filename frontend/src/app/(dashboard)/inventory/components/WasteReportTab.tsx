'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomSelect } from '@/components/CustomSelect';
import { AlertTriangle, UtensilsCrossed, RefreshCw, CalendarX, Package, TrendingDown } from 'lucide-react';

interface WasteMovement {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  costValue: number;
  sellValue: number;
  product: {
    id: string;
    name: string;
    barcode: string | null;
    purchasePrice: number;
    sellPrice: number;
    category: string | null;
  };
}

interface WasteReportData {
  movements: WasteMovement[];
  totalCostLost: number;
  totalSalesLost: number;
}

const typeBadges: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  CONSUMO_INTERNO: {
    label: 'Consumo Interno',
    class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-none',
    icon: UtensilsCrossed,
  },
  MERMA_ROTO: {
    label: 'Dañado / Roto',
    class: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-none',
    icon: AlertTriangle,
  },
  MERMA_CADUCADO: {
    label: 'Caducado',
    class: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-none',
    icon: CalendarX,
  },
  DEVOLUCION: {
    label: 'Devolución',
    class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-none',
    icon: RefreshCw,
  },
};

export function WasteReportTab() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));

  const { data, isLoading } = useSWR<WasteReportData>(`/products/waste/report?month=${selectedMonth}`);


  const currentYear = new Date().getFullYear();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(12 - i).padStart(2, '0');
    const date = new Date(currentYear, 11 - i, 1);
    const monthName = date.toLocaleString('es-ES', { month: 'long' });
    return {
      value: `${currentYear}-${monthNum}`,
      label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentYear}`,
    };
  });

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* TARJETAS RESUMEN DE PÉRDIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Registros</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{data?.movements.length || 0}</span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Costo de Pérdida (Costo)</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ${(data?.totalCostLost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Valor Comercial No Realizado</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ${(data?.totalSalesLost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
      <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs font-bold text-slate-500">Historial de Salidas Especiales de Inventario</span>
          <CustomSelect
            className="w-48 h-8 text-[11px] font-bold"
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
          />
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : data?.movements && data.movements.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-500">Fecha y Hora</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Tipo / Motivo</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">Cant.</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">Valor Costo</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 pl-6">Detalles / Responsable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {data.movements.map((mov) => {
                const badgeInfo = typeBadges[mov.type] || {
                  label: mov.type,
                  class: 'bg-slate-100 text-slate-700',
                  icon: Package,
                };
                const Icon = badgeInfo.icon;

                return (
                  <TableRow key={mov.id} className="hover:bg-slate-50/40">
                    <TableCell className="text-xs text-slate-500">
                      {new Date(mov.createdAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      {new Date(mov.createdAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                        {mov.product?.name || 'Producto eliminado'}
                      </span>
                      {mov.product?.category && (
                        <span className="text-[9px] text-slate-400 font-medium">{mov.product.category}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className={`text-[9px] font-bold px-2 py-0.5 flex items-center gap-1 w-max ${badgeInfo.class}`}>
                        <Icon className="h-3 w-3" />
                        {badgeInfo.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-black text-xs text-slate-700 dark:text-slate-200">
                      {Math.abs(mov.quantity)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs text-slate-600 dark:text-slate-300">
                      ${mov.costValue.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 pl-6 max-w-xs truncate">
                      {mov.reason || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            No se han registrado mermas o consumos en el periodo seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}
