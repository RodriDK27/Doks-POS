'use client';

import React from 'react';
import { Star, TrendingDown, Inbox } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsTabProps {
  analytics: {
    topSelling: Array<{ id: string; name: string; stock: number; sellPrice: number; category: string | null; quantitySold: number; totalRevenue: number }>;
    slowMoving: Array<{ id: string; name: string; stock: number; sellPrice: number; category: string | null; quantitySold: number; totalRevenue: number }>;
  } | undefined;
  analyticsLoading: boolean;
}

export function AnalyticsTab({ analytics, analyticsLoading }: AnalyticsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUCTOS DE MAYOR VENTA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-905/30 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-100/50 dark:border-slate-900/30">
              <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Productos de Mayor Venta</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Top 10 Artículos con mayores ventas registradas</p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <Skeleton className="h-4.5 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : analytics?.topSelling && analytics.topSelling.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500">Vendidos</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500">Ingresos Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {analytics.topSelling.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                      <TableCell className="py-3">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">{p.category || 'Sin Categoría'}</span>
                      </TableCell>
                      <TableCell className="text-right font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        {p.quantitySold} uds.
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-800 dark:text-slate-100 text-xs">
                        ${p.totalRevenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <Inbox className="h-8 w-8 text-slate-350" />
              <span>No hay datos de ventas para mostrar los productos estrella.</span>
            </div>
          )}
        </div>

        {/* PRODUCTOS CON MENOS SALIDA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-905/30 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-100/50 dark:border-slate-900/30">
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Productos con Menos Salida</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Artículos sin movimiento o bajas ventas</p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <Skeleton className="h-4.5 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : analytics?.slowMoving && analytics.slowMoving.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500">Vendidos</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500">Stock Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {analytics.slowMoving.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                      <TableCell className="py-3">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">{p.category || 'Sin Categoría'}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-550 dark:text-slate-400 text-xs">
                        {p.quantitySold} uds.
                      </TableCell>
                      <TableCell className={`text-right font-black text-xs ${p.stock === 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {p.stock} unidades
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <Inbox className="h-8 w-8 text-slate-350" />
              <span>No hay productos registrados con baja salida (entre 1 y 4 ventas).</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
