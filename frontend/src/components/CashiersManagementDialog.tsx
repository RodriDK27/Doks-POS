'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, KeyRound, Check } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

  // Estado para edición inline de PIN/Sueldo de cajeros existentes
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');

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
      });
      toast.success(`Cajero "${newCashierName.trim()}" registrado con su PIN.`);
      setNewCashierName('');
      setNewCashierPin('');
      setNewHourlyRate('');
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar el cajero.'));
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
      });
      toast.success('PIN / Sueldo actualizado correctamente.');
      setEditingId(null);
      setEditPin('');
      setEditHourlyRate('');
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar el cajero.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCashier = async (id: string, name: string) => {
    try {
      await api.delete(`/auth/cashiers/${id}`);
      toast.success(`Cajero "${name}" removido de la plantilla.`);
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al eliminar el cajero.'));
    }
  };

  const cashierList = cashiers.filter(c => c.role === 'CAJERO');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-indigo-600" /> Plantilla de Cajeros y PINs
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-450 dark:text-slate-400">
            Administra cajeros existentes o registra nuevos con su propio PIN único de 4 dígitos.
          </DialogDescription>
        </DialogHeader>

        {/* FORMULARIO AGREGAR CAJERO CON SU PIN */}
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

          <Button
            type="submit"
            disabled={submitting || !newCashierName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl cursor-pointer mt-1 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 mr-1" /> Registrar Cajero y PIN
          </Button>
        </form>

        {/* LISTA DE CAJEROS EXISTENTES */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Cajeros Registrados ({cashierList.length})
          </span>

          {cashierList.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-2 space-y-1">
              {cashierList.map((cashier) => {
                const isEditing = editingId === cashier.id;

                return (
                  <div key={cashier.id} className="p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {cashier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{cashier.name}</span>
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
                            }
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span className="text-[10px]">{isEditing ? 'Cancelar' : 'Cambiar PIN'}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                          title="Eliminar cajero"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* FORMULARIO EDITAR PIN INLINE */}
                    {isEditing && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-xl">
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

                        <div className="col-span-2 flex justify-end mt-1">
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
            <p className="text-xs text-slate-400 italic text-center py-4">No hay cajeros registrados aún.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
