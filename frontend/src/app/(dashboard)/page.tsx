'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Package,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
  CircleAlert,
  ArrowRight,
  CheckSquare,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import Link from 'next/link';

interface DashboardStats {
  earningsToday: number;
  salesCountToday: number;
  methodsDistribution: Record<string, number>;
  productsCount: number;
  lowStockCount: number;
  debtorCustomers: number;
  totalActiveCredit: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  category: string | null;
  sellPrice: number;
}

interface DebtorCustomer {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
  phone: string | null;
}

interface ActiveRegister {
  id: string;
  openedBy: string;
  initialBalance: number;
  expectedBalance: number;
  openedAt: string;
}

interface FeedEvent {
  id: string;
  time: string;
  type: 'SALE' | 'TRANSACTION' | 'ALERT' | 'CREDIT';
  title: string;
  description: string;
  amount?: number;
  badgeText?: string;
  isNegative?: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [debtors, setDebtors] = useState<DebtorCustomer[]>([]);
  const [activeRegister, setActiveRegister] = useState<ActiveRegister | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Acciones rápidas
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<DebtorCustomer | null>(null);
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoNotes, setAbonoNotes] = useState<string>('');
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, lowStockRes, customersRes, registerRes, salesRes] = await Promise.all([
        api.get('/sales/dashboard-stats'),
        api.get('/products/low-stock'),
        api.get('/customers'),
        api.get('/register/active'),
        api.get('/sales'),
      ]);
      
      setStats(statsRes.data);
      setLowStockProducts(lowStockRes.data);
      
      const debtorClients = customersRes.data.filter((c: any) => c.currentDebt > 0);
      setDebtors(debtorClients.slice(0, 4));

      setActiveRegister(registerRes.data);

      // CONSTRUIR UN FEED DE ACTIVIDAD INTEGRADO Y CRONOLÓGICO
      const events: FeedEvent[] = [];

      // 1. Agregar las últimas ventas al feed (Usando s.id en lugar de s.folio para corregir el bug #undefined)
      const sales = salesRes.data.slice(0, 5);
      sales.forEach((s: any) => {
        events.push({
          id: `sale-${s.id}`,
          time: new Date(s.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          type: 'SALE',
          title: `Ticket #${s.id} cobrado`,
          description: `Vendido por ${s.paymentMethod.toLowerCase()}`,
          amount: s.total,
          badgeText: s.paymentMethod,
        });
      });

      // 2. Agregar transacciones de caja de la sesión activa
      if (registerRes.data && registerRes.data.transactions) {
        registerRes.data.transactions.slice(0, 3).forEach((t: any) => {
          events.push({
            id: `trans-${t.id}`,
            time: new Date(t.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            type: 'TRANSACTION',
            title: t.description,
            description: t.type === 'EGRESO' ? 'Retiro manual de caja' : 'Ingreso manual de caja',
            amount: Math.abs(t.amount),
            badgeText: t.type,
            isNegative: t.amount < 0,
          });
        });
      }

      // 3. Agregar alertas de stock
      lowStockRes.data.slice(0, 2).forEach((p: any) => {
        events.push({
          id: `alert-${p.id}`,
          time: 'Alerta',
          type: 'ALERT',
          title: `Bajo stock: ${p.name}`,
          description: `Disponibles: ${p.stock} de ${p.minStock} mínimo`,
          badgeText: p.stock === 0 ? 'AGOTADO' : 'CRÍTICO',
          isNegative: true,
        });
      });

      // Ordenar por hora (excepto las alertas fijas que van al inicio)
      setTimelineEvents(events.slice(0, 6)); 
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) + ' • ' + now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, []);

  const handleRestockSubmit = async () => {
    if (!selectedProduct || restockQty <= 0) return;
    try {
      await api.patch(`/products/${selectedProduct.id}`, {
        stock: selectedProduct.stock + restockQty,
      });
      toast.success(`Inventario de "${selectedProduct.name}" actualizado.`);
      setIsRestockOpen(false);
      setSelectedProduct(null);
      setRestockQty(0);
      fetchDashboardData();
    } catch (error) {
      toast.error('Error al actualizar inventario.');
    }
  };

  const handleAbonoSubmit = async () => {
    if (!selectedCustomer || abonoAmount <= 0) return;
    try {
      await api.post(`/customers/${selectedCustomer.id}/abono`, {
        amount: abonoAmount,
        notes: abonoNotes.trim() || 'Abono rápido desde panel',
      });
      toast.success(`Abono por $${abonoAmount.toFixed(2)} registrado.`);
      setIsAbonoOpen(false);
      setSelectedCustomer(null);
      setAbonoAmount(0);
      setAbonoNotes('');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar abono.');
    }
  };

  const salesGoal = 5000; 
  const todayEarnings = stats?.earningsToday || 0;
  const goalPercentage = Math.min(100, (todayEarnings / salesGoal) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      
      {/* HEADER PRINCIPAL MÓVIL */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
          Resumen Diario
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
      </div>

      {/* SECCIÓN BIENVENIDA / VENTAS DIARIAS (DISEÑO BLANCO / INDIGO SUAVE) */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 text-slate-800 rounded-2xl p-5 border border-indigo-100/50 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.06)] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-indigo-600" />
        </div>

        <div className="space-y-3.5 max-w-md relative z-10 text-center md:text-left">
          <div>
            <Badge className="bg-indigo-100 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-wider py-0.5 px-2">
              Progreso Diario
            </Badge>
            <h2 className="text-lg font-bold tracking-tight text-slate-800 mt-2">Ventas de Hoy</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
              Acumulado de caja actual frente a la meta diaria de ${salesGoal} MXN.
            </p>
          </div>

          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-800">${todayEarnings.toFixed(2)}</span>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> {goalPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="flex gap-2 justify-center md:justify-start">
            <Link href={activeRegister ? "/pos" : "/register"}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-4 rounded-xl shadow-md active:scale-95 transition-all">
                Ir a Vender
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs h-10 px-4 rounded-xl active:scale-95 transition-all">
                Ver Utilidades
              </Button>
            </Link>
          </div>
        </div>

        {/* MEDIDOR RADIAL (DISEÑO BLANCO / INDIGO) */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="38" className="stroke-slate-100" strokeWidth="4" fill="transparent" />
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
            <span className="text-sm font-black text-slate-800">{goalPercentage.toFixed(0)}%</span>
            <span className="text-[8px] text-slate-400 uppercase font-bold">Meta</span>
          </div>
        </div>
      </div>

      {/* METRICAS DE VENTA, CAJA Y CRÉDITO (GRILLA MÓVIL) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* EFECTIVO EN CAJA */}
        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dinero en Caja</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-indigo-600">
                ${activeRegister ? activeRegister.expectedBalance.toFixed(2) : '0.00'}
              </span>
              <Badge variant="outline" className={activeRegister ? 'text-[9px] bg-emerald-50 text-emerald-600 border-none' : 'text-[9px] bg-rose-50 text-rose-600 border-none'}>
                {activeRegister ? 'Abierto' : 'Cerrado'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cajero: {activeRegister ? activeRegister.openedBy : 'Sin turno'}</p>
          </CardContent>
        </Card>

        {/* FIADOS POR COBRAR */}
        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Por Cobrar (Fiados)</span>
            <span className="text-xl font-black text-slate-800 block mt-1">
              ${stats?.totalActiveCredit.toFixed(2) || '0.00'}
            </span>
            <span className="text-[9px] text-slate-400 mt-1 block">{stats?.debtorCustomers || 0} clientes deudores</span>
          </CardContent>
        </Card>

        {/* PRODUCTOS BAJOS */}
        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Crítico</span>
            <span className={`text-xl font-black block mt-1 ${stats?.lowStockCount && stats.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
              {stats?.lowStockCount || 0}
            </span>
            <span className="text-[9px] text-slate-400 mt-1 block">Artículos por agotarse</span>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN OPERATIVA (STACKEADA PARA MÓVIL Y TABLET) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BITÁCORA OPERATIVA (HOY) */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actividades Recientes</h3>
            </div>
            <Link href="/tickets" className="text-[10px] font-extrabold text-indigo-600 hover:underline uppercase tracking-wide">
              Ver Todos
            </Link>
          </div>

          {timelineEvents.length > 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] divide-y divide-slate-100">
              {timelineEvents.map((event) => {
                const isNegative = event.isNegative || false;
                return (
                  <div key={event.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        event.type === 'SALE' 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : event.type === 'ALERT'
                          ? 'bg-rose-50 text-rose-500'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">{event.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{event.description}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 font-semibold">{event.time}</span>
                      {event.amount !== undefined && (
                        <span className={`text-xs font-black mt-0.5 ${isNegative ? 'text-rose-500' : 'text-slate-800'}`}>
                          {isNegative ? '-' : '+'}${event.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GUÍA DE INICIO RÁPIDO (SI EL NEGOCIO ESTÁ VACÍO / EVITA EL ESPACIO VACÍO EN BLANCO) */
            <div className="border border-slate-200 bg-white rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Guía de Configuración Inicial</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sigue estos pasos rápidos para empezar a vender.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Link href="/inventory" className="group">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-500">1</span>
                      <span className="text-xs font-bold text-slate-700">Registrar Catálogo</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>

                <Link href="/register" className="group">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-500">2</span>
                      <span className="text-xs font-bold text-slate-700">Abrir Turno de Caja</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>

                <Link href="/pos" className="group">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-500">3</span>
                      <span className="text-xs font-bold text-slate-700">Hacer Venta de Prueba</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>

                <Link href="/customers" className="group">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 hover:border-indigo-600/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-500">4</span>
                      <span className="text-xs font-bold text-slate-700">Registrar Clientes</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: ALERTAS DE ATENCIÓN */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas Urgentes</h3>
          </div>

          <div className="space-y-3">
            {/* Productos con bajo stock */}
            {lowStockProducts.slice(0, 2).map((product) => (
              <div 
                key={product.id} 
                className="border border-slate-100 rounded-2xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate block">{product.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">Bajo Stock</span>
                  </div>
                  <Badge variant={product.stock === 0 ? "destructive" : "outline"} className={product.stock === 0 ? "text-[8px]" : "text-amber-600 bg-amber-50 border-none text-[8px] font-bold"}>
                    {product.stock === 0 ? 'AGOTADO' : `${product.stock} disp.`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-semibold">Mínimo: {product.minStock}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg"
                    onClick={() => {
                      setSelectedProduct(product);
                      setRestockQty(5);
                      setIsRestockOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Reabastecer
                  </Button>
                </div>
              </div>
            ))}

            {/* Clientes deudores */}
            {debtors.slice(0, 2).map((customer) => (
              <div 
                key={customer.id} 
                className="border border-slate-100 rounded-2xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate block">{customer.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">Fiado Activo</span>
                  </div>
                  <span className="text-rose-500 text-xs font-black shrink-0">
                    ${customer.currentDebt.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-semibold">Límite: ${customer.creditLimit || 'N/A'}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setAbonoAmount(customer.currentDebt);
                      setAbonoNotes('');
                      setIsAbonoOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Abonar
                  </Button>
                </div>
              </div>
            ))}

            {/* Sugerencias de operación */}
            {lowStockProducts.length === 0 && debtors.length === 0 && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-indigo-50/30 flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Consejo Útil</h5>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">
                    Puedes consultar el total de tus ganancias y reportes de cortes de caja pasados ingresando a la sección de **Caja** en la barra inferior.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIÁLOGO REGISTRAR REABASTECIMIENTO RÁPIDO */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Abastecer Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">PRODUCTO</span>
                <span className="font-bold text-slate-800 block text-xs mt-1">{selectedProduct.name}</span>
                <div className="flex justify-between mt-3 text-xs font-semibold text-slate-500">
                  <span>Stock Actual: {selectedProduct.stock}</span>
                  <span>Mínimo: {selectedProduct.minStock}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad a Agregar</label>
                <Input
                  type="number"
                  step="any"
                  className="focus-visible:ring-indigo-500 font-bold text-base h-11"
                  value={restockQty || ''}
                  onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 10"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="text-xs" onClick={() => setIsRestockOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              disabled={restockQty <= 0}
              onClick={handleRestockSubmit}
            >
              Abastecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO REGISTRAR ABONO RÁPIDO */}
      <Dialog open={isAbonoOpen} onOpenChange={setIsAbonoOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Registrar Abono</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">CLIENTE</span>
                <span className="font-bold text-slate-800 block text-xs mt-1">{selectedCustomer.name}</span>
                <div className="flex justify-between mt-3 text-xs font-semibold">
                  <span className="text-slate-500">Deuda actual:</span>
                  <span className="text-rose-500 font-bold">${selectedCustomer.currentDebt.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Monto del Abono ($)</label>
                <Input
                  type="number"
                  step="any"
                  className="focus-visible:ring-indigo-500 font-bold text-lg text-indigo-600 h-11"
                  value={abonoAmount || ''}
                  onChange={(e) => setAbonoAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Notas</label>
                <Input
                  type="text"
                  placeholder="Ej. Pago en efectivo..."
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                  className="focus-visible:ring-indigo-500 h-10 text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="text-xs" onClick={() => setIsAbonoOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              disabled={abonoAmount <= 0}
              onClick={handleAbonoSubmit}
            >
              Registrar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
