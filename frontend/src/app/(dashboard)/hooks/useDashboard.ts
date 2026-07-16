import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface DashboardStats {
  earningsToday: number;
  salesCountToday: number;
  methodsDistribution: Record<string, number>;
  productsCount: number;
  lowStockCount: number;
  debtorCustomers: number;
  totalActiveCredit: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  category: string | null;
  sellPrice: number;
}

export interface DebtorCustomer {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
  phone: string | null;
}

export interface ActiveRegister {
  id: string;
  openedBy: string;
  initialBalance: number;
  expectedBalance: number;
  openedAt: string;
}

export interface FeedEvent {
  id: string;
  time: string;
  type: 'SALE' | 'TRANSACTION' | 'ALERT' | 'CREDIT';
  title: string;
  description: string;
  amount?: number;
  badgeText?: string;
  isNegative?: boolean;
}

export function useDashboard() {
  const { role } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [debtors, setDebtors] = useState<DebtorCustomer[]>([]);
  const [activeRegister, setActiveRegister] = useState<ActiveRegister | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);

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
      setSales(salesRes.data);
      
      const debtorClients = customersRes.data.filter((c: any) => c.currentDebt > 0);
      setDebtors(debtorClients.slice(0, 4));

      setActiveRegister(registerRes.data);

      // CONSTRUIR UN FEED DE ACTIVIDAD INTEGRADO Y CRONOLÓGICO
      const events: FeedEvent[] = [];

      // 1. Agregar las últimas ventas al feed
      const salesData = salesRes.data.slice(0, 5);
      salesData.forEach((s: any) => {
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

      setTimelineEvents(events.slice(0, 6)); 
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Error loading dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'NONE') {
      fetchDashboardData();
    }
  }, [role]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) + ' • ' + now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
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

  const weeklySalesData = useMemo(() => {
    const daysName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: daysName[d.getDay()],
        amount: 0,
      };
    });

    sales.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const diffTime = today.getTime() - saleDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const dayIndex = 6 - diffDays;
        if (data[dayIndex]) {
          data[dayIndex].amount += sale.total;
        }
      }
    });

    return data;
  }, [sales]);

  const salesGoal = 5000; 
  const todayEarnings = stats?.earningsToday || 0;
  const goalPercentage = Math.min(100, (todayEarnings / salesGoal) * 100);

  return {
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
    fetchDashboardData,
    handleRestockSubmit,
    handleAbonoSubmit,
  };
}
