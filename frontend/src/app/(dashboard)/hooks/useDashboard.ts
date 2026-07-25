import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { parseAxiosError } from '@/lib/errorMapper';

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
  transactions?: Transaction[];
}

interface Transaction {
  id: string;
  type: 'INGRESO' | 'EGRESO';
  amount: number;
  description: string;
  createdAt: string;
}

interface Sale {
  id: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
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
  const [sales, setSales] = useState<Sale[]>([]);

  // Acciones rápidas
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<DebtorCustomer | null>(null);
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoNotes, setAbonoNotes] = useState<string>('');
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [salesGoal, setSalesGoal] = useState<number>(5000);

  // Inicializar meta desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGoal = localStorage.getItem('doks_sales_goal');
      if (savedGoal) {
        Promise.resolve().then(() => {
          setSalesGoal(Number(savedGoal));
        });
      }
    }
  }, []);

  const updateSalesGoal = (newGoal: number) => {
    setSalesGoal(newGoal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doks_sales_goal', newGoal.toString());
    }
    toast.success(`Meta de ventas diarias actualizada a $${newGoal.toLocaleString('es-MX')}`);
  };

  const fetchDashboardData = useCallback(async () => {
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
      
      const debtorClients = (customersRes.data as DebtorCustomer[]).filter((c) => c.currentDebt > 0);
      setDebtors(debtorClients.slice(0, 4));

      setActiveRegister(registerRes.data);

      // CONSTRUIR UN FEED DE ACTIVIDAD INTEGRADO Y CRONOLÓGICO
      const events: FeedEvent[] = [];

      // 1. Agregar las últimas ventas al feed
      const salesData = (salesRes.data as Sale[]).slice(0, 5);
      salesData.forEach((s) => {
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
      const activeRegData = registerRes.data as ActiveRegister | null;
      if (activeRegData && activeRegData.transactions) {
        activeRegData.transactions.slice(0, 3).forEach((t) => {
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
      const lowStockData = lowStockRes.data as LowStockProduct[];
      lowStockData.slice(0, 2).forEach((p) => {
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
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error loading dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'ADMIN') {
      Promise.resolve().then(() => {
        fetchDashboardData();
      });
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [role, fetchDashboardData]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) + ' • ' + now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    };
    Promise.resolve().then(() => {
      updateClock();
    });
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
      toast.error(parseAxiosError(error, 'Error al actualizar inventario.'));
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
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al procesar abono.'));
    }
  };

  const weeklySalesData = useMemo(() => {
    const daysName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    
    // Crear los 7 días (del más antiguo al día de hoy)
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      return {
        dateStr: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        day: daysName[d.getDay()],
        amount: 0,
      };
    });

    const dayMap = new Map<string, number>();
    data.forEach((d, idx) => dayMap.set(d.dateStr, idx));

    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      const key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}-${saleDate.getDate()}`;
      if (dayMap.has(key)) {
        const idx = dayMap.get(key)!;
        data[idx].amount += sale.total;
      }
    });

    return data.map(({ day, amount }) => ({ day, amount }));
  }, [sales]);

  const todayEarnings = stats?.earningsToday || 0;
  const goalPercentage = Math.min(100, salesGoal > 0 ? (todayEarnings / salesGoal) * 100 : 0);

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
    setConfirmNewPin: () => {}, // placeholder to match signature if needed
    setAbonoNotes,
    isAbonoOpen,
    setIsAbonoOpen,
    currentTime,
    weeklySalesData,
    salesGoal,
    updateSalesGoal,
    todayEarnings,
    goalPercentage,
    fetchDashboardData,
    handleRestockSubmit,
    handleAbonoSubmit,
  };
}
