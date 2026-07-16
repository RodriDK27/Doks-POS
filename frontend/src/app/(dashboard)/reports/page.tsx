'use client';

import React from 'react';
import PinLockGuard from '@/components/PinLockGuard';
import { 
  ArrowLeft, 
  TrendingUp, 
  Percent, 
  Sparkles, 
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';

import { useReports } from './hooks/useReports';

export default function ReportsPage() {
  const {
    report,
    loading,
    period,
    setPeriod,
    dates,
    setDates,
    totalSales,
    totalCost,
    netProfit,
    totalDiscount,
    profitMarginPercent,
    handleCustomFilterSubmit
  } = useReports();

  return (
    <PinLockGuard>
      <div className="space-y-6 max-w-5xl mx-auto pb-8 animate-in fade-in duration-200">
        
        {/* HEADER DE NAVEGACIÓN */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Regresar al Dashboard
          </Link>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
              Métricas de Rentabilidad
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reporte de Utilidades</h1>
          </div>
        </div>

        {/* FILTROS TÁCTILES RÁPIDOS */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'TODAY', label: 'Ventas de Hoy' },
              { id: 'WEEK', label: 'Últimos 7 Días' },
              { id: 'MONTH', label: 'Este Mes' },
              { id: 'CUSTOM', label: 'Rango Personalizado' },
            ].map((btn) => (
              <Button
                key={btn.id}
                variant={period === btn.id ? 'default' : 'outline'}
                className={`h-10 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer ${
                  period === btn.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-slate-200 text-slate-605'
                }`}
                onClick={() => setPeriod(btn.id as any)}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Formulario Rango Personalizado */}
          {period === 'CUSTOM' && (
            <form onSubmit={handleCustomFilterSubmit} className="flex flex-col sm:flex-row items-end gap-3 pt-2 text-xs border-t border-slate-50">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Fecha Inicial</label>
                <Input
                  type="date"
                  required
                  className="h-10 rounded-xl border-slate-200 text-xs"
                  value={dates.startDate}
                  onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Fecha Final</label>
                <Input
                  type="date"
                  required
                  className="h-10 rounded-xl border-slate-200 text-xs"
                  value={dates.endDate}
                  onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
                />
              </div>
              <Button 
                type="submit" 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold h-10 px-5 rounded-xl w-full sm:w-auto cursor-pointer"
              >
                Aplicar Filtro
              </Button>
            </form>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-2xl col-span-2" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="border border-slate-100 rounded-2xl bg-white p-5 space-y-4 shadow-xs">
                  <Skeleton className="h-5 w-40" />
                  <div className="space-y-3 pt-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-2.5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
                <Skeleton className="h-16 rounded-2xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-2xl p-4 bg-white space-y-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 flex-1 pr-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-6 rounded-lg" />
                    </div>
                    <div className="flex justify-between border-t pt-2.5">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TARJETAS MÉTRICAS DE RENTABILIDAD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* UTILIDAD NETA */}
              <Card className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/20 border-emerald-100/50 rounded-2xl shadow-sm col-span-2">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <TrendingUp className="h-28 w-28 text-emerald-600" />
                  </div>
                  <div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[8px] uppercase tracking-wider py-0.5 px-2">
                      Dinero Libre (Take Home)
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-2.5">Ganancia Neta Limpia</h3>
                    <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">
                      Utilidad real generada restando el costo de compra a las ventas totales de este periodo.
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-emerald-600 tracking-tight">
                      ${netProfit.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3.5 w-3.5" /> {profitMarginPercent.toFixed(0)}% margen
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* VENTAS BRUTAS */}
              <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ingresos de Venta</span>
                  <span className="text-lg font-black text-slate-855 block mt-1">${totalSales.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block">Facturación total neta</span>
                </CardContent>
              </Card>

              {/* COSTO DE COMPRA */}
              <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Costo de Mercancía</span>
                  <span className="text-lg font-black text-slate-855 block mt-1">${totalCost.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block">Inversión a reabastecer</span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* DESGLOSE METODOS DE PAGO Y DESCUENTOS */}
              <div className="md:col-span-2 space-y-6">
                
                {/* COMPOSICIÓN DE COBROS */}
                <Card className="border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-xs font-bold text-slate-850">Composición de Cobros</CardTitle>
                    <CardDescription className="text-[9px]">Distribución de los ingresos según el método de pago</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4 text-xs">
                    {report && Object.entries(report.paymentDistribution).map(([method, amount]) => {
                      const percent = totalSales > 0 ? (amount / totalSales) * 100 : 0;
                      return (
                        <div key={method} className="space-y-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-slate-700">
                              {method === 'EFECTIVO' ? 'Efectivo' : method === 'TARJETA' ? 'Tarjeta de Débito/Crédito' : method === 'TRANSFERENCIA' ? 'Transferencia Bancaria' : 'Fiado (Crédito de Confianza)'}
                            </span>
                            <div className="flex gap-2 font-black text-slate-800">
                              <span>${amount.toFixed(2)}</span>
                              <span className="text-indigo-600">({percent.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-indigo-650" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* RESUMEN DE DESCUENTOS */}
                <div className="border border-slate-100 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Descuentos Directos Aplicados</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Dinero descontado en tickets para fidelizar clientes.</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-slate-700">
                    -${totalDiscount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ARTÍCULOS MÁS RENTABLES */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-indigo-600" /> Productos Más Rentables
                </h3>

                <div className="space-y-3">
                  {report && report.bestSellers && report.bestSellers.length > 0 ? (
                    report.bestSellers.map((item, index) => (
                      <div 
                        key={item.name} 
                        className="border border-slate-100 rounded-2xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3 animate-in fade-in duration-200"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">
                              {item.quantity} unidades vendidas
                            </span>
                          </div>
                          <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-650 text-[10px] font-black flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 font-semibold block">Ventas</span>
                            <span className="font-bold text-slate-600">${item.revenue.toFixed(0)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-600 font-semibold block">Ganancia Libre</span>
                            <span className="font-black text-emerald-600">${item.profit.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-slate-100 rounded-2xl p-6 bg-white text-center text-slate-400 text-xs animate-pulse">
                      No hay suficientes ventas registradas para este periodo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PinLockGuard>
  );
}
