import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { RequestedProduct } from '../types/requested';
import { parseAxiosError } from '@/lib/errorMapper';

export function useRequestedProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'COMPRADO' | 'CANCELADO'>('PENDIENTE');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: swrProducts, mutate, isLoading: loading } = useSWR<RequestedProduct[]>('/requested-products');
  const products = swrProducts ?? [];

  const handleCreate = async (values: { name: string; quantity: number; notes?: string }) => {
    try {
      await api.post('/requested-products', values);
      toast.success(`Artículo "${values.name}" registrado.`);
      setIsFormOpen(false);
      mutate();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar artículo.'));
    }
  };

  const handleUpdateStatus = async (id: string, name: string, status: 'PENDIENTE' | 'COMPRADO' | 'CANCELADO') => {
    try {
      await api.put(`/requested-products/${id}`, { status });
      toast.success(`Artículo "${name}" marcado como ${status.toLowerCase()}.`);
      mutate();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar estado.'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(`/requested-products/${id}`);
      toast.success(`Artículo "${name}" eliminado.`);
      mutate();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al eliminar artículo.'));
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return {
    products: filteredProducts,
    allProductsCount: products.length,
    pendingProductsCount: products.filter(p => p.status === 'PENDIENTE').length,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isFormOpen,
    setIsFormOpen,
    handleCreate,
    handleUpdateStatus,
    handleDelete,
  };
}
