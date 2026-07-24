'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, KeyRound, Check, ShieldCheck, UserCheck } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';

interface CashierItem {
  id: string;
  name: string;
  role: string;
  hourlyRate?: number;
}

interface CashiersManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashiers: CashierItem[];
  onCashiersUpdated: () => void;
}

export function CashiersManagementDialog({
  open,
  onOpenChange,
  cashiers,
  onCashiersUpdated,
}: CashiersManagementDialogProps) {
  const [newCashierName, setNewCashierName] = useState('');
  const [newCashierPin, setNewCashierPin] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [newRole, setNewRole] = useState<'CAJERO' | 'GERENTE'>('CAJERO');
  const [submitting, setSubmitting] = useState(false);

  // Estado para edición inline de PIN/Sueldo/Rol de empleados existentes
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editRole, setEditRole] = useState<'CAJERO' | 'GERENTE'>('CAJERO');

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashierName.trim()) return;

    if (newCashierPin && newCashierPin.length !== 4) {
      toast.error('El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/cashiers', {
        name: newCashierName.trim(),
        pin: newCashierPin.trim() || '0000',
        hourlyRate: newHourlyRate ? parseFloat(newHourlyRate) : 0,
        role: newRole,
      });
      toast.success(`Empleado "${newCashierName.trim()}" registrado como ${newRole === 'GERENTE' ? 'Gerente' : 'Cajero'}.`);
      setNewCashierName('');
      setNewCashierPin('');
      setNewHourlyRate('');
      setNewRole('CAJERO');
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar el empleado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCashier = async (id: string) => {
    if (editPin && editPin.length !== 4) {
      toast.error('El nuevo PIN debe tener exactamente 4 dígitos.');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/auth/cashiers/${id}`, {
        pin: editPin ? editPin : undefined,
        hourlyRate: editHourlyRate ? parseFloat(editHourlyRate) : undefined,
        role: editRole,
      });
      toast.success('Información y rol actualizados correctamente.');
      setEditingId(null);
      setEditPin('');
      setEditHourlyRate('');
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar el empleado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCashier = async (id: string, name: string) => {
    try {
      await api.delete(`/auth/cashiers/${id}`);
      toast.success(`Empleado "${name}" removido de la plantilla.`);
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al eliminar el empleado.'));
    }
  };

  // Excluir al ADMIN principal de la lista editable
  const employeeList = cashiers.filter(c => c.role !== 'ADMIN');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-indigo-600" /> Plantilla de Empleados y Roles
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Administra a tu personal, asigna roles de Gerente o Cajero y gestiona sus PINs de acceso.
          </DialogDescription>
        </DialogHeader>

        {/* FORMULARIO AGREGAR EMPLEADO */}
        <form onSubmit={handleCreateCashier} className="space-y-3 my-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre Completo *</label>
            <Input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={newCashierName}
              onChange={(e) => setNewCashierName(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">PIN (4 Dígitos)</label>
              <Input
                type="password"
                maxLength={4}
                placeholder="Ej. 1111"
                value={newCashierPin}
                onChange={(e) => setNewCashierPin(e.target.value.replace(/\D/g, ''))}
                className="h-10 text-xs font-bold rounded-xl text-center tracking-widest bg-white dark:bg-slate-900 border-slate-200"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pago / Hora (Opcional)</label>
              <Input
                type="number"
                step="0.50"
                placeholder="Sin sueldo fijo..."
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rol Asignado</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewRole('CAJERO')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newRole === 'CAJERO'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Cajero / Empleado
              </button>
              <button
                type="button"
                onClick={() => setNewRole('GERENTE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newRole === 'GERENTE'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Gerente
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !newCashierName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl cursor-pointer mt-1 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 mr-1" /> Registrar Empleado
          </Button>
        </form>

        {/* LISTA DE EMPLEADOS EXISTENTES */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Personal Registrado ({employeeList.length})
          </span>

          {employeeList.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-2 space-y-1">
              {employeeList.map((cashier) => {
                const isEditing = editingId === cashier.id;

                return (
                  <div key={cashier.id} className="p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          cashier.role === 'GERENTE'
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {cashier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{cashier.name}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                              cashier.role === 'GERENTE'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {cashier.role === 'GERENTE' ? 'Gerente' : 'Cajero'}
                            </span>
                          </div>
                          {cashier.hourlyRate && cashier.hourlyRate > 0 ? (
                            <span className="text-[9px] text-emerald-600 font-bold block">${cashier.hourlyRate}/hr</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 block">PIN asignado</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                            } else {
                              setEditingId(cashier.id);
                              setEditPin('');
                              setEditHourlyRate(cashier.hourlyRate ? String(cashier.hourlyRate) : '');
                              setEditRole((cashier.role as 'GERENTE' | 'CAJERO') || 'CAJERO');
                            }
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span className="text-[10px]">{isEditing ? 'Cancelar' : 'Editar / Rol'}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                          title="Eliminar empleado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* FORMULARIO EDITAR INLINE */}
                    {isEditing && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-xl">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nuevo PIN (4 Digits)</label>
                            <Input
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={editPin}
                              onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                              className="h-8 text-xs text-center font-bold bg-white dark:bg-slate-900 border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pago / Hora ($)</label>
                            <Input
                              type="number"
                              step="0.50"
                              placeholder="Sueldo..."
                              value={editHourlyRate}
                              onChange={(e) => setEditHourlyRate(e.target.value)}
                              className="h-8 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rol</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditRole('CAJERO')}
                              className={`py-1 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                editRole === 'CAJERO'
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200'
                              }`}
                            >
                              <UserCheck className="h-3 w-3" /> Cajero
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditRole('GERENTE')}
                              className={`py-1 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                editRole === 'GERENTE'
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200'
                              }`}
                            >
                              <ShieldCheck className="h-3 w-3" /> Gerente
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end mt-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCashier(cashier.id)}
                            disabled={submitting}
                            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg px-3 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">No hay empleados registrados aún.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
