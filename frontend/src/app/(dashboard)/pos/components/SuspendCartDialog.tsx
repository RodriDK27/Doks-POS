import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SuspendCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspendName: string;
  setSuspendName: (name: string) => void;
  onConfirm: () => void;
}

export function SuspendCartDialog({
  open,
  onOpenChange,
  suspendName,
  setSuspendName,
  onConfirm,
}: SuspendCartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-800 dark:text-slate-100">Suspender Venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-xs">
          <p className="text-slate-400 dark:text-slate-505">Identificador para recuperar la venta:</p>
          <Input
            type="text"
            placeholder="Ej. Sra. María, Clientes varios..."
            value={suspendName}
            onChange={(e) => setSuspendName(e.target.value)}
            className="focus-visible:ring-indigo-500 h-10 text-xs font-semibold dark:bg-slate-950"
          />
        </div>
        <DialogFooter className="pt-2 sm:justify-end gap-2">
          <Button variant="outline" className="text-xs rounded-xl cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl px-5 cursor-pointer"
            disabled={!suspendName.trim()}
            onClick={onConfirm}
          >
            Suspender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
