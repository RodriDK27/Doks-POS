'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Activity, 
  CheckSquare,
  CreditCard,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useDashboard } from './hooks/useDashboard';
import { DashboardStatsGrid } from './components/DashboardStats';
import { ActivityFeed } from './components/ActivityFeed';
import { RestockQtyDialog } from './components/RestockQtyDialog';
import { CustomerAbonoDialog } from './components/CustomerAbonoDialog';

import PinLockGuard from '@/components/PinLockGuard';

interface PointType {
  x: number;
  y: number;
  day: string;
  amount: number;
}

export default function DashboardPage() {
  const {
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
    updateSalesGoal,
    todayEarnings,
    goalPercentage,
    handleRestockSubmit,
    handleAbonoSubmit,
  } = useDashboard();

  // Estados locales de interactividad
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '¡Buenos días, equipo! ☀️';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes! 🌤️';
    return '¡Buenas noches! 🌙';
  };
  const [hoveredPoint, setHoveredPoint] = useState<PointType | null>(null);

  // Sincronizar input de meta cuando cargue el hook
  useEffect(() => {
    Promise.resolve().then(() => {
      setGoalInput(salesGoal.toString());
    });
  }, [salesGoal]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(goalInput);
    if (!isNaN(val) && val > 0) {
      updateSalesGoal(val);
      setIsEditingGoal(false);
    }
  };

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between h-[212px]">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Tendencia Semanal</span>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">Ventas de los Últimos 7 Días</h3>
          </div>
          <span className="text-[10px] text-slate-450 font-bold bg-slate-50/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
            Máx: ${maxAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="w-full mt-2 h-28 relative">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} className="stroke-slate-100 dark:stroke-slate-800/60" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} className="stroke-slate-100 dark:stroke-slate-800/60" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" vectorEffect="non-scaling-stroke" />

            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                className="stroke-indigo-600 dark:stroke-indigo-400" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                vectorEffect="non-scaling-stroke"
              />
            )}

            {points.map((p, i) => (
              <g key={i} className="group/point" onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  className="fill-white dark:fill-slate-900 stroke-indigo-600 dark:stroke-indigo-400 cursor-pointer transition-all duration-150 group-hover/point:r-7" 
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </svg>

          {/* Tooltip Glassmorphic Flotante */}
          {hoveredPoint && (
            <div 
              className="absolute z-30 pointer-events-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl p-2.5 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{ 
                left: `${(hoveredPoint.x / chartWidth) * 100}%`, 
                top: `${(hoveredPoint.y / chartHeight) * 100 - 32}%`,
                transform: 'translateX(-50%) translateY(-50%)'
              }}
            >
              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">{hoveredPoint.day}</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-0.5">${hoveredPoint.amount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between px-3 mt-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">
          {weeklySalesData.map((d, i) => (
            <span key={i}>{d.day}</span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <PinLockGuard>
      <div className="space-y-6 w-full pb-6">
        
        {/* HEADER PRINCIPAL CON BOTONES DE ACCIÓN RÁPIDA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
              {getGreeting()}
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Panel de Control</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentTime && (
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/60 px-3 py-2 rounded-xl shadow-xs self-center">
                {currentTime}
              </span>
            )}
            <Link href={activeRegister ? "/pos" : "/register"}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95">
                Ir a Vender
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-none">
                Ver Utilidades
              </Button>
            </Link>
          </div>
        </div>

        {/* FILA 1: KPIs DE UN VISTAZO */}
        <DashboardStatsGrid 
          activeRegister={activeRegister} 
          stats={stats} 
          todayEarnings={todayEarnings}
          goalPercentage={goalPercentage}
          salesGoal={salesGoal}
          isEditingGoal={isEditingGoal}
          setIsEditingGoal={setIsEditingGoal}
          goalInput={goalInput}
          setGoalInput={setGoalInput}
          handleSaveGoal={handleSaveGoal}
        />

        {/* FILA 2: ANÁLISIS SEMANAL Y ACTIVIDADES RECIENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico Semanal (Col-span 2) */}
          <div className="lg:col-span-2">
            {renderWeeklyChart()}
          </div>

          {/* Actividades Recientes (Col-span 1) */}
          <div className="lg:col-span-1">
            <div className="space-y-3.5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Actividades Recientes</h3>
                </div>
                <Link href="/tickets" className="text-[10px] font-extrabold text-indigo-655 dark:text-indigo-400 hover:underline uppercase tracking-wide">
                  Ver Todos
                </Link>
              </div>
              
              <div className="flex-1 min-h-[172px]">
                {timelineEvents.length > 0 ? (
                  <ActivityFeed timelineEvents={timelineEvents} />
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 text-center text-[10px] text-slate-400 h-full flex items-center justify-center">
                    No hay actividad registrada el día de hoy.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* FILA 3: OPERACIONES RÁPIDAS (Bajo Stock y Clientes Deudores) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TARJETA DE REABASTECIMIENTO RÁPIDO */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Catálogo - Stock Crítico</h3>
              </div>
              <Badge className="bg-amber-100 text-amber-650 dark:bg-amber-955/35 dark:text-amber-400 border-none font-bold text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                {lowStockProducts.length} Alertas
              </Badge>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">{product.name}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Stock: <strong>{product.stock}</strong> (mín. {product.minStock})</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedProduct(product);
                        setRestockQty(10);
                        setIsRestockOpen(true);
                      }}
                      className="border-slate-150/80 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 h-7.5 rounded-xl text-[9px] font-extrabold shrink-0 px-2.5 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1 text-slate-500" /> Surtir
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 py-4 text-center font-medium">No hay productos con stock crítico. ¡Todo al día!</p>
            )}
          </div>

          {/* TARJETA DE COBRO A CLIENTES RÁPIDO */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Cuentas Fiadas Activas</h3>
              </div>
              <Badge className="bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 border-none font-bold text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                {debtors.length} Deudores
              </Badge>
            </div>

            {debtors.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {debtors.slice(0, 3).map((customer) => (
                  <div key={customer.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">{customer.name}</span>
                      <span className="text-[9px] text-rose-505 font-bold block mt-0.5">Saldo: ${customer.currentDebt.toFixed(2)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setAbonoAmount(customer.currentDebt);
                        setAbonoNotes('');
                        setIsAbonoOpen(true);
                      }}
                      className="border-slate-150/80 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 h-7.5 rounded-xl text-[9px] font-extrabold shrink-0 px-2.5 transition-colors cursor-pointer"
                    >
                      <DollarSign className="h-3 w-3 mr-0.5 text-slate-500" /> Cobrar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 py-4 text-center font-medium">No hay clientes con deuda activa. ¡Cuentas claras!</p>
            )}
          </div>

        </div>

        {/* FILA 4: GUÍA DE CONFIGURACIÓN RÁPIDA (Solo si no hay eventos y la caja está cerrada) */}
        {timelineEvents.length === 0 && !activeRegister && (
          <div className="border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">Guía de Configuración Inicial</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">Sigue estos pasos rápidos para empezar a vender.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <Link href="/inventory" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">1. Catálogo</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
              <Link href="/register" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">2. Abrir Caja</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
              <Link href="/pos" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">3. Vender</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
              <Link href="/customers" className="group">
                <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">4. Clientes</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            </div>
          </div>
        )}

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
    </PinLockGuard>
  );
}
