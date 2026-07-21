'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, UserCheck } from 'lucide-react';
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

interface CashiersManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashiers: { id: string; name: string; role: string }[];
  onCashiersUpdated: () => void;
}

export function CashiersManagementDialog({
  open,
  onOpenChange,
  cashiers,
  onCashiersUpdated,
}: CashiersManagementDialogProps) {
  const [newCashierName, setNewCashierName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashierName.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/auth/cashiers', { name: newCashierName.trim() });
      toast.success(`Cajero "${newCashierName.trim()}" registrado con éxito.`);
      setNewCashierName('');
      onCashiersUpdated();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar el cajero.'));
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
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-indigo-600" /> Plantilla de Cajeros
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-450 dark:text-slate-400">
            Administra los cajeros habituales para seleccionarlos rápidamente al abrir turno.
          </DialogDescription>
        </DialogHeader>

        {/* FORMULARIO AGREGAR CAJERO */}
        <form onSubmit={handleCreateCashier} className="flex gap-2 my-2">
          <Input
            type="text"
            placeholder="Nombre del nuevo cajero..."
            value={newCashierName}
            onChange={(e) => setNewCashierName(e.target.value)}
            className="h-10 text-xs font-bold rounded-xl border-slate-200"
            disabled={submitting}
          />
          <Button
            type="submit"
            disabled={submitting || !newCashierName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-4 rounded-xl cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </form>

        {/* LISTA DE CAJEROS EXISTENTES */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Cajeros Registrados ({cashierList.length})
          </span>

          {cashierList.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 p-2">
              {cashierList.map((cashier) => (
                <div key={cashier.id} className="flex justify-between items-center py-2 px-2 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cashier.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Eliminar de la plantilla"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-6">
              No hay cajeros en la plantilla. Registra uno arriba.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
