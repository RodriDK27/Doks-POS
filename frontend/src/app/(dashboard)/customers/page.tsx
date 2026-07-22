'use client';

import React from 'react';
import PinLockGuard from '@/components/PinLockGuard';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  History, 
  Phone, 
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


import { useAuthStore } from '@/store/useAuthStore';
import { useCustomers } from './hooks/useCustomers';
import { CustomerFormDialog } from './components/CustomerFormDialog';
import { CustomerDebtDialog } from './components/CustomerDebtDialog';
import { CustomerHistoryDialog } from './components/CustomerHistoryDialog';

export default function CustomersPage() {
  const {
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
    transactionType,
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
    handleOpenDeuda,
    handleAbonoSubmit,
    handleOpenHistory,
    handleOpenDelete,
    handleDeleteSubmit,
  } = useCustomers();

  const { role } = useAuthStore();

  return (
    <div className="space-y-6 w-full pb-6">
      
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
        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] animate-in fade-in duration-200">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Clientes</span>
            <span className="text-xl font-black text-slate-800 block mt-1">{totalCustomers}</span>
            <span className="text-[9px] text-slate-400 block">Registrados en libreta</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] animate-in fade-in duration-200">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cartera Fiada</span>
            <span className="text-xl font-black text-rose-500 block mt-1">${totalOutstandingDebt.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 block">Total cuentas por cobrar</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] animate-in fade-in duration-200">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Líneas de Crédito</span>
            <span className="text-xl font-black text-slate-800 block mt-1">${totalCreditLimitGranted.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 block">Límite financiero total</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] animate-in fade-in duration-200">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Deudores</span>
            <span className="text-xl font-black text-indigo-650 block mt-1">{totalDebtorsCount}</span>
            <span className="text-[9px] text-slate-400 block">Cuentas con deuda activa</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. BARRA DE FILTRADO */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        {/* BUSCADOR */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar cliente por nombre o teléfono..."
            className="pl-9 h-11 border-slate-200 rounded-xl text-xs w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ACCIONES Y FILTROS */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 items-stretch sm:items-center">
          {/* FILTRO DEUDA */}
          <CustomSelect
            className="w-full sm:w-56 h-11"
            value={filterDebt}
            onChange={(val) => setFilterDebt(val as 'ALL' | 'DEBTORS' | 'CLEAN')}
            options={[
              { value: 'ALL', label: 'Ver todos los Clientes' },
              { value: 'DEBTORS', label: 'Con Deuda Pendiente' },
              { value: 'CLEAN', label: 'Cuentas al Corriente' },
            ]}
          />

          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all w-full sm:w-auto justify-center cursor-pointer"
            onClick={handleOpenAdd}
          >
            <Plus className="h-4 w-4" /> Registrar Cliente
          </Button>
        </div>
      </div>

      {/* 3. LISTADO TÁCTIL Y COMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-50 dark:border-slate-800">
                  <Skeleton className="h-8 flex-1 rounded-xl" />
                  <Skeleton className="h-8 flex-1 rounded-xl" />
                </div>
              </div>
            ))}
          </>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const usagePercent = customer.creditLimit > 0 
              ? Math.min(100, (customer.currentDebt / customer.creditLimit) * 100) 
              : 0;

            return (
              <div 
                key={customer.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">{customer.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                        {customer.phone && (
                          <span className="flex items-center gap-0.5 shrink-0"><Phone className="h-3 w-3" /> {customer.phone}</span>
                        )}
                        {customer.address && (
                          <span className="truncate block" title={customer.address}>{customer.address}</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={customer.currentDebt > 0 ? 'destructive' : 'secondary'} 
                      className={cn(
                        "text-[9px] px-2 py-0.5 font-extrabold border-none shrink-0",
                        customer.currentDebt === 0 && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {customer.currentDebt > 0 ? `$${customer.currentDebt.toFixed(0)} PENDIENTE` : 'AL CORRIENTE'}
                    </Badge>
                  </div>

                  {/* Consumo de crédito bar */}
                  {customer.creditLimit > 0 && (
                    <div className="space-y-0.5 mt-2">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>Fiado: ${customer.currentDebt.toFixed(0)}</span>
                        <span>Límite: ${customer.creditLimit.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTONES ACCIÓN TÁCTIL COMPACTOS */}
                <div className="flex items-center gap-1.5 pt-1">
                  <Button 

                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] h-8 px-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    disabled={customer.currentDebt === 0}
                    onClick={() => handleOpenAbono(customer)}
                    title="Abonar a cuenta"
                  >
                    <DollarSign className="h-3 w-3" /> Abonar
                  </Button>
                  <Button 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-8 px-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    onClick={() => handleOpenDeuda(customer)}
                    title="Registrar deuda fuera de ticket"
                  >
                    <Plus className="h-3 w-3" /> Fiar
                  </Button>

                  <Button 
                    variant="outline" 
                    className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 text-[10px] font-extrabold rounded-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                    onClick={() => handleOpenHistory(customer)}
                    title="Historial de movimientos"
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                  {role === 'ADMIN' && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl h-8 w-8 p-0 cursor-pointer shrink-0"
                        onClick={() => handleOpenEdit(customer)}
                        title="Editar cliente"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl h-8 w-8 p-0 cursor-pointer shrink-0"
                        disabled={customer.currentDebt > 0}
                        onClick={() => handleOpenDelete(customer)}
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })

        ) : (
          <div className="py-20 text-center text-slate-400 text-xs col-span-2 animate-pulse">
            No se encontraron clientes registrados.
          </div>
        )}
      </div>

        {/* DIÁLOGOS Y MODALES COMPONENTIZADOS */}
        <CustomerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          editingCustomer={editingCustomer}
          onSubmit={handleFormSubmit}
        />

        <CustomerDebtDialog
          open={isAbonoOpen}
          onOpenChange={setIsAbonoOpen}
          selectedCustomer={selectedCustomer}
          transactionType={transactionType}
          abonoAmount={abonoAmount}
          setAbonoAmount={setAbonoAmount}
          abonoNotes={abonoNotes}
          setAbonoNotes={setAbonoNotes}
          onSubmit={handleAbonoSubmit}
        />

        <CustomerHistoryDialog
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          historyCustomer={historyCustomer}
        />

        {/* DIÁLOGO DE ELIMINACIÓN */}
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
              <Button variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer" onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-5 cursor-pointer active:scale-95 transition-all" 
                onClick={handleDeleteSubmit}
              >
                Sí, Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}
