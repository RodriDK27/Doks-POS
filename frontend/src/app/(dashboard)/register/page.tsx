'use client';

import React from 'react';
import Link from 'next/link';
import PinLockGuard from '@/components/PinLockGuard';
import { 
  DollarSign, 
  Clock, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Unlock, 
  Lock, 
  BadgeAlert,
  ChevronRight,
  FileText,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useRegister } from './hooks/useRegister';
import { ManualTransactionDialog } from './components/ManualTransactionDialog';
import dynamic from 'next/dynamic';

const CloseRegisterDialog = dynamic(() => import('./components/CloseRegisterDialog').then(mod => mod.CloseRegisterDialog), {
  ssr: false,
});

export default function RegisterPage() {
  const {
    role,
    activeRegister,
    history,
    loading,
    openForm,
    setOpenForm,
    isAdjOpen,
    setIsAdjOpen,
    adjForm,
    setAdjForm,
    isCloseOpen,
    setIsCloseOpen,
    countedCash,
    setCountedCash,
    closeNotes,
    setCloseNotes,
    billCounts,
    setBillCounts,
    calculatedSum,
    applyCalculatedToClose,
    handleOpenRegister,
    handleAdjustmentSubmit,
    handleCloseRegister,
    handleDownloadPdf,
    cashiers,
  } = useRegister();

  if (loading) {
    return (
      <div className="space-y-6 w-full pb-6 animate-in fade-in duration-300">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-60 mt-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-48" />
          <div className="border border-slate-100 rounded-3xl bg-white p-4 space-y-4 shadow-xs">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-4.5 w-40" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-4.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const transactions = activeRegister?.transactions || [];
  const ingresos = transactions
    .filter((tx) => tx.type === 'INGRESO')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const egresos = transactions
    .filter((tx) => tx.type === 'EGRESO')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="space-y-6 w-full pb-6">
        
        {/* HEADER */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Finanzas del Turno
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Caja Registradora</h1>
        </div>

        {!activeRegister ? (
          /* CAJA CERRADA: FORMULARIO DE APERTURA PREMIUM */
          <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-7 rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Apertura de Turno</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px]">
                Selecciona tu nombre de la plantilla de cajeros e ingresa el fondo inicial de la caja chica.
              </p>
            </div>

            <form onSubmit={handleOpenRegister} className="space-y-5 text-xs pt-1">
              
              {/* SELECCIÓN DE CAJERO */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest block">
                  Cajero Operador *
                </label>
                
                {cashiers.filter(c => c.role === 'CAJERO').length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {cashiers.filter(c => c.role === 'CAJERO').map((c) => {
                      const isSelected = openForm.openedBy === c.name;
                      const initial = c.name.charAt(0).toUpperCase();

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setOpenForm({ ...openForm, openedBy: c.name })}
                          className={cn(
                            "p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 cursor-pointer font-bold text-xs relative overflow-hidden active:scale-95",
                            isSelected
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30"
                              : "border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30"
                          )}
                        >
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all duration-200",
                            isSelected 
                              ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-xs scale-105" 
                              : "bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-slate-700"
                          )}>
                            {initial}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <span className="truncate block font-extrabold text-xs leading-tight">{c.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5 uppercase tracking-wider">
                              {isSelected ? 'Seleccionado' : 'Cajero'}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    type="text"
                    required
                    placeholder="Ej. Sra. María, Carlos..."
                    className="focus-visible:ring-indigo-500 h-11 text-xs font-bold rounded-xl"
                    value={openForm.openedBy}
                    onChange={(e) => setOpenForm({ ...openForm, openedBy: e.target.value })}
                  />
                )}
              </div>

              {/* FONDO INICIAL CON ACCESOS RÁPIDOS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                    Fondo Inicial de Caja ($) *
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">Sugerido: $500.00</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">$</span>
                  <Input
                    type="number"
                    required
                    placeholder="0.00"
                    className="focus-visible:ring-indigo-500 pl-8 h-12 text-sm font-black text-slate-800 dark:text-slate-100 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                    value={openForm.initialBalance || ''}
                    onChange={(e) => setOpenForm({ ...openForm, initialBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Botones rápidos de fondo */}
                <div className="flex gap-1.5 pt-1">
                  {[200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpenForm({ ...openForm, initialBalance: amt })}
                      className="flex-1 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTÓN APERTURA */}
              <Button
                type="submit"
                disabled={!openForm.openedBy}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black text-xs h-12 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                Abrir Turno de Caja
              </Button>
            </form>
          </div>
        ) : (          /* CAJA ABIERTA: PANEL OPERATIVO DE CAJA */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COLUMNA IZQUIERDA: RESUMEN DE SALDOS Y ACCIONES (Toma 2 columnas) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-6">
                  
                  <div>
                    <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800/60">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Cuentas del Turno</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Control de flujo de efectivo en caja chica</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-200/30">
                        Caja Abierta
                      </span>
                    </div>

                    {/* GRIDS DE MÉTRICAS FINANCIERAS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-800/40">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Fondo Inicial</span>
                        <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-1">
                          ${activeRegister.initialBalance.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100/30 dark:border-emerald-900/30">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Ingresos (+)</span>
                        <span className="text-base font-extrabold text-emerald-600 block mt-1">
                          +${ingresos.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-rose-50/30 dark:bg-rose-950/20 p-3.5 rounded-2xl border border-rose-100/30 dark:border-rose-900/30">
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-450 uppercase tracking-wider block">Egresos (-)</span>
                        <span className="text-base font-extrabold text-rose-500 block mt-1">
                          -${egresos.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/30">
                        <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-450 uppercase tracking-wider block">Efectivo en Caja</span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-1">
                          ${activeRegister.expectedBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES DIRECTAS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <Button 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs h-11 rounded-xl cursor-pointer border border-transparent dark:border-slate-850 justify-center gap-1.5"
                      onClick={() => setIsAdjOpen(true)}
                    >
                      <Plus className="h-4 w-4 text-indigo-650 dark:text-indigo-400" /> Movimiento de Caja
                    </Button>
                    <Button 
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs h-11 rounded-xl cursor-pointer border-none justify-center gap-1.5"
                      onClick={() => setIsCloseOpen(true)}
                    >
                      <Lock className="h-4 w-4" /> Realizar Corte de Caja (Arqueo)
                    </Button>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: INFORMACIÓN DETALLADA DEL TURNO */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] h-full flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-4 border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
                      <Clock className="h-4.5 w-4.5 text-indigo-505" /> Información de Sesión
                    </h3>
                    
                    <div className="space-y-3 text-xs font-semibold text-slate-550 dark:text-slate-400">
                      <div className="flex justify-between border-b pb-2 border-slate-50 dark:border-slate-800/30">
                        <span className="text-slate-400">Cajero asignado:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{activeRegister.openedBy}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-50 dark:border-slate-800/30">
                        <span className="text-slate-400">Apertura:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          {new Date(activeRegister.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({new Date(activeRegister.openedAt).toLocaleDateString()})
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400">Operaciones en Turno:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{activeRegister.transactions?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/pos" className="w-full">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer">
                      Ir al Punto de Venta <ChevronRight className="h-4.5 w-4.5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>

            {/* TABLA DE MOVIMIENTOS CAJA DEL TURNO */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                <History className="h-4 w-4 text-indigo-650" /> Movimientos en este Turno
              </h3>
              
              <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                {activeRegister.transactions && activeRegister.transactions.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b">
                        <TableHead className="text-xs font-bold text-slate-500">Concepto / Descripción</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500">Hora</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 text-center w-24">Tipo</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {activeRegister.transactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 border-b dark:border-slate-800/60">
                          <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-300 py-3">{tx.description}</TableCell>
                          <TableCell className="text-slate-450 dark:text-slate-400 text-xs py-3">
                            {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <Badge 
                              variant="outline" 
                              className={
                                tx.type === 'INGRESO' 
                                  ? 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[8px] px-2 py-0.5' 
                                  : 'bg-rose-50 dark:bg-rose-955/30 text-rose-500 dark:text-rose-400 border-none font-bold text-[8px] px-2 py-0.5'
                              }
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-black text-xs py-3 ${tx.type === 'INGRESO' ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500 dark:text-rose-450'}`}>
                            {tx.type === 'INGRESO' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-14 text-center text-slate-400 text-xs">
                    No se han registrado movimientos de efectivo o ventas en este turno.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BITÁCORA DE HISTORIAL TURNOS ANTERIORES */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <FileText className="h-4 w-4 text-indigo-650" /> Historial de Turnos Cerrados
          </h3>

          <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            {history.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b">
                    <TableHead className="text-xs font-bold text-slate-500">Cajero</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Apertura</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Cierre</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Esperado</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Entregado</TableHead>
                    <TableHead className="text-center text-xs font-bold text-slate-500 w-24">Estado</TableHead>
                    <TableHead className="text-center text-xs font-bold text-slate-500 w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {history.map((reg) => {
                    const diff = (reg.actualBalance || 0) - reg.expectedBalance;
                    return (
                      <TableRow key={reg.id} className="hover:bg-slate-50/20 border-b">
                        <TableCell className="font-bold text-xs text-slate-700 py-3">{reg.openedBy}</TableCell>
                        <TableCell className="text-slate-450 text-xs py-3">
                          {new Date(reg.openedAt).toLocaleDateString()} {new Date(reg.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </TableCell>
                        <TableCell className="text-slate-450 text-xs py-3">
                          {reg.closedAt ? `${new Date(reg.closedAt).toLocaleDateString()} ${new Date(reg.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '--'}
                        </TableCell>
                        <TableCell className="text-right text-slate-650 text-xs py-3">${reg.expectedBalance.toFixed(0)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800 text-xs py-3">
                          ${reg.actualBalance ? reg.actualBalance.toFixed(0) : '0'}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex justify-center">
                            {diff === 0 ? (
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 font-black text-[9px] px-2.5 py-0.5 rounded-full">
                                CUADRÓ
                              </Badge>
                            ) : diff < 0 ? (
                              <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 justify-center" title={`Faltante: $${Math.abs(diff).toFixed(0)}`}>
                                <BadgeAlert className="h-3 w-3 shrink-0 text-rose-500 dark:text-rose-400" /> FALTÓ
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 font-black text-[9px] px-2.5 py-0.5 rounded-full" title={`Sobrante: $${diff.toFixed(0)}`}>
                                SOBRÓ
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg cursor-pointer"
                            onClick={() => handleDownloadPdf(reg.id)}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-14 text-center text-slate-400 text-xs">
                No hay turnos cerrados en el historial.
              </div>
            )}
          </div>
        </div>

        {/* DIÁLOGOS COMPONENTIZADOS */}
        <ManualTransactionDialog
          open={isAdjOpen}
          onOpenChange={setIsAdjOpen}
          adjForm={adjForm}
          setAdjForm={setAdjForm}
          onSubmit={handleAdjustmentSubmit}
        />

        <CloseRegisterDialog
          open={isCloseOpen}
          onOpenChange={setIsCloseOpen}
          countedCash={countedCash}
          setCountedCash={setCountedCash}
          closeNotes={closeNotes}
          setCloseNotes={setCloseNotes}
          billCounts={billCounts}
          setBillCounts={setBillCounts}
          calculatedSum={calculatedSum}
          applyCalculatedToClose={applyCalculatedToClose}
          onCloseRegister={handleCloseRegister}
          activeRegisterExpected={activeRegister ? activeRegister.expectedBalance : 0}
        />

      </div>
  );
}
