'use client';

import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight, 
  Activity, 
  CheckSquare,
  Package,
  TrendingDown,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useDashboard } from './hooks/useDashboard';
import { DashboardStatsGrid } from './components/DashboardStats';
import { ActivityFeed } from './components/ActivityFeed';
import { RestockQtyDialog } from './components/RestockQtyDialog';
import { CustomerAbonoDialog } from './components/CustomerAbonoDialog';

export default function DashboardPage() {
  const {
    role,
    stats,
    lowStockProducts,
    debtors,
    activeRegister,
    timelineEvents,
    loading,
    selectedProduct,
    setSelectedProduct,
    restockQty,
    setRestockQty,
    isRestockOpen,
    setIsRestockOpen,
    selectedCustomer,
    setSelectedCustomer,
    abonoAmount,
    setAbonoAmount,
    abonoNotes,
    setAbonoNotes,
    isAbonoOpen,
    setIsAbonoOpen,
    currentTime,
    weeklySalesData,
    salesGoal,
    todayEarnings,
    goalPercentage,
    handleRestockSubmit,
    handleAbonoSubmit,
  } = useDashboard();

  const renderWeeklyChart = () => {
    const maxAmount = Math.max(...weeklySalesData.map(d => d.amount), 500);
    const chartHeight = 120;
    const chartWidth = 500;
    const padding = 20;

    const points = weeklySalesData.map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / 6;
      const y = chartHeight - padding - (d.amount * (chartHeight - padding * 2)) / maxAmount;
      return { x, y, day: d.day, amount: d.amount };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
      : '';

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Tendencia Semanal</span>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">Ventas de los Últimos 7 Días</h3>
        </div>

        <div className="w-full mt-4 h-32 relative">
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                className="stroke-indigo-600 dark:stroke-indigo-400" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {points.map((p, i) => (
              <g key={i} className="group/point">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  className="fill-white dark:fill-slate-900 stroke-indigo-600 dark:stroke-indigo-400 cursor-pointer transition-all duration-150 hover:r-5" 
                  strokeWidth="2"
                />
                <text 
                  x={p.x} 
                  y={p.y - 8} 
                  textAnchor="middle" 
                  className="text-[8px] font-bold fill-slate-700 dark:fill-slate-350 opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none"
                >
                  ${p.amount.toFixed(0)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between px-3 mt-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
          {weeklySalesData.map((d, i) => (
            <span key={i}>{d.day}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Resumen Diario
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
        </div>
        {currentTime && (
          <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border px-3 py-1.5 rounded-xl shadow-xs self-start sm:self-center">
            {currentTime}
          </span>
        )}
      </div>

      {/* SECCIÓN BIENVENIDA / VENTAS DIARIAS */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/10 text-slate-800 dark:text-slate-100 rounded-2xl p-5 border border-indigo-100/50 dark:border-indigo-900/30 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.06)] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-indigo-600" />
        </div>

        <div className="space-y-3.5 max-w-md relative z-10 text-center md:text-left">
          <div>
            <Badge className="bg-indigo-100 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-wider py-0.5 px-2">
              Progreso Diario
            </Badge>
            <h2 className="text-lg font-bold tracking-tight text-slate-850 dark:text-slate-150 mt-2">Ventas de Hoy</h2>
            <p className="text-xs text-slate-450 mt-0.5 leading-normal">
              Acumulado de caja actual frente a la meta diaria de ${salesGoal} MXN.
            </p>
          </div>

          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">${todayEarnings.toFixed(2)}</span>
            <span className="text-xs font-bold text-indigo-650 flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> {goalPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="flex gap-2 justify-center md:justify-start">
            <Link href={activeRegister ? "/pos" : "/register"}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-4 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer">
                Ir a Vender
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-extrabold text-xs h-10 px-4 rounded-xl active:scale-95 transition-all cursor-pointer shadow-none">
                Ver Utilidades
              </Button>
            </Link>
          </div>
        </div>

        {/* MEDIDOR RADIAL */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="38" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
            <circle 
              cx="48" 
              cy="48" 
              r="38" 
              className="stroke-indigo-600 transition-all duration-1000 ease-out" 
              strokeWidth="5" 
              fill="transparent"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - goalPercentage / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{goalPercentage.toFixed(0)}%</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold">Meta</span>
          </div>
        </div>
      </div>

      {/* TENDENCIA SEMANAL */}
      {renderWeeklyChart()}

      {/* METRICAS CLAVE */}
      <DashboardStatsGrid activeRegister={activeRegister} stats={stats} />

      {/* SECCIÓN INFERIOR: ACTIVIDAD RECIENTE / GUÍA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-655 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Actividades Recientes</h3>
          </div>
          <Link href="/tickets" className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 hover:underline uppercase tracking-wide">
            Ver Todos
          </Link>
        </div>

        {timelineEvents.length > 0 ? (
          <ActivityFeed timelineEvents={timelineEvents} />
        ) : (
          /* GUÍA DE INICIO RÁPIDO */
          <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Guía de Configuración Inicial</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">Sigue estos pasos rápidos para empezar a vender.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Link href="/inventory" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-605/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">1</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registrar Catálogo</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/register" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-605/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">2</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Abrir Turno de Caja</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/pos" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-605/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">3</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hacer Venta de Prueba</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/customers" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-605/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">4</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registrar Clientes</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* DIÁLOGOS DE CONTROL RÁPIDO */}
      <RestockQtyDialog
        open={isRestockOpen}
        onOpenChange={setIsRestockOpen}
        selectedProduct={selectedProduct}
        restockQty={restockQty}
        setRestockQty={setRestockQty}
        onSubmit={handleRestockSubmit}
      />

      <CustomerAbonoDialog
        open={isAbonoOpen}
        onOpenChange={setIsAbonoOpen}
        selectedCustomer={selectedCustomer}
        abonoAmount={abonoAmount}
        setAbonoAmount={setAbonoAmount}
        abonoNotes={abonoNotes}
        setAbonoNotes={setAbonoNotes}
        onSubmit={handleAbonoSubmit}
      />

    </div>
  );
}
