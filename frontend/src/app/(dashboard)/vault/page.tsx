'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Landmark,
  DollarSign,
  Receipt,
  PlusCircle,
  History,
  PieChart,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/CustomSelect';
import { parseAxiosError } from '@/lib/errorMapper';
import PinLockGuard from '@/components/PinLockGuard';
import { useAuthStore } from '@/store/useAuthStore';

interface VaultTransaction {
  id: string;
  type: 'DEPOSITO_CORTE' | 'EGRESO_PROVEEDOR' | 'RETIRO_UTILIDAD' | 'GASTO_OPERATIVO' | 'ENTRADA_MANUAL' | 'AJUSTE_SALDO';
  amount: number;
  balanceAfter: number;
  description: string;
  createdByName?: string | null;
  createdAt: string;
  cashRegister?: { openedBy: string } | null;
  purchase?: { total: number; supplier?: { name: string } } | null;
}

interface VaultData {
  vault: { balance: number; updatedAt: string };
  metrics: {
    totalDepositsFromClosures: number;
    totalSupplierPayments: number;
    totalProfitWithdrawals: number;
    totalOperationalExpenses: number;
    totalManualDeposits: number;
  };
}

interface ProfitReport {
  currentVaultBalance: number;
  grossRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operationalExpenses: number;
  netRealProfit: number;
  profitWithdrawn: number;
  netProfitRemaining: number;
}

