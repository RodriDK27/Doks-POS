import React from 'react';
import { DollarSign, Users, Package, Edit2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActiveRegister, DashboardStats } from '../hooks/useDashboard';

interface DashboardStatsProps {
  activeRegister: ActiveRegister | null;
  stats: DashboardStats | null;
  todayEarnings: number;
  goalPercentage: number;
  salesGoal: number;
  isEditingGoal: boolean;
  setIsEditingGoal: (val: boolean) => void;
  goalInput: string;
  setGoalInput: (val: string) => void;
  handleSaveGoal: (e: React.FormEvent) => void;
}

export function DashboardStatsGrid({ 
  activeRegister, 
  stats,
  todayEarnings,
  goalPercentage,
  salesGoal,
  isEditingGoal,
  setIsEditingGoal,
  goalInput,
  setGoalInput,
  handleSaveGoal
}: DashboardStatsProps) {
  // Calcular porcentajes de distribución de métodos de pago
  const distribution = stats?.methodsDistribution || {};
  const distTotal = Object.values(distribution).reduce((a, b) => a + b, 0);
  const cashPct = distTotal > 0 ? ((distribution['EFECTIVO'] || 0) / distTotal) * 100 : 0;
  const cardPct = distTotal > 0 ? ((distribution['TARJETA'] || 0) / distTotal) * 100 : 0;
  const creditPct = distTotal > 0 ? ((distribution['FIADO'] || 0) / distTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      
      {/* CARD 1: VENTAS DE HOY */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Ventas de Hoy</span>
            <span className="text-xl font-black text-slate-850 dark:text-slate-105 mt-1 block truncate">
              ${todayEarnings.toFixed(2)}
            </span>
          </div>
          
          {/* MEDIDOR RADIAL EN MINIATURA */}
          <div className="relative flex items-center justify-center shrink-0 ml-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle cx="20" cy="20" r="16" className="stroke-slate-100 dark:stroke-slate-850" strokeWidth="2.5" fill="transparent" />
              <circle 
                cx="20" 
                cy="20" 
                r="16" 
                className={`transition-all duration-1000 ease-out ${
                  goalPercentage >= 100 
                    ? 'stroke-emerald-500' 
                    : goalPercentage >= 50 
                    ? 'stroke-indigo-650 dark:stroke-indigo-400' 
                    : 'stroke-amber-500'
                }`}
                strokeWidth="3" 
                fill="transparent"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - goalPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-[8px] font-black text-slate-800 dark:text-slate-200">
              {goalPercentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Barra de progreso segmentada de métodos de pago */}
        <div className="my-1.5">
          {distTotal > 0 ? (
            <div className="w-full flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {cashPct > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${cashPct}%` }} title={`Efectivo: ${cashPct.toFixed(0)}%`} />}
              {cardPct > 0 && <div className="bg-indigo-600 h-full" style={{ width: `${cardPct}%` }} title={`Tarjeta: ${cardPct.toFixed(0)}%`} />}
              {creditPct > 0 && <div className="bg-amber-500 h-full" style={{ width: `${creditPct}%` }} title={`Fiado: ${creditPct.toFixed(0)}%`} />}
            </div>
          ) : (
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          )}
        </div>

        {/* Meta editable en pie de tarjeta */}
        <div className="pt-2.5 border-t border-slate-100/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-500 min-h-[22px]">
          {isEditingGoal ? (
            <form onSubmit={handleSaveGoal} className="flex items-center gap-1 w-full justify-between">
              <span className="text-[9px] font-bold">Meta:</span>
              <input 
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-16 text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-600 dark:bg-slate-850"
                autoFocus
              />
              <div className="flex gap-0.5">
                <button type="submit" className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                  <Check className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => setIsEditingGoal(false)} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span>Meta: <strong className="text-slate-650 dark:text-slate-350 font-bold">${salesGoal.toLocaleString('es-MX')}</strong></span>
              <button onClick={() => setIsEditingGoal(true)} className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded transition-colors ml-1">
                <Edit2 className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: DINERO EN CAJA */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Dinero en Caja</span>
            <span className="text-xl font-black text-slate-850 dark:text-slate-105 mt-1 block truncate">
              ${activeRegister ? activeRegister.expectedBalance.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:scale-110 duration-300 ${activeRegister ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-500 dark:bg-rose-955/30'}`}>
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-100/60 dark:border-slate-800/80 text-[10px]">
          <span className="text-slate-400 truncate max-w-[65%]">Cajero: <strong className="text-slate-700 dark:text-slate-350 font-bold">{activeRegister ? activeRegister.openedBy : 'Ninguno'}</strong></span>
          <Badge variant="outline" className={`text-[8px] font-bold border-none px-2 py-0.5 rounded-lg shrink-0 ${activeRegister ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-400' : 'bg-rose-55 text-rose-700 dark:bg-rose-955/40 dark:text-rose-400'}`}>
            {activeRegister ? 'Abierto' : 'Cerrado'}
          </Badge>
        </div>
      </div>

      {/* CARD 3: FIADOS POR COBRAR */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Por Cobrar (Fiados)</span>
            <span className="text-xl font-black text-slate-850 dark:text-slate-105 mt-1 block truncate">
              ${stats?.totalActiveCredit.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:scale-110 duration-300">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100/60 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500">
          <span>{stats?.debtorCustomers || 0} clientes con deuda activa</span>
        </div>
      </div>

      {/* CARD 4: STOCK CRÍTICO */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Stock Crítico</span>
            <span className={`text-xl font-black mt-1 block truncate ${stats?.lowStockCount && stats.lowStockCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-850 dark:text-slate-105'}`}>
              {stats?.lowStockCount || 0}
            </span>
          </div>
          <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:scale-110 duration-300 ${stats?.lowStockCount && stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-500 dark:bg-amber-955/30' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>
            <Package className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100/60 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500">
          <span>Artículos por agotarse pronto</span>
        </div>
      </div>

    </div>
  );
}
