'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PinLockGuard from '@/components/PinLockGuard';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Percent, 
  Coins, 
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface BestSeller {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

interface ProfitReportData {
  totalRevenue: number;
  totalCost: number;
  totalDiscount: number;
  totalProfit: number;
  paymentDistribution: Record<string, number>;
  bestSellers: BestSeller[];
}

type PeriodFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export default function ReportsPage() {
  const [report, setReport] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('TODAY');

  // Rango de fechas personalizado
  const [dates, setDates] = useState({
    startDate: '',
    endDate: '',
  });

  const getDatesForPeriod = (selectedPeriod: PeriodFilter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start: Date;
    let end = new Date();

    switch (selectedPeriod) {
      case 'TODAY':
        start = today;
        break;
      case 'WEEK':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'MONTH':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'CUSTOM':
        return {
          startDate: dates.startDate || undefined,
          endDate: dates.endDate || undefined,
        };
    }

    // Formatear a YYYY-MM-DD
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    };
  };

  const loadReport = async (selectedPeriod: PeriodFilter = period) => {
    try {
      setLoading(true);
      const params = getDatesForPeriod(selectedPeriod);
      
      const response = await api.get('/sales/profit-report', { params });
      setReport(response.data);
    } catch (error) {
      console.error('Error loading profit report:', error);
      toast.error('No se pudo cargar el reporte de utilidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'CUSTOM') {
      loadReport(period);
    }
  }, [period]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dates.startDate || !dates.endDate) {
      toast.error('Por favor, selecciona fecha de inicio y fin.');
      return;
    }
    loadReport('CUSTOM');
  };

  const totalSales = report?.totalRevenue || 0;
  const totalCost = report?.totalCost || 0;
  const netProfit = report?.totalProfit || 0;
  const totalDiscount = report?.totalDiscount || 0;

  // Rendimiento (Margen neto total de la tienda en este periodo)
  const profitMarginPercent = totalSales > 0 
    ? (netProfit / totalSales) * 100 
    : 0;

  return (
    <PinLockGuard>
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        
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
              className={`h-10 text-xs font-bold rounded-xl active:scale-95 transition-all ${
                period === btn.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-slate-200 text-slate-600'
              }`}
              onClick={() => setPeriod(btn.id as PeriodFilter)}
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
              className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold h-10 px-5 rounded-xl w-full sm:w-auto"
            >
              Aplicar Filtro
            </Button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Cargando reporte de rentabilidad...</div>
      ) : (
        <>
          {/* TARJETAS MÉTRICAS DE RENTABILIDAD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* UTILIDAD NETA (LA GANANCIA LIMPIA) */}
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
                <span className="text-lg font-black text-slate-800 block mt-1">${totalSales.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block">Facturación total neta</span>
              </CardContent>
            </Card>

            {/* COSTO DE COMPRA (INVERSIÓN RECUPERADA) */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Costo de Mercancía</span>
                <span className="text-lg font-black text-slate-800 block mt-1">${totalCost.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block">Inversión a reabastecer</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* DESGLOSE METODOS DE PAGO Y DESCUENTOS (2/3 ANCHO) */}
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
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
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

            {/* ARTÍCULOS MÁS RENTABLES (1/3 ANCHO) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-indigo-600" /> Productos Más Rentables
              </h3>

              <div className="space-y-3">
                {report && report.bestSellers && report.bestSellers.length > 0 ? (
                  report.bestSellers.map((item, index) => (
                    <div 
                      key={item.name} 
                      className="border border-slate-100 rounded-2xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">
                            {item.quantity} unidades vendidas
                          </span>
                        </div>
                        <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
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
                  <div className="border border-slate-100 rounded-2xl p-6 bg-white text-center text-slate-400 text-xs">
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
