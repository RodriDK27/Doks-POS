import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { Sale } from '../types';

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

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error('Error fetching sales history:', error);
        toast.error('No se pudo cargar el historial de ventas.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'NONE') {
      void fetchSales();
    }
  }, [role, fetchSales]);

  // Resetear a página 1 cuando cambia la búsqueda o filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDateFilter]);

  const handlePrint = () => {
    window.print();
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
    setSearchQuery,
    selectedDateFilter,
    setSelectedDateFilter,
    selectedSale,
    setSelectedSale,
    isTicketOpen,
    setIsTicketOpen,
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
