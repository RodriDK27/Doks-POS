'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Clock, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Calculator, 
  Unlock, 
  Lock, 
  BadgeAlert,
  Coins,
  ChevronRight
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

interface CashTransaction {
  id: string;
  amount: number;
  type: 'INGRESO' | 'EGRESO';
  description: string;
  createdAt: string;
}

interface CashRegister {
  id: string;
  openedBy: string;
  openedAt: string;
  closedAt: string | null;
  initialBalance: number;
  expectedBalance: number;
  actualBalance: number | null;
  status: 'ABIERTO' | 'CERRADO';
  notes: string | null;
  transactions: CashTransaction[];
}

export default function RegisterPage() {
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados Formulario Apertura
  const [openForm, setOpenForm] = useState({
    openedBy: '',
    initialBalance: 0,
  });

  // Estados Formulario Ajuste Manual (Ingreso / Egreso)
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    type: 'EGRESO' as 'INGRESO' | 'EGRESO',
    amount: 0,
    description: '',
  });

  // Estados Cierre de Caja
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number | null>(null);
  const [closeNotes, setCloseNotes] = useState('');

  // CALCULADORA DE BILLETES Y MONEDAS (MXN)
  const [billCounts, setBillCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
    0.5: 0,
  });

  const fetchCajaData = async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes] = await Promise.all([
        api.get('/register/active'),
        api.get('/register'),
      ]);
      setActiveRegister(activeRes.data);
      
      const cleanHistory = historyRes.data.filter((c: any) => c.status === 'CERRADO');
      setHistory(cleanHistory);
    } catch (error) {
      console.error('Error loading register data:', error);
      toast.error('No se pudo cargar la información de caja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajaData();
  }, []);

  const calculatedSum = Object.entries(billCounts).reduce(
    (acc, [value, qty]) => acc + parseFloat(value) * (qty || 0),
    0
  );

  const applyCalculatedToClose = () => {
    setCountedCash(calculatedSum);
  };

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.openedBy.trim()) {
      toast.error('El nombre del cajero es obligatorio.');
      return;
    }
    if (openForm.initialBalance < 0) {
      toast.error('El fondo inicial de caja no puede ser negativo.');
      return;
    }

    try {
      await api.post('/register/open', openForm);
      toast.success('¡Turno de caja abierto correctamente!');
      setOpenForm({ openedBy: '', initialBalance: 0 });
      fetchCajaData();
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al abrir caja.');
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjForm.amount <= 0) {
      toast.error('El monto debe ser un valor positivo mayor a cero.');
      return;
    }
    if (!adjForm.description.trim()) {
      toast.error('La descripción del movimiento es obligatoria.');
      return;
    }

    try {
      await api.post('/register/transaction', adjForm);
      toast.success(
        adjForm.type === 'EGRESO' 
          ? `Egreso por $${adjForm.amount} registrado.` 
          : `Ingreso por $${adjForm.amount} registrado.`
      );
      setIsAdjOpen(false);
      setAdjForm({ type: 'EGRESO', amount: 0, description: '' });
      fetchCajaData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar movimiento.');
    }
  };

  const handleCloseRegister = async () => {
    if (countedCash === null || countedCash < 0) {
      toast.error('Debe capturar la cantidad total contada en el cajón.');
      return;
    }

    try {
      const active = activeRegister;
      await api.post('/register/close', {
        actualBalance: countedCash,
        notes: closeNotes.trim() || undefined,
      });

      if (active) {
        const diff = countedCash - active.expectedBalance;
        if (diff === 0) {
          toast.success('Caja cerrada con éxito. ¡Todo cuadra perfecto!');
        } else if (diff < 0) {
          toast.warning(`Caja cerrada. FALTANTE detectado: -$${Math.abs(diff).toFixed(2)}`);
        } else {
          toast.info(`Caja cerrada. SOBRANTE detectado: +$${diff.toFixed(2)}`);
        }
      }

      setIsCloseOpen(false);
      setCountedCash(null);
      setCloseNotes('');
      
      setBillCounts({
        1000: 0,
        500: 0,
        200: 0,
        100: 0,
        50: 0,
        20: 0,
        10: 0,
        5: 0,
        2: 0,
        1: 0,
        0.5: 0,
      });

      fetchCajaData();
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cerrar la caja.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-650"></div>
      </div>
    );
  }

  const discrepancy = countedCash !== null && activeRegister 
    ? countedCash - activeRegister.expectedBalance 
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
          Control Financiero
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cortes de Caja</h1>
      </div>

      {activeRegister ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL PRINCIPAL: SALDO Y ACCIONES */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-indigo-650 rounded-full"></span>
                    Turno Activo
                  </span>
                  <CardTitle className="text-lg font-bold text-slate-800 mt-1">Caja Chica Abierta</CardTitle>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase py-0.5 px-2">ABIERTA</Badge>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1 text-xs">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">Cajero a cargo</span>
                    <p className="font-bold text-slate-800 text-sm">{activeRegister.openedBy}</p>
                    <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5" /> Abierto el {new Date(activeRegister.openedAt).toLocaleDateString()} a las {new Date(activeRegister.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl space-y-1 text-right">
                    <span className="text-indigo-600 font-semibold uppercase text-[9px] block text-left">Efectivo en Cajón</span>
                    <span className="text-3xl font-black text-indigo-600 block tracking-tight">
                      ${activeRegister.expectedBalance.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-medium">Fondo inicial: ${activeRegister.initialBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* ACCIONES TÁCTILES GRANDES */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      onClick={() => {
                        setAdjForm({ type: 'INGRESO', amount: 0, description: '' });
                        setIsAdjOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Registrar Entrada
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 text-rose-500 border-rose-100 hover:bg-rose-50 font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      onClick={() => {
                        setAdjForm({ type: 'EGRESO', amount: 0, description: '' });
                        setIsAdjOpen(true);
                      }}
                    >
                      <ArrowDownLeft className="h-4 w-4" /> Registrar Egreso (Gasto)
                    </Button>
                    <Button 
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      onClick={() => {
                        setCountedCash(null);
                        setCloseNotes('');
                        setIsCloseOpen(true);
                      }}
                    >
                      <Lock className="h-4 w-4" /> Cerrar Turno
                    </Button>
                  </div>
                  <Link href="/tickets" className="block w-full">
                    <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      Consultar Historial de Tickets Vendidos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* BITÁCORA DE MOVIMIENTOS RECIENTES DE ESTE TURNO */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <History className="h-4 w-4 text-indigo-600" /> Historial de Movimientos de Turno
              </h3>
              
              <div className="border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                {activeRegister.transactions && activeRegister.transactions.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b">
                        <TableHead className="text-xs font-bold text-slate-500">Concepto</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 w-24">Tipo</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Monto</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {activeRegister.transactions.map((t) => (
                        <TableRow key={t.id} className="hover:bg-slate-50/20 border-b">
                          <TableCell className="font-bold text-xs text-slate-700">{t.description}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={t.type === 'INGRESO' 
                                ? 'text-emerald-600 bg-emerald-50 border-none text-[8px] font-black' 
                                : 'text-rose-500 bg-rose-50 border-none text-[8px] font-black'
                              }
                            >
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-black text-xs ${t.amount < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            ${Math.abs(t.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-slate-400 text-[10px]">
                            {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se han registrado movimientos de efectivo manuales en esta sesión.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CALCULADORA DE MONEDAS Y BILLETES LATERAL */}
          <div className="space-y-6">
            <Card className="border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-650" />
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-800">Calculadora de Caja</CardTitle>
                    <CardDescription className="text-[9px]">Suma física de monedas y billetes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5">
                  {[1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5].map((value) => (
                    <div key={value} className="flex justify-between items-center text-xs gap-3">
                      <span className="font-bold text-slate-400 shrink-0 w-24">
                        {value >= 20 ? `$${value} Billete` : `$${value.toFixed(1)} Moneda`}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="h-8 text-center text-xs font-bold focus-visible:ring-indigo-500 rounded-lg pr-0"
                        value={billCounts[value] || ''}
                        onChange={(e) => 
                          setBillCounts({ 
                            ...billCounts, 
                            [value]: Math.max(0, parseInt(e.target.value) || 0) 
                          })
                        }
                      />
                      <span className="font-black text-slate-700 text-right w-16 shrink-0">
                        ${((billCounts[value] || 0) * value).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-50 pt-3 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-500">Suma Contada:</span>
                    <span className="text-lg font-black text-indigo-650">${calculatedSum.toFixed(2)}</span>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full text-xs font-extrabold border-slate-200 hover:bg-slate-50 h-10 rounded-xl"
                    onClick={() => {
                      applyCalculatedToClose();
                      setIsCloseOpen(true);
                    }}
                  >
                    Usar Conteo para Cierre
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* APERTURA DE CAJA */
        <div className="max-w-md mx-auto">
          <Card className="border-slate-100 bg-white shadow-lg rounded-2xl">
            <CardHeader className="text-center pb-4 border-b">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                <Unlock className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black tracking-tight mt-3 text-slate-800">Apertura de Turno</CardTitle>
              <CardDescription className="text-xs mt-1">
                Inicializa el cajón de cambio para comenzar a vender.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cajero de Turno *</label>
                  <Input
                    type="text"
                    required
                    placeholder="Ej. Juan, María, Admin..."
                    className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                    value={openForm.openedBy}
                    onChange={(e) => setOpenForm({ ...openForm, openedBy: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Fondo Inicial de Caja Chica ($) *</label>
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej. 500.00"
                    className="focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650"
                    value={openForm.initialBalance || ''}
                    onChange={(e) => setOpenForm({ ...openForm, initialBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-11 rounded-xl shadow-md active:scale-95 transition-all mt-2">
                  Abrir Turno de Caja
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HISTORIAL DE CORTES */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <History className="h-4.5 w-4.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historial de Turnos de Caja</h3>
        </div>

        <div className="border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
          {history.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b">
                  <TableHead className="text-xs font-bold text-slate-500">Cajero</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Apertura</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Cierre</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 w-24">F. Inicial</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Esperado</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Contado</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 w-20">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {history.map((c) => {
                  const actual = c.actualBalance || 0;
                  const diff = actual - c.expectedBalance;
                  
                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/20 border-b">
                      <TableCell className="font-bold text-xs text-slate-700">{c.openedBy}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {new Date(c.openedAt).toLocaleDateString()} {new Date(c.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {c.closedAt 
                          ? `${new Date(c.closedAt).toLocaleDateString()} ${new Date(c.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right text-slate-400 text-xs">
                        ${c.initialBalance.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 text-xs">
                        ${c.expectedBalance.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right text-slate-800 font-bold text-xs">
                        ${actual.toFixed(0)}
                      </TableCell>
                      <TableCell className={`text-right font-bold text-xs ${
                        diff === 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-amber-500'
                      }`}>
                        {diff > 0 ? '+' : ''}${diff.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No hay cortes pasados en el historial.
            </div>
          )}
        </div>
      </div>

      {/* DIÁLOGO REGISTRAR AJUSTE MANUAL (INGRESO / EGRESO) */}
      <Dialog open={isAdjOpen} onOpenChange={setIsAdjOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800 flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-indigo-600" /> 
              {adjForm.type === 'INGRESO' ? 'Registrar Entrada' : 'Registrar Egreso / Salida'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4 py-1 text-xs">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Monto ($) *</label>
              <Input
                type="number"
                step="any"
                required
                placeholder="0.00"
                className="focus-visible:ring-indigo-500 font-bold text-base h-11 text-indigo-650"
                value={adjForm.amount || ''}
                onChange={(e) => setAdjForm({ ...adjForm, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto / Motivo *</label>
              <Input
                type="text"
                required
                placeholder="Ej. Retiro para refrescos Coca-Cola..."
                className="focus-visible:ring-indigo-500 h-11 text-xs font-bold"
                value={adjForm.description}
                onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsAdjOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className={adjForm.type === 'EGRESO' 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 rounded-xl h-10' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 rounded-xl h-10'
                }
              >
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CIERRE DE CAJA (ARQUEAR Y CERRAR) */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-rose-500 flex items-center gap-1">
              <Lock className="h-5 w-5" /> Cierre de Turno
            </DialogTitle>
          </DialogHeader>

          {activeRegister && (
            <div className="space-y-4 py-1 text-xs">
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Cajero:</span>
                  <span className="font-bold text-slate-700">{activeRegister.openedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Fondo inicial:</span>
                  <span className="font-bold text-slate-700">${activeRegister.initialBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span className="text-slate-500">Esperado en caja:</span>
                  <span className="font-bold text-indigo-650">${activeRegister.expectedBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Efectivo Real Contado ($) *</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    className="focus-visible:ring-indigo-500 font-bold text-lg h-11 text-slate-700"
                    value={countedCash !== null ? countedCash : ''}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11 border-slate-200 px-3 text-xs flex items-center gap-1 font-bold shrink-0 rounded-xl"
                    onClick={applyCalculatedToClose}
                  >
                    <Calculator className="h-4 w-4" /> Pegar Arqueo
                  </Button>
                </div>
              </div>

              {countedCash !== null && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  discrepancy === 0 
                    ? 'border-emerald-100 bg-emerald-50/10 text-emerald-600' 
                    : discrepancy < 0 
                    ? 'border-rose-100 bg-rose-50/10 text-rose-500' 
                    : 'border-amber-100 bg-amber-50/10 text-amber-600'
                }`}>
                  <BadgeAlert className="h-5 w-5 shrink-0" />
                  <div>
                    {discrepancy === 0 && <p className="font-bold">¡Caja Cuadrada!</p>}
                    {discrepancy < 0 && <p className="font-bold">Faltante: -${Math.abs(discrepancy).toFixed(2)}</p>}
                    {discrepancy > 0 && <p className="font-bold">Sobrante: +${discrepancy.toFixed(2)}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Notas del Cierre</label>
                <Input
                  type="text"
                  placeholder="Ej. Caja entregada a turno nocturno..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="focus-visible:ring-indigo-500 h-10 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsCloseOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-5" 
              onClick={handleCloseRegister}
            >
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
