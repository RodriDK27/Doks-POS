import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Customer } from '../types';
import { CustomerFormValues } from '../components/CustomerFormDialog';
import { parseAxiosError } from '@/lib/errorMapper';
export function useCustomers() {
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebt, setFilterDebt] = useState<'ALL' | 'DEBTORS' | 'CLEAN'>('ALL');

  // Estado Formulario Cliente (Agregar/Editar)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);


  // Estado Modal Abono Rápido
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [abonoAmount, setAbonoAmount] = useState<number>(0);
  const [abonoNotes, setAbonoNotes] = useState('');

  // Estado Modal Historial / Estado de Cuenta
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Estado Modal de Eliminación
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // SWR Query
  const { data: swrCustomers, mutate: mutateCustomers, isLoading: loading } = useSWR<Customer[]>('/customers');

  const customers = swrCustomers ?? [];

  const fetchCustomers = async () => {
    mutateCustomers();
  };

  // Métricas
  const totalCustomers = customers.length;
  const totalDebtorsCount = customers.filter(c => c.currentDebt > 0).length;
  const totalOutstandingDebt = customers.reduce((acc, c) => acc + c.currentDebt, 0);
  const totalCreditLimitGranted = customers.reduce((acc, c) => acc + c.creditLimit, 0);

  // Filtrado de clientes
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDebt = 
      filterDebt === 'ALL' ||
      (filterDebt === 'DEBTORS' && c.currentDebt > 0) ||
      (filterDebt === 'CLEAN' && c.currentDebt === 0);

    return matchesSearch && matchesDebt;
  });

  // Abrir Agregar
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  // Abrir Editar
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: CustomerFormValues) => {
    const payload = {
      ...values,
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
    };

    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
        toast.success(`Cliente "${values.name}" actualizado.`);
      } else {
        await api.post('/customers', payload);
        toast.success(`Cliente "${values.name}" registrado.`);
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar el cliente.'));
    }
  };

  // Abrir Abono
  const handleOpenAbono = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAbonoAmount(customer.currentDebt);
    setAbonoNotes('');
    setIsAbonoOpen(true);
  };

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (abonoAmount <= 0) {
      toast.error('El abono debe ser mayor a cero.');
      return;
    }
    if (abonoAmount > selectedCustomer.currentDebt) {
      toast.warning('El abono supera la deuda actual.');
    }

    try {
      await api.post(`/customers/${selectedCustomer.id}/abono`, {
        amount: abonoAmount,
        notes: abonoNotes.trim() || 'Abono registrado en cuenta',
      });
      toast.success(`Abono por $${abonoAmount.toFixed(2)} registrado correctamente.`);
      setIsAbonoOpen(false);
      setSelectedCustomer(null);
      setAbonoAmount(0);
      setAbonoNotes('');
      fetchCustomers();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar abono.'));
    }
  };

  // Abrir Historial / Estado de Cuenta
  const handleOpenHistory = async (customer: Customer) => {
    try {
      const response = await api.get(`/customers/${customer.id}`);
      setHistoryCustomer(response.data);
      setIsHistoryOpen(true);
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo cargar el historial del cliente.'));
    }
  };

  // Abrir Eliminación
  const handleOpenDelete = (customer: Customer) => {
    if (customer.currentDebt > 0) {
      toast.error(`No se puede eliminar a "${customer.name}" porque tiene una deuda activa de $${customer.currentDebt.toFixed(2)}.`);
      return;
    }
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!customerToDelete) return;
    try {
      await api.delete(`/customers/${customerToDelete.id}`);
      toast.success(`Cliente "${customerToDelete.name}" eliminado.`);
      setIsDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo eliminar el cliente.'));
    }
  };

  return {
    customers,
    loading,
    searchQuery,
    setSearchQuery,
    filterDebt,
    setFilterDebt,
    isFormOpen,
    setIsFormOpen,
    editingCustomer,
    isAbonoOpen,
    setIsAbonoOpen,
    selectedCustomer,
    abonoAmount,
    setAbonoAmount,
    abonoNotes,
    setAbonoNotes,
    isHistoryOpen,
    setIsHistoryOpen,
    historyCustomer,
    isDeleteOpen,
    setIsDeleteOpen,
    customerToDelete,
    totalCustomers,
    totalDebtorsCount,
    totalOutstandingDebt,
    totalCreditLimitGranted,
    filteredCustomers,
    handleOpenAdd,
    handleOpenEdit,
    handleFormSubmit,
    handleOpenAbono,
    handleAbonoSubmit,
    handleOpenHistory,
    handleOpenDelete,
    handleDeleteSubmit,
    fetchCustomers
  };
}
