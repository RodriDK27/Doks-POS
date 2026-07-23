'use client';

import React from 'react';
import { Truck, Plus, Edit3, Trash2, Calendar, FileText, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomSelect } from '@/components/CustomSelect';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Supplier, Purchase } from '../types';


interface PendingTicketItem {
  id: string;
  amount: number;
  scheduledDate?: string | null;
  notes?: string | null;
  supplier: { id: string; name: string };
}

interface TicketHistoryItem {
  id: string;
  amount: number;
  scheduledDate?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  supplier: { id: string; name: string };
}

interface SuppliersTabProps {
  suppliers: Supplier[];
  suppliersLoading: boolean;
  purchases: Purchase[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  uniqueMonths: string[];
  filteredPurchases: Purchase[];
  totalSpent: number;
  setIsSupplierOpen: (open: boolean) => void;
  handleOpenRegisterPurchase: (supplier: Supplier) => void;
  handleOpenEditSupplier: (supplier: Supplier) => void;
  handleToggleActiveSupplier: (supplier: Supplier) => void;
  setActivePurchaseDetail: (purchase: Purchase) => void;
  setIsDetailOpen: (open: boolean) => void;

  // Tickets pendientes y de historial
  pendingTickets?: PendingTicketItem[];
  ticketsHistory?: TicketHistoryItem[];
  onOpenRegisterTicket?: () => void;
  onOpenPayTicket?: (ticket: PendingTicketItem) => void;
  onCancelPendingTicket?: (id: string) => Promise<void>;
}

export function SuppliersTab({
  suppliers,
  suppliersLoading,
  selectedMonth,
  setSelectedMonth,
  uniqueMonths,
  filteredPurchases,
  totalSpent,
  setIsSupplierOpen,
  handleOpenRegisterPurchase,
  handleOpenEditSupplier,
  handleToggleActiveSupplier,
  setActivePurchaseDetail,
  setIsDetailOpen,

  pendingTickets = [],
  ticketsHistory = [],
  onOpenRegisterTicket,
  onOpenPayTicket,
  onCancelPendingTicket,
}: SuppliersTabProps) {
  const { role } = useAuthStore();
  const [logView, setLogView] = React.useState<'PURCHASES' | 'TICKETS'>('PURCHASES');

  // Paginación para Compras y Tickets
  const [purchasesPage, setPurchasesPage] = React.useState(1);
  const [purchasesPerPage, setPurchasesPerPage] = React.useState(10);

  const [ticketsPage, setTicketsPage] = React.useState(1);
  const [ticketsPerPage, setTicketsPerPage] = React.useState(10);

  const [prevSelectedMonth, setPrevSelectedMonth] = React.useState(selectedMonth);

  if (prevSelectedMonth !== selectedMonth) {
    setPrevSelectedMonth(selectedMonth);
    setPurchasesPage(1);
  }

  const totalPurchasesPages = Math.ceil(filteredPurchases.length / purchasesPerPage) || 1;
  const paginatedPurchases = React.useMemo(() => {
    return filteredPurchases.slice((purchasesPage - 1) * purchasesPerPage, purchasesPage * purchasesPerPage);
  }, [filteredPurchases, purchasesPage, purchasesPerPage]);

  const totalTicketsPages = Math.ceil(ticketsHistory.length / ticketsPerPage) || 1;
  const paginatedTickets = React.useMemo(() => {
    return ticketsHistory.slice((ticketsPage - 1) * ticketsPerPage, ticketsPage * ticketsPerPage);
  }, [ticketsHistory, ticketsPage, ticketsPerPage]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">

      {/* 1. SECCIÓN DE PROVEEDORES */}
      <div className="space-y-3 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-indigo-650" /> Directorio de Proveedores
          </h3>
          {role === 'ADMIN' && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              onClick={() => setIsSupplierOpen(true)}
            >
              <Plus className="h-4 w-4" /> Registrar Proveedor
            </Button>
          )}
        </div>


        <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden w-full">
          {suppliersLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : suppliers.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[180px]">Nombre / Marca</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[120px]">Teléfono</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[120px]">Frecuencia</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right w-[120px]">Pago Est. ($)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center w-[90px]">Compras</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right min-w-[280px] pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {suppliers.map((supplier) => (
                  <TableRow 
                    key={supplier.id} 
                    className={cn(
                      "hover:bg-slate-50/20 border-b transition-all",
                      supplier.isActive === false && "opacity-60 bg-slate-50/30 dark:bg-slate-950/20"
                    )}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{supplier.name}</span>
                        {supplier.isActive === false && (
                          <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded uppercase tracking-wider">Inactivo</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {supplier.phone || <span className="text-slate-350 dark:text-slate-600 italic">Sin teléfono</span>}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {supplier.visitFrequency === 'BIWEEKLY_A' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">15d (Sem 1/3)</span>
                      ) : supplier.visitFrequency === 'BIWEEKLY_B' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">15d (Sem 2/4)</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">Semanal</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${(supplier.expectedPayment || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs text-slate-600 dark:text-slate-300 font-black">
                      {supplier._count?.purchases || 0}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-4">
                      {(() => {
                        const activeTicket = pendingTickets.find(t => t.supplier.id === supplier.id || t.supplier.name === supplier.name);
                        return (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                            {activeTicket && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-2.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                                onClick={() => onOpenPayTicket?.(activeTicket)}
                                title="Liquidar pago de ticket pendiente"
                              >
                                Pagar (${activeTicket.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })})
                              </Button>
                            )}
                            {supplier.isActive !== false && (
                              <Button 
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-7 px-2.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                                onClick={() => handleOpenRegisterPurchase(supplier)}
                              >
                                {activeTicket ? 'Compra' : 'Registrar Compra / Ticket'}
                              </Button>
                            )}
                        {role === 'ADMIN' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              onClick={() => handleOpenEditSupplier(supplier)}
                              title="Editar"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 rounded-lg cursor-pointer",
                                supplier.isActive === false
                                  ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                                  : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                              )}
                              onClick={() => handleToggleActiveSupplier(supplier)}
                              title={supplier.isActive === false ? 'Activar' : 'Desactivar'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 w-full">
              No hay proveedores registrados.
            </div>
          )}
        </div>
      </div>

      {/* 2. AGENDA SEMANAL DE PROVEEDORES Y TICKETS POR PAGAR */}
      <div className="space-y-3 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-650" /> Agenda Semanal de Visitas y Tickets
          </h3>

          {/* TOTALIZADOR DE EFECTIVO RESERVADO */}
          {(() => {
            const activeSuppliers = suppliers.filter(s => s.isActive !== false);
            const totalTicketsValue = activeSuppliers.reduce((acc, s) => acc + (s.expectedPayment || 0), 0);
            return (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase">Efectivo Reservado p/ Tickets:</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  ${totalTicketsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })()}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
            const activeSuppliers = suppliers.filter(s => s.isActive !== false);
            const orderSuppliers = activeSuppliers.filter(s => (s.orderDays || '').split(',').includes(day));
            const deliverySuppliers = activeSuppliers.filter(s => (s.deliveryDays || '').split(',').includes(day));
            const hasVisits = orderSuppliers.length > 0 || deliverySuppliers.length > 0;
            const dayTicketsTotal = [...orderSuppliers, ...deliverySuppliers].reduce((acc, s) => acc + (s.expectedPayment || 0), 0);

            return (
              <div 
                key={day} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[175px] max-h-[175px]"
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 shrink-0">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{day}</span>
                    {dayTicketsTotal > 0 ? (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30" title="Total de tickets reservados para este día">
                        ${dayTicketsTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    ) : hasVisits ? (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" title="Visita programada" />
                    ) : null}
                  </div>

                  <div className="flex-grow overflow-y-auto scrollbar-thin max-h-[120px] pr-0.5 space-y-1.5">
                    {hasVisits ? (
                      <>
                        {orderSuppliers.map(s => (
                          <div key={`order-${s.id}`} className="flex flex-col gap-0.5 p-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/40 dark:border-indigo-900/40">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                              <span className="text-[7.5px] font-black uppercase px-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded shrink-0">Preventa</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-400 font-bold">
                                {s.visitFrequency?.startsWith('BIWEEKLY') ? '15d' : 'Sem'}
                              </span>
                              {s.expectedPayment && s.expectedPayment > 0 ? (
                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                  ${s.expectedPayment.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">Al recibir</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {deliverySuppliers.map(s => {
                          const supplierTickets = pendingTickets.filter(t => t.supplier.id === s.id || t.supplier.name === s.name);
                          const dayTicket = supplierTickets.find(t => t.scheduledDate === day) || supplierTickets[0];

                          return (
                            <div key={`delivery-${s.id}`} className="flex flex-col gap-1 p-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 truncate flex-1">{s.name}</span>
                                <span className="text-[7.5px] font-black uppercase px-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded shrink-0">Entrega</span>
                              </div>

                              {dayTicket ? (
                                <div className="flex items-center justify-between text-[9.5px] pt-0.5">
                                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                                    Ticket: ${dayTicket.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] rounded-md cursor-pointer active:scale-95"
                                    onClick={() => onOpenPayTicket?.(dayTicket)}
                                  >
                                    Pagar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-slate-400 font-bold">
                                    {s.visitFrequency?.startsWith('BIWEEKLY') ? '15d' : 'Sem'}
                                  </span>
                                  <span className="text-slate-400 font-medium">Al recibir</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 italic py-4 text-center">
                        Sin visitas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SECCIÓN DE BITÁCORA Y HISTORIAL DE TICKETS */}
      <div className="space-y-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-650" /> Bitácora de Compras e Historial de Tickets
          </h3>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setLogView('PURCHASES')}
              className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                logView === 'PURCHASES'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Compras Realizadas ({filteredPurchases.length})
            </button>
            <button
              type="button"
              onClick={() => setLogView('TICKETS')}
              className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                logView === 'TICKETS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Historial de Tickets ({ticketsHistory.length})
            </button>
          </div>
        </div>

        <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden w-full">
          {logView === 'PURCHASES' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/40 p-4 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <CustomSelect
                    className="w-44 h-8 text-[11px] font-bold"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={uniqueMonths.map((m) => {
                      const [year, month] = m.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                      const monthName = date.toLocaleString('es-ES', { month: 'long' });
                      return {
                        value: m,
                        label: monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year,
                      };
                    })}
                  />
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Total gastado en el mes</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {suppliersLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                      <Skeleton className="h-4.5 w-32" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-10 rounded-md" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : filteredPurchases.length > 0 ? (
                <>
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                      <TableRow className="border-none">
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pl-5">Proveedor</TableHead>
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5">Fecha y Hora</TableHead>
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 w-32 text-center">Caja Chica</TableHead>
                        <TableHead className="text-right text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 w-36">Total Compra</TableHead>
                        <TableHead className="w-28 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pr-5">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {paginatedPurchases.map((purchase) => (
                        <TableRow key={purchase.id} className="hover:bg-slate-50/20 border-b border-slate-100 dark:border-slate-800">
                          <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-200 pl-5">{purchase.supplier.name}</TableCell>
                          <TableCell className="text-slate-455 dark:text-slate-400 text-xs">
                            {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={purchase.payFromRegister ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[8px] px-1.5' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-none font-bold text-[8px] px-1.5'}>
                              {purchase.payFromRegister ? 'SÍ' : 'NO'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-808 dark:text-slate-100 text-xs">
                            ${purchase.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center pr-5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 px-2 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                              onClick={() => {
                                setActivePurchaseDetail(purchase);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" /> Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* CONTROLES DE PAGINACIÓN DE COMPRAS */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-xs">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-500 font-bold">Mostrar:</span>
                        <CustomSelect
                          className="w-20 h-8 text-xs font-bold"
                          value={String(purchasesPerPage)}
                          onChange={(val) => {
                            setPurchasesPerPage(Number(val));
                            setPurchasesPage(1);
                          }}
                          options={[
                            { value: '10', label: '10' },
                            { value: '25', label: '25' },
                            { value: '50', label: '50' },
                            { value: '100', label: '100' },
                          ]}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap text-right">
                        Mostrando {filteredPurchases.length > 0 ? (purchasesPage - 1) * purchasesPerPage + 1 : 0} - {Math.min(purchasesPage * purchasesPerPage, filteredPurchases.length)} de {filteredPurchases.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                        disabled={purchasesPage <= 1}
                        onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <span className="px-2 font-black text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                        Página {purchasesPage} de {totalPurchasesPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                        disabled={purchasesPage >= totalPurchasesPages}
                        onClick={() => setPurchasesPage((p) => Math.min(totalPurchasesPages, p + 1))}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No se han registrado compras en este mes.
                </div>
              )}
            </>
          ) : (
            ticketsHistory.length > 0 ? (
              <>
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <TableRow className="border-none">
                      <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pl-5">Proveedor</TableHead>
                      <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5">Fecha Registro</TableHead>
                      <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5">Entrega Programada / Nota</TableHead>
                      <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 text-center">Estado</TableHead>
                      <TableHead className="text-right text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5">Monto Ticket</TableHead>
                      <TableHead className="w-32 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pr-5">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {paginatedTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-slate-50/20 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-200 pl-5">{ticket.supplier.name}</TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                          {ticket.scheduledDate || 'Próximo'} {ticket.notes ? `(${ticket.notes})` : ''}
                        </TableCell>
                        <TableCell className="text-center">
                          {ticket.status === 'PENDING' ? (
                            <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/50 text-[9px] font-black">
                              PENDIENTE
                            </Badge>
                          ) : ticket.status === 'PAID' ? (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 text-[9px] font-black">
                              PAGADO
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/50 text-[9px] font-black">
                              CANCELADO
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          ${ticket.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center pr-5">
                          {ticket.status === 'PENDING' ? (
                            <Button
                              size="sm"
                              className="h-7 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 cursor-pointer"
                              onClick={() => onOpenPayTicket?.(ticket)}
                            >
                              Pagar Ticket
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Completado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* CONTROLES DE PAGINACIÓN DE TICKETS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-xs">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-500 font-bold">Mostrar:</span>
                      <CustomSelect
                        className="w-20 h-8 text-xs font-bold"
                        value={String(ticketsPerPage)}
                        onChange={(val) => {
                          setTicketsPerPage(Number(val));
                          setTicketsPage(1);
                        }}
                        options={[
                          { value: '10', label: '10' },
                          { value: '25', label: '25' },
                          { value: '50', label: '50' },
                          { value: '100', label: '100' },
                        ]}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap text-right">
                      Mostrando {ticketsHistory.length > 0 ? (ticketsPage - 1) * ticketsPerPage + 1 : 0} - {Math.min(ticketsPage * ticketsPerPage, ticketsHistory.length)} de {ticketsHistory.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                      disabled={ticketsPage <= 1}
                      onClick={() => setTicketsPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="px-2 font-black text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                      Página {ticketsPage} de {totalTicketsPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                      disabled={ticketsPage >= totalTicketsPages}
                      onClick={() => setTicketsPage((p) => Math.min(totalTicketsPages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs italic">
                No hay historial de tickets registrados.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
