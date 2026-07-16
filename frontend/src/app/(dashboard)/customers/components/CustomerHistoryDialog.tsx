import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer } from '../types';

interface CustomerHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyCustomer: Customer | null;
}

export function CustomerHistoryDialog({
  open,
  onOpenChange,
  historyCustomer,
}: CustomerHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Estado de Cuenta</DialogTitle>
        </DialogHeader>

        {historyCustomer && (
          <div className="space-y-4 py-1 text-xs">
            <div className="bg-slate-50 border p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-850 block text-xs">{historyCustomer.name}</span>
                <span className="text-[9px] text-slate-400">Historial completo de deudas y pagos</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400">Deuda actual</span>
                <span className="text-sm font-black text-rose-505 block">${historyCustomer.currentDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto pr-1 space-y-2 border rounded-xl divide-y">
              {historyCustomer.creditTransactions && historyCustomer.creditTransactions.length > 0 ? (
                historyCustomer.creditTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3">
                    <div>
                      <Badge 
                        variant="outline" 
                        className={tx.type === 'ABONO' 
                          ? 'text-emerald-650 bg-emerald-50 border-none font-bold text-[8px] uppercase px-1.5' 
                          : 'text-rose-500 bg-rose-50 border-none font-bold text-[8px] uppercase px-1.5'
                        }
                      >
                        {tx.type}
                      </Badge>
                      <span className="text-[9px] text-slate-400 block mt-1">{tx.notes || 'Movimiento registrado'}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      <span className={`text-xs font-black block mt-0.5 ${tx.type === 'ABONO' ? 'text-emerald-500' : 'text-rose-505'}`}>
                        {tx.type === 'ABONO' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No se han registrado movimientos históricos de crédito para este cliente.
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => onOpenChange(false)}>
            Cerrar Ventana
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
