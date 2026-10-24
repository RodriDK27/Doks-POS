import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { Sale, SaleReturnResult } from '../types';

export function useTickets() {
  const { role } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'>('TODAY');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal de previsualización de ticket
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  // Devolución/cambio y corrección de método de pago del ticket seleccionado
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);

  const fetchSales = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get<Sale[]>('/sales');
      setSales(response.data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error('Error fetching sales history:', error);
        toast.error('No se pudo cargar el historial de ventas.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // `loading` ya arranca en true, así que la carga inicial no necesita volver a encenderlo
  useEffect(() => {
    if (role !== 'NONE') {
      void Promise.resolve().then(() => fetchSales(true));
    }
  }, [role, fetchSales]);

  // Resetear a página 1 cuando cambia la búsqueda o filtro
  const changeSearchQuery = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const changeDateFilter = (filter: 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK') => {
    setSelectedDateFilter(filter);
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const openReturn = () => {
    setIsTicketOpen(false);
    setIsReturnOpen(true);
  };

  const openPaymentMethod = () => {
    setIsTicketOpen(false);
    setIsPaymentMethodOpen(true);
  };

  // Recarga el historial y vuelve a mostrar el ticket ya actualizado
  const reopenUpdatedTicket = async (saleId: number) => {
    const fresh = await fetchSales(true);
    const updated = fresh?.find((s) => s.id === saleId);
    if (updated) {
      setSelectedSale(updated);
      setIsTicketOpen(true);
    }
  };

  const handleReturnCompleted = (result: SaleReturnResult) => {
    if (result.replacementSaleId) {
      if (result.difference > 0) {
        toast.success(`Cambio registrado. El cliente paga la diferencia: $${result.difference.toFixed(2)}`, { duration: 10000 });
      } else if (result.difference < 0) {
        toast.success(`Cambio registrado. Regrese al cliente: $${Math.abs(result.difference).toFixed(2)}`, { duration: 10000 });
      } else {
        toast.success('Cambio registrado sin diferencia de precio.');
      }
    } else {
      toast.success(`Devolución registrada. Regrese al cliente: $${result.refund.toFixed(2)}`, { duration: 10000 });
    }
    if (selectedSale) void reopenUpdatedTicket(selectedSale.id);
  };

  const handlePaymentMethodChanged = (updatedSale: Sale) => {
    toast.success(`Ticket #${updatedSale.id} ahora está registrado como ${updatedSale.paymentMethod.toLowerCase()}.`);
    void reopenUpdatedTicket(updatedSale.id);
  };

  const filteredSales = sales.filter(s => {
    const folioStr = `#${s.id}`;
    const customerName = s.customer?.name.toLowerCase() || 'público general';
    const matchesSearch = 
      folioStr.includes(searchQuery) ||
      s.id.toString().includes(searchQuery) ||
      customerName.includes(searchQuery.toLowerCase()) ||
      s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

    const saleDate = new Date(s.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const activeDateFilter = role === 'ADMIN' ? selectedDateFilter : 'TODAY';

    let matchesDate = true;
    if (activeDateFilter === 'TODAY') {
      matchesDate = saleDate >= today;
    } else if (activeDateFilter === 'YESTERDAY') {
      matchesDate = saleDate >= yesterday && saleDate < today;
    } else if (selectedDateFilter === 'WEEK') {
      matchesDate = saleDate >= weekAgo;
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    sales,
    loading,
    searchQuery,
    setSearchQuery: changeSearchQuery,
    selectedDateFilter,
    setSelectedDateFilter: changeDateFilter,
    selectedSale,
    setSelectedSale,
    isTicketOpen,
    setIsTicketOpen,
    isReturnOpen,
    setIsReturnOpen,
    isPaymentMethodOpen,
    setIsPaymentMethodOpen,
    openReturn,
    openPaymentMethod,
    handleReturnCompleted,
    handlePaymentMethodChanged,
    handlePrint,
    filteredSales,
    paginatedSales,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages
  };
}
