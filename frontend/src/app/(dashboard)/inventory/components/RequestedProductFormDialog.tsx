import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface RequestedProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; quantity: number; notes?: string }) => void;
}

export function RequestedProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: RequestedProductFormDialogProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      quantity,
      notes: notes.trim() || undefined,
    });
    setName('');
    setQuantity(1);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">Registrar Pedido Especial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase">Nombre del Artículo *</label>
            <Input
              type="text"
              required
              placeholder="Ej. Escoba de mijo, Lámpara led..."
              className="h-10 focus-visible:ring-indigo-500 text-xs font-bold dark:bg-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase">Cantidad Solicitada *</label>
            <Input
              type="number"
              required
              min={1}
              className="h-10 focus-visible:ring-indigo-500 text-xs font-bold dark:bg-slate-900"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase">Notas / Cliente que solicita</label>
            <Input
              type="text"
              placeholder="Ej. Sra. María (traer cuando compre)..."
              className="h-10 focus-visible:ring-indigo-500 text-xs dark:bg-slate-900"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" className="text-xs rounded-xl h-10 px-5" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 border-none">
              Guardar Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
