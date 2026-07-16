import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface SuspendedCartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspendedCarts: Array<{
    id: string;
    name: string;
    items: Array<{ quantity: number; name: string; total: number }>;
    discount: number;
  }>;
  onResume: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function SuspendedCartsDialog({
  open,
  onOpenChange,
  suspendedCarts,
  onResume,
  onDelete,
}: SuspendedCartsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <History className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
            Ventas en Espera
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-450">
            Selecciona una venta para reanudar el cobro en el carrito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {suspendedCarts.length > 0 ? (
            suspendedCarts.map((cart) => {
              const totalAmount = cart.items.reduce((acc, i) => acc + i.total, 0) - cart.discount;
              const itemsNames = cart.items.map((i) => `${i.quantity.toFixed(0)}x ${i.name}`).join(', ');

              return (
                <div key={cart.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-slate-850 dark:text-slate-150 block truncate text-xs">{cart.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-1" title={itemsNames}>
                      {itemsNames}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-slate-805 dark:text-slate-200 text-xs mr-1">${totalAmount.toFixed(2)}</span>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-8 rounded-lg active:scale-95 transition-all cursor-pointer"
                      onClick={() => onResume(cart.id, cart.name)}
                    >
                      Reanudar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-550 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                      onClick={() => onDelete(cart.id, cart.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-slate-550">
              No hay ventas en espera.
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" className="text-xs rounded-xl w-full cursor-pointer" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
