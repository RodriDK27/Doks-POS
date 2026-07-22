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
      <DialogContent className="w-[92vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{editingSupplierId ? 'Editar Proveedor' : 'Registrar Proveedor'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-3 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nombre de la Empresa / Marca *
            </label>
            <Input
              type="text"
              required
              placeholder="Ej. Coca-Cola, Sabritas, Bimbo..."
              className="focus-visible:ring-indigo-500 h-11 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Teléfono de Ejecutivo
              </label>
              <Input
                type="text"
                placeholder="Ej. 5512345678"
                className="focus-visible:ring-indigo-500 h-11 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Dirección / Notas
              </label>
              <Input
                type="text"
                placeholder="Ej. Ruta oriente..."
                className="focus-visible:ring-indigo-500 h-11 text-xs font-medium rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>
          </div>

          {/* DÍAS DE PEDIDO */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Días de Preventa / Pedido
              </span>
              <span className="text-[9px] font-medium text-slate-400 lowercase">(opcional)</span>
            </label>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (supplierForm.orderDays || '').split(',').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay('orderDays', day)}
                    className={cn(
                      "h-9 w-full rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    title={day}
                  >
                    <span>{DAY_INITIALS[day]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DÍAS DE ENTREGA */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Días de Entrega de Mercancía
              </span>
              <span className="text-[9px] font-medium text-slate-400 lowercase">(opcional)</span>
            </label>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (supplierForm.deliveryDays || '').split(',').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay('deliveryDays', day)}
                    className={cn(
                      "h-9 w-full rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                    title={day}
                  >
                    <span>{DAY_INITIALS[day]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 flex-row justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 sm:flex-none text-xs font-extrabold rounded-xl h-11 px-5 border-slate-200 dark:border-slate-800 cursor-pointer" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 rounded-xl h-11 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              Guardar Proveedor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

  );
}
