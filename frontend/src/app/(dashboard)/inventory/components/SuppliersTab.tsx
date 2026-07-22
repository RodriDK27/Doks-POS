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
}: SuppliersTabProps) {
  const { role } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
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
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[220px]">Nombre / Marca</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[140px]">Teléfono</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs">Dirección / Notas</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center w-[100px]">Compras</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right w-[180px]">Acciones</TableHead>
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
                    <TableCell className="py-3 text-xs text-slate-500 dark:text-slate-400">
                      {supplier.address || <span className="text-slate-300 dark:text-slate-700 italic">-</span>}
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs text-slate-600 dark:text-slate-300 font-black">
                      {supplier._count?.purchases || 0}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {supplier.isActive !== false && (
                          <Button 
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-7 px-3.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                            onClick={() => handleOpenRegisterPurchase(supplier)}
                          >
                            Comprar
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

      {/* 2. AGENDA SEMANAL DE PROVEEDORES */}
      <div className="space-y-3 w-full">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-indigo-650" /> Agenda Semanal de Visitas y Entregas
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
            const activeSuppliers = suppliers.filter(s => s.isActive !== false);
            const orderSuppliers = activeSuppliers.filter(s => (s.orderDays || '').split(',').includes(day));
            const deliverySuppliers = activeSuppliers.filter(s => (s.deliveryDays || '').split(',').includes(day));
            const hasVisits = orderSuppliers.length > 0 || deliverySuppliers.length > 0;

            return (
              <div 
                key={day} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[160px] max-h-[160px]"
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 shrink-0">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{day}</span>
                    {hasVisits && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-grow overflow-y-auto scrollbar-thin max-h-[105px] pr-0.5 space-y-1.5">
                    {hasVisits ? (
                      <>
                        {orderSuppliers.map(s => (
                          <div key={`order-${s.id}`} className="flex items-center justify-between gap-1 p-1 bg-indigo-50/50 dark:bg-indigo-950/20 rounded border border-indigo-100/40 dark:border-indigo-900/40">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                            <span className="text-[8px] font-extrabold uppercase px-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded shrink-0">Pedido</span>
                          </div>
                        ))}

                        {deliverySuppliers.map(s => (
                          <div key={`delivery-${s.id}`} className="flex items-center justify-between gap-1 p-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-100/40 dark:border-emerald-900/40">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                            <span className="text-[8px] font-extrabold uppercase px-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded shrink-0">Entrega</span>
                          </div>
                        ))}
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

      {/* 3. SECCIÓN DE BITÁCORA DE COMPRAS */}
      <div className="space-y-3 w-full">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-indigo-650" /> Bitácora de Compras Realizadas
        </h3>
        <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden w-full">
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
                {filteredPurchases.map((purchase) => (
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
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              No se han registrado compras en este mes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