export default function VaultPage() {
  const { role } = useAuthStore();
  const { data: vaultData, isLoading: loadingVault, mutate: mutateVault } = useSWR<VaultData>('/vault');
  const { data: transactions = [], isLoading: loadingTx, mutate: mutateTx } = useSWR<VaultTransaction[]>('/vault/transactions');
  const { data: profitReport, isLoading: loadingProfit, mutate: mutateProfit } = useSWR<ProfitReport>('/vault/profit-report');

  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  
  // Modales de Acción Rápida
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'RETIRO_UTILIDAD' | 'GASTO_OPERATIVO' | 'ENTRADA_MANUAL'>('RETIRO_UTILIDAD');
  const [actionAmount, setActionAmount] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Ajuste de Saldo (Auditoría)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const refreshAll = () => {
    mutateVault();
    mutateTx();
    mutateProfit();
  };

  const handleOpenActionModal = (type: 'RETIRO_UTILIDAD' | 'GASTO_OPERATIVO' | 'ENTRADA_MANUAL') => {
    setActionType(type);
    setActionAmount('');
    setActionDescription('');
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido mayor a cero');
      return;
    }
    if (!actionDescription.trim()) {
      toast.error('Ingresa un concepto o descripción');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/vault/transaction', {
        type: actionType,
        amount,
        description: actionDescription.trim(),
      });

      const label =
        actionType === 'RETIRO_UTILIDAD'
          ? 'Retiro de utilidad'
          : actionType === 'GASTO_OPERATIVO'
          ? 'Gasto operativo'
          : 'Entrada manual de capital';

      toast.success(`${label} registrado por $${amount.toFixed(2)}`);
      setIsActionModalOpen(false);
      refreshAll();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar transacción en Caja Grande'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBal = parseFloat(newBalanceInput);
    if (isNaN(newBal) || newBal < 0) {
      toast.error('Ingresa un saldo válido');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Justifica el motivo del ajuste');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/vault/adjust', {
        newBalance: newBal,
        description: adjustReason.trim(),
      });

      toast.success(`Saldo de Caja Grande ajustado a $${newBal.toFixed(2)}`);
      setIsAdjustModalOpen(false);
      refreshAll();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al ajustar saldo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = selectedTypeFilter
    ? transactions.filter((t) => t.type === selectedTypeFilter)
    : transactions;

  const currentBalance = vaultData?.vault.balance ?? 0;
  const metrics = vaultData?.metrics;

  const getTypeBadge = (type: VaultTransaction['type']) => {
    switch (type) {
      case 'DEPOSITO_CORTE':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px]">Corte de Caja</Badge>;
      case 'EGRESO_PROVEEDOR':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-[10px]">Pago Proveedor</Badge>;
      case 'RETIRO_UTILIDAD':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold text-[10px]">Retiro Utilidad</Badge>;
      case 'GASTO_OPERATIVO':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px]">Gasto Operativo</Badge>;
      case 'ENTRADA_MANUAL':
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 font-bold text-[10px]">Entrada Capital</Badge>;
      case 'AJUSTE_SALDO':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 font-bold text-[10px]">Ajuste Saldo</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <PinLockGuard>
      <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                Caja Grande (Bóveda Principal)
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                Tesorería central, retiros de utilidad, pagos a proveedores y ganancias netas del negocio.
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={refreshAll}
            className="text-xs font-extrabold h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refrescar
          </Button>
        </div>

        {/* TARJETA DE SALDO PRINCIPAL + ACCIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* TARJETA SALDO EN VIVO */}
          <Card className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" /> Saldo Actual en Bóveda
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewBalanceInput(currentBalance.toString());
                    setAdjustReason('');
                    setIsAdjustModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-indigo-100 dark:border-slate-700"
                >
                  Ajustar Saldo
                </button>
              </div>

              <div className="mt-4">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  ${currentBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1.5">
                  Efectivo total resguardado acumulado de cortes y movimientos.
                </p>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN EN TARJETA */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              <button
                type="button"
                onClick={() => handleOpenActionModal('RETIRO_UTILIDAD')}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center border border-slate-200/80 dark:border-slate-700/80"
              >
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Retirar Utilidad</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenActionModal('GASTO_OPERATIVO')}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center border border-slate-200/80 dark:border-slate-700/80"
              >
                <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Registrar Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenActionModal('ENTRADA_MANUAL')}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center border border-slate-200/80 dark:border-slate-700/80"
              >
                <PlusCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Ingresar Capital</span>
              </button>
            </div>
          </Card>

          {/* MÉTRICAS ACUMULADAS */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Depósitos de Cortes</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  +${(metrics?.totalDepositsFromClosures || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Transferido de Cajas</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pagos Proveedor</span>
                <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                  -${(metrics?.totalSupplierPayments || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Pagado desde Bóveda</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Retiros Utilidad</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                  -${(metrics?.totalProfitWithdrawals || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Ganancias Retiradas</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gastos Operativos</span>
                <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                  -${(metrics?.totalOperationalExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Servicios, Renta, etc.</span>
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DE ANÁLISIS DE GANANCIA REAL NETA */}
        {profitReport && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-black text-slate-850 dark:text-slate-100">
                  Análisis de Ganancia Real Neta del Negocio
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cálculo en Tiempo Real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ventas Totales Brutas</span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                  ${profitReport.grossRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Costo de Mercancía Vendida</span>
                <div className="text-lg font-black text-slate-600 dark:text-slate-300 mt-1">
                  -${profitReport.costOfGoodsSold.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase block">Utilidad Bruta</span>
                <div className="text-lg font-black text-indigo-650 dark:text-indigo-300 mt-1">
                  ${profitReport.grossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase block">Ganancia Real Neta</span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  ${profitReport.netRealProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLA HISTORIAL DE MOVIMIENTOS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-black text-slate-850 dark:text-slate-100">
                Historial de Movimientos en Bóveda
              </h2>
            </div>

            <div className="w-full sm:w-64">
              <CustomSelect
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                placeholder="Todos los tipos de movimiento"
                options={[
                  { value: '', label: 'Todos los movimientos' },
                  { value: 'DEPOSITO_CORTE', label: 'Cierres de Caja Chica' },
                  { value: 'EGRESO_PROVEEDOR', label: 'Pagos a Proveedores' },
                  { value: 'RETIRO_UTILIDAD', label: 'Retiros de Utilidad' },
                  { value: 'GASTO_OPERATIVO', label: 'Gastos Operativos' },
                  { value: 'ENTRADA_MANUAL', label: 'Entradas de Capital' },
                  { value: 'AJUSTE_SALDO', label: 'Ajustes de Saldo' },
                ]}
              />
            </div>
          </div>

          {loadingTx ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs">Cargando movimientos de la bóveda...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Landmark className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-500 font-bold text-xs">No hay movimientos registrados en Caja Grande</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha / Hora</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo Movimiento</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Concepto / Referencia</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Registrado Por</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Monto</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Saldo Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <TableRow key={tx.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell>{getTypeBadge(tx.type)}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tx.description}
                          {tx.purchase?.supplier && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              Proveedor: {tx.purchase.supplier.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-500">
                          {tx.createdByName || tx.cashRegister?.openedBy || 'Administrador'}
                        </TableCell>
                        <TableCell className={`text-xs font-black text-right ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPositive ? '+' : ''}${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-right text-slate-700 dark:text-slate-300">
                          ${tx.balanceAfter.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* MODAL REGISTRAR MOVIMIENTO MANUAL (RETIRO / GASTO / ENTRADA) */}
        <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-base font-black text-slate-850 dark:text-slate-100">
                {actionType === 'RETIRO_UTILIDAD' && 'Retirar Utilidades / Ganancias'}
                {actionType === 'GASTO_OPERATIVO' && 'Registrar Gasto Operativo'}
                {actionType === 'ENTRADA_MANUAL' && 'Inyectar Capital a Bóveda'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {actionType === 'RETIRO_UTILIDAD' && 'Retira ganancias acumuladas de la Caja Grande hacia tus fondos personales.'}
                {actionType === 'GASTO_OPERATIVO' && 'Registra un gasto del negocio (renta, luz, nómina extra, servicios).'}
                {actionType === 'ENTRADA_MANUAL' && 'Ingresa dinero en efectivo extra a la Caja Grande.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitAction} className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Monto ($) *</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="h-10 text-xs font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Concepto / Descripción *</label>
                <Input
                  type="text"
                  placeholder={
                    actionType === 'RETIRO_UTILIDAD'
                      ? 'Ej. Retiro de ganancias del mes'
                      : actionType === 'GASTO_OPERATIVO'
                      ? 'Ej. Pago recibo de Luz de la tienda'
                      : 'Ej. Inyección de capital inicial'
                  }
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  className="h-10 text-xs font-bold"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  className="text-xs font-bold h-10 rounded-xl px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !actionAmount || !actionDescription.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl px-5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Movimiento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL AUDITORÍA / AJUSTE DE SALDO */}
        <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-base font-black text-slate-850 dark:text-slate-100">
                Ajustar Saldo Real de Bóveda
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Corrige el saldo total de la Caja Grande tras un arqueo o auditoría física.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nuevo Saldo Real en Bóveda ($) *</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={newBalanceInput}
                  onChange={(e) => setNewBalanceInput(e.target.value)}
                  className="h-10 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Justificación del Ajuste *</label>
                <Input
                  type="text"
                  placeholder="Ej. Arqueo físico de billetes y monedas"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="h-10 text-xs font-bold"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-xs font-bold h-10 rounded-xl px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newBalanceInput || !adjustReason.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl px-5 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </PinLockGuard>
  );
}
