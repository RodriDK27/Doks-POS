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
      <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Catálogo</span>
          <span className="text-xl font-black text-slate-800 block mt-1">{totalProductsCount}</span>
          <span className="text-[9px] text-slate-400 block">Artículos distintos</span>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Inversión Neta</span>
          <span className="text-xl font-black text-slate-800 block mt-1">${totalInvestment.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 block">Costo de adquisición</span>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ganancia Estimada</span>
          <span className="text-xl font-black text-indigo-650 block mt-1">${expectedProfit.toFixed(0)}</span>
          <span className="text-[9px] text-slate-400 block">Margen potencial</span>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bajo Stock</span>
          <span className={`text-xl font-black block mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
            {lowStockCount}
          </span>
          <span className="text-[9px] text-slate-400 block">Artículos agotándose</span>
        </CardContent>
      </Card>
    </div>
  );
}
