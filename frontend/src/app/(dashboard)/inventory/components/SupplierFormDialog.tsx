import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Calendar, Truck } from 'lucide-react';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierForm: {
    name: string;
    phone: string;
    address: string;
    orderDays: string;
    deliveryDays: string;
  };
  setSupplierForm: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    address: string;
    orderDays: string;
    deliveryDays: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  editingSupplierId?: string | null;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_INITIALS: Record<string, string> = {
  'Lunes': 'L',
  'Martes': 'M',
  'Miércoles': 'M',
  'Jueves': 'J',
  'Viernes': 'V',
  'Sábado': 'S',
  'Domingo': 'D',
};

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplierForm,
  setSupplierForm,
  onSubmit,
  editingSupplierId,
}: SupplierFormDialogProps) {

  const toggleDay = (field: 'orderDays' | 'deliveryDays', day: string) => {
    const currentVal = supplierForm[field] || '';
    const days = currentVal ? currentVal.split(',') : [];
    let nextDays: string[];
    if (days.includes(day)) {
      nextDays = days.filter((d) => d !== day);
    } else {
      nextDays = [...days, day];
    }
    setSupplierForm({
      ...supplierForm,
      [field]: nextDays.join(','),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">
            {editingSupplierId ? 'Editar Proveedor' : 'Registrar Proveedor'}
          </DialogTitle>
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

          {/* DÍAS DE PEDIDO */}
          <div className="space-y-2 pt-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Días de Visita / Pedido (Preventa)
            </label>
            <div className="flex gap-1.5 justify-between">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (supplierForm.orderDays || '').split(',').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay('orderDays', day)}
                    className={cn(
                      "h-8 w-8 rounded-full text-[10px] font-extrabold transition-all border flex items-center justify-center cursor-pointer",
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    title={day}
                  >
                    {DAY_INITIALS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DÍAS DE ENTREGA */}
          <div className="space-y-2 pt-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-emerald-500" /> Días de Entrega de Mercancía
            </label>
            <div className="flex gap-1.5 justify-between">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (supplierForm.deliveryDays || '').split(',').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay('deliveryDays', day)}
                    className={cn(
                      "h-8 w-8 rounded-full text-[10px] font-extrabold transition-all border flex items-center justify-center cursor-pointer",
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    title={day}
                  >
                    {DAY_INITIALS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="text-xs rounded-xl h-10 px-5" 
              onClick={() => onOpenChange(false)}
            >
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
