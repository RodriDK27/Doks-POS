import React from 'react';
import { DollarSign, Users, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActiveRegister, DashboardStats } from '../hooks/useDashboard';

interface DashboardStatsProps {
  activeRegister: ActiveRegister | null;
  stats: DashboardStats | null;
}

export function DashboardStatsGrid({ activeRegister, stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* EFECTIVO EN CAJA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block">Dinero en Caja</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">
              ${activeRegister ? activeRegister.expectedBalance.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${activeRegister ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-500 dark:bg-rose-950/20'}`}>
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800/80 text-[10px]">
          <span className="text-slate-400">Cajero: <strong className="text-slate-700 dark:text-slate-300 font-bold">{activeRegister ? activeRegister.openedBy : 'Ninguno'}</strong></span>
          <Badge variant="outline" className={`text-[8px] font-bold border-none px-2 py-0.5 rounded-md ${activeRegister ? 'bg-emerald-105 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-105 text-rose-700 dark:bg-rose-950 dark:text-rose-450'}`}>
            {activeRegister ? 'Abierto' : 'Cerrado'}
          </Badge>
        </div>
      </div>

      {/* FIADOS POR COBRAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Por Cobrar (Fiados)</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">
              ${stats?.totalActiveCredit.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-50 dark:border-slate-800/80 text-[10px] text-slate-400">
          <span>{stats?.debtorCustomers || 0} clientes deudores activos</span>
        </div>
      </div>

      {/* PRODUCTOS BAJOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Stock Crítico</span>
            <span className={`text-2xl font-black mt-1 block ${stats?.lowStockCount && stats.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {stats?.lowStockCount || 0}
            </span>
          </div>
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${stats?.lowStockCount && stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-500 dark:bg-amber-955/20' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-50 dark:border-slate-800/80 text-[10px] text-slate-400">
          <span>Artículos por agotarse pronto</span>
        </div>
      </div>
    </div>
  );
}
