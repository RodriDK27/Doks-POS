import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Customer } from '../types';

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre completo es obligatorio'),
  phone: z.string().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional().or(z.literal('')),
  creditLimit: z.number().min(0, 'El límite de crédito no puede ser negativo'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer: Customer | null;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  editingCustomer,
  onSubmit,
}: CustomerFormDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      creditLimit: 0,
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editingCustomer?.name || '',
        phone: editingCustomer?.phone || '',
        address: editingCustomer?.address || '',
        creditLimit: editingCustomer?.creditLimit ?? 0,
      });
    }
  }, [open, editingCustomer, reset]);

  const onFormSubmit = async (values: CustomerFormValues) => {
    await onSubmit(values);
  };

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

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-1 text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre Completo *</label>
            <Input
              type="text"
              placeholder="Ej. María del Carmen, Don Pancho..."
              className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold ${errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.name.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Teléfono</label>
              <Input
                type="text"
                placeholder="Ej. 5512345678"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                {...register('phone')}
              />
              {errors.phone && (
                <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.phone.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Límite de Crédito ($) *</label>
              <Input
                type="number"
                placeholder="Ej. 1000.00"
                className={`focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650 ${errors.creditLimit ? 'border-rose-500' : ''}`}
                {...register('creditLimit', { valueAsNumber: true })}
              />
              {errors.creditLimit && (
                <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.creditLimit.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Dirección / Notas de Contacto</label>
            <Input
              type="text"
              placeholder="Ej. Casa de portón azul en la esquina..."
              className="focus-visible:ring-indigo-500 h-10 text-xs"
              {...register('address')}
            />
            {errors.address && (
              <span className="text-[9px] text-rose-500 font-bold block mt-0.5">{errors.address.message}</span>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
