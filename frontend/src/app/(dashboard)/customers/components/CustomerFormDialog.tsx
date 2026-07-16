import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Customer } from '../types';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer: Customer | null;
  formData: {
    name: string;
    phone: string;
    address: string;
    creditLimit: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    address: string;
    creditLimit: number;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  editingCustomer,
  formData,
  setFormData,
  onSubmit,
}: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">
            {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configura los datos del cliente y su límite máximo de fiado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
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
            <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
              Guardar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
