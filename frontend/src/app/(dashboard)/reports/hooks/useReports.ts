import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ProfitReportData } from '../types';

export type PeriodFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export function useReports() {
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
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Error loading profit report:', error);
        toast.error('No se pudo cargar el reporte de utilidades.');
      }
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

  const profitMarginPercent = totalSales > 0 
    ? (netProfit / totalSales) * 100 
    : 0;

  return {
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
    loadReport,
    handleCustomFilterSubmit
  };
}
