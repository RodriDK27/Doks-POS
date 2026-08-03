import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';

interface InventoryMetricsProps {
  totalProductsCount: number;
  totalInvestment: number;
  expectedProfit: number;
  lowStockCount: number;
}

export function InventoryMetrics({
  totalProductsCount,
  totalInvestment,
  expectedProfit,
  lowStockCount,
}: InventoryMetricsProps) {
  const { role } = useAuthStore();

  return (
    <div className={`grid gap-2.5 sm:gap-3.5 ${role === 'ADMIN' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200">
        <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Catálogo</span>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block">{totalProductsCount}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">Artículos distintos</span>
        </CardContent>
      </Card>

      {role === 'ADMIN' && (
        <>
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200">
            <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Inversión Neta</span>
              <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block">${totalInvestment.toFixed(0)}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">Costo de adquisición</span>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200">
            <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ganancia Estimada</span>
              <span className="text-lg sm:text-xl font-black text-indigo-650 dark:text-indigo-400 block">${expectedProfit.toFixed(0)}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">Margen potencial</span>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-2xs hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-200">
        <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Bajo Stock</span>
          <span className={`text-lg sm:text-xl font-black block ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {lowStockCount}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">Artículos agotándose</span>
        </CardContent>
      </Card>
    </div>
  );
}

