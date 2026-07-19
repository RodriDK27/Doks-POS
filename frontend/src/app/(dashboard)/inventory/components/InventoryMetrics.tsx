import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300">
        <CardContent className="p-5 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Catálogo</span>
          <span className="text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">{totalProductsCount}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Artículos distintos</span>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300">
        <CardContent className="p-5 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Inversión Neta</span>
          <span className="text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">${totalInvestment.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Costo de adquisición</span>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300">
        <CardContent className="p-5 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ganancia Estimada</span>
          <span className="text-xl font-black text-indigo-650 dark:text-indigo-400 block mt-1">${expectedProfit.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Margen potencial</span>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300">
        <CardContent className="p-5 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Bajo Stock</span>
          <span className={`text-xl font-black block mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {lowStockCount}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Artículos agotándose</span>
        </CardContent>
      </Card>
    </div>
  );
}
