import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierForm: {
    name: string;
    phone: string;
    address: string;
  };
  setSupplierForm: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    address: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplierForm,
  setSupplierForm,
  onSubmit,
}: SupplierFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Registrar Proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre de la Empresa / Marca *</label>
            <Input
              type="text"
              required
              placeholder="Ej. Coca-Cola, Sabritas, Bimbo..."
              className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Teléfono de Repartidor / Ejecutivo</label>
            <Input
              type="text"
              placeholder="Ej. 5512345678"
              className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Dirección / Notas adicionales</label>
            <Input
              type="text"
              placeholder="Ej. Distribuidor regional oriente..."
              className="focus-visible:ring-indigo-500 h-10 text-xs"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
              Guardar Proveedor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
