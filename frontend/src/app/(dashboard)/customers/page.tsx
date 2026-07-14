'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PinLockGuard from '@/components/PinLockGuard';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  History, 
  Phone, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

interface CreditTransaction {
  id: string;
  amount: number;
  type: 'DEUDA' | 'ABONO';
  notes: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  currentDebt: number;
  createdAt: string;
  creditTransactions: CreditTransaction[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebt, setFilterDebt] = useState<'ALL' | 'DEBTORS' | 'CLEAN'>('ALL');

  // Estado Formulario Cliente (Agregar/Editar)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: 0,
  });

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('No se pudo cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
    setFormData({
      name: '',
      phone: '',
      address: '',
      creditLimit: 1000, // Sugerencia de límite
    });
    setIsFormOpen(true);
  };

  // Abrir Editar
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del cliente es obligatorio.');
      return;
    }
    if (formData.creditLimit < 0) {
      toast.error('El límite de crédito no puede ser negativo.');
      return;
    }

    const payload = {
      ...formData,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
    };

    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
        toast.success(`Cliente "${formData.name}" actualizado.`);
      } else {
        await api.post('/customers', payload);
        toast.success(`Cliente "${formData.name}" registrado.`);
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el cliente.');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar abono.');
    }
  };

  // Abrir Historial / Estado de Cuenta
  const handleOpenHistory = async (customer: Customer) => {
    try {
      const response = await api.get(`/customers/${customer.id}`);
      setHistoryCustomer(response.data);
      setIsHistoryOpen(true);
    } catch (error) {
      toast.error('No se pudo cargar el historial del cliente.');
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
      toast.error('No se pudo eliminar el cliente.');
    }
  };

  return (
    <PinLockGuard>
      <div className="space-y-6 max-w-5xl mx-auto pb-6">
        
        {/* HEADER */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
          Cartera de Crédito
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Clientes y Fiados</h1>
      </div>

      {/* 1. SECCIÓN DE MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Clientes</span>
            <span className="text-xl font-black text-slate-800 block mt-1">{totalCustomers}</span>
            <span className="text-[9px] text-slate-400 block">Registrados en libreta</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cartera Fiada</span>
            <span className="text-xl font-black text-rose-500 block mt-1">${totalOutstandingDebt.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 block">Total cuentas por cobrar</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Líneas de Crédito</span>
            <span className="text-xl font-black text-slate-800 block mt-1">${totalCreditLimitGranted.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 block">Límite financiero total</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Deudores</span>
            <span className="text-xl font-black text-indigo-650 block mt-1">{totalDebtorsCount}</span>
            <span className="text-[9px] text-slate-400 block">Cuentas con deuda activa</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. BARRA DE FILTRADO */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {/* BUSCADOR */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              className="pl-9 h-11 border-slate-200 rounded-xl text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FILTRO DEUDA */}
          <select
            className="h-11 border border-slate-200 rounded-xl px-3 bg-white text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            value={filterDebt}
            onChange={(e) => setFilterDebt(e.target.value as any)}
          >
            <option value="ALL">Ver todos los Clientes</option>
            <option value="DEBTORS">Con Deuda Pendiente</option>
            <option value="CLEAN">Cuentas al Corriente</option>
          </select>
        </div>

        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all w-full md:w-auto justify-center"
          onClick={handleOpenAdd}
        >
          <Plus className="h-4 w-4" /> Registrar Cliente
        </Button>
      </div>

      {/* 3. LISTADO TÁCTIL (TARJETAS IPAD-STYLE PARA EVITAR TABLAS SATURADAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs col-span-2">Cargando libreta de clientes...</div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const usagePercent = customer.creditLimit > 0 
              ? Math.min(100, (customer.currentDebt / customer.creditLimit) * 100) 
              : 0;

            return (
              <div 
                key={customer.id} 
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:border-indigo-600/30 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-black text-slate-800 block">{customer.name}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        {customer.phone && (
                          <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {customer.phone}</span>
                        )}
                        {customer.address && (
                          <span className="truncate block max-w-[150px]" title={customer.address}>{customer.address}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={customer.currentDebt > 0 ? 'destructive' : 'secondary'} className="text-[8px] px-2 py-0.5 font-bold border-none">
                      {customer.currentDebt > 0 ? 'DEUDA PENDIENTE' : 'AL CORRIENTE'}
                    </Badge>
                  </div>

                  {/* Consumo de crédito bar */}
                  {customer.creditLimit > 0 && (
                    <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>Fiado: ${customer.currentDebt.toFixed(0)}</span>
                        <span>Límite: ${customer.creditLimit.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTONES ACCIÓN TÁCTIL XL */}
                <div className="flex gap-2 border-t pt-3 border-slate-50">
                  <Button 
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] h-9 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                    disabled={customer.currentDebt === 0}
                    onClick={() => handleOpenAbono(customer)}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Abonar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-slate-600 border-slate-200 text-[10px] font-extrabold h-9 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                    onClick={() => handleOpenHistory(customer)}
                  >
                    <History className="h-3.5 w-3.5" /> Historial
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-9 w-9 p-0"
                    onClick={() => handleOpenEdit(customer)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-9 w-9 p-0"
                    disabled={customer.currentDebt > 0}
                    onClick={() => handleOpenDelete(customer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-slate-400 text-xs col-span-2">
            No se encontraron clientes registrados.
          </div>
        )}
      </div>

      {/* 4. MODAL: REGISTRAR/EDITAR CLIENTE */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">
              {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura los datos del cliente y su límite máximo de fiado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-1 text-xs">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre Completo *</label>
              <Input
                type="text"
                required
                placeholder="Ej. María del Carmen, Don Pancho..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Teléfono</label>
                <Input
                  type="text"
                  placeholder="Ej. 5512345678"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Límite de Crédito ($) *</label>
                <Input
                  type="number"
                  required
                  placeholder="Ej. 1000.00"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650"
                  value={formData.creditLimit || ''}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Dirección / Notas de Contacto</label>
              <Input
                type="text"
                placeholder="Ej. Casa de portón azul en la esquina..."
                className="focus-visible:ring-indigo-500 h-10 text-xs"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
                Guardar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL: REGISTRAR ABONO */}
      <Dialog open={isAbonoOpen} onOpenChange={setIsAbonoOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Registrar Abono</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <form onSubmit={handleAbonoSubmit} className="space-y-4 py-1 text-xs">
              <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1">
                <span className="text-slate-450 font-bold block text-[9px] uppercase">CLIENTE</span>
                <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
                <div className="flex justify-between mt-2.5 text-xs font-bold">
                  <span className="text-slate-500">Deuda actual:</span>
                  <span className="text-rose-500">${selectedCustomer.currentDebt.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Monto a abonar ($) *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  className="focus-visible:ring-emerald-500 font-bold text-lg text-emerald-650 h-11"
                  value={abonoAmount || ''}
                  onChange={(e) => setAbonoAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Observación</label>
                <Input
                  type="text"
                  placeholder="Ej. Abono del fin de semana..."
                  className="focus-visible:ring-emerald-500 h-10 text-xs"
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsAbonoOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs px-5 rounded-xl h-10">
                  Registrar Abono
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. MODAL: HISTORIAL / ESTADO DE CUENTA */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Estado de Cuenta</DialogTitle>
          </DialogHeader>

          {historyCustomer && (
            <div className="space-y-4 py-1 text-xs">
              <div className="bg-slate-50 border p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-850 block text-xs">{historyCustomer.name}</span>
                  <span className="text-[9px] text-slate-400">Historial completo de deudas y pagos</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">Deuda actual</span>
                  <span className="text-sm font-black text-rose-500 block">${historyCustomer.currentDebt.toFixed(2)}</span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto pr-1 space-y-2 border rounded-xl divide-y">
                {historyCustomer.creditTransactions && historyCustomer.creditTransactions.length > 0 ? (
                  historyCustomer.creditTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-3">
                      <div>
                        <Badge 
                          variant="outline" 
                          className={tx.type === 'ABONO' 
                            ? 'text-emerald-650 bg-emerald-50 border-none font-bold text-[8px] uppercase px-1.5' 
                            : 'text-rose-500 bg-rose-50 border-none font-bold text-[8px] uppercase px-1.5'
                          }
                        >
                          {tx.type}
                        </Badge>
                        <span className="text-[9px] text-slate-400 block mt-1">{tx.notes || 'Movimiento registrado'}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <span className={`text-xs font-black block mt-0.5 ${tx.type === 'ABONO' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.type === 'ABONO' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    No se han registrado movimientos históricos de crédito para este cliente.
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => setIsHistoryOpen(false)}>
              Cerrar Ventana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. DIÁLOGO DE ELIMINACIÓN */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-rose-500 flex items-center gap-1.5">
              <AlertCircle className="h-5 w-5" /> ¿Eliminar Cliente?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Esta acción no se puede deshacer y removerá la ficha del cliente de forma permanente.
            </DialogDescription>
          </DialogHeader>

          {customerToDelete && (
            <div className="bg-slate-50 border p-3 rounded-xl text-xs">
              <span className="font-bold text-slate-800 text-sm">{customerToDelete.name}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-5" 
              onClick={handleDeleteSubmit}
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PinLockGuard>
  );
}
