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
      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100">Estado de Cuenta</DialogTitle>
        </DialogHeader>

        {historyCustomer && (
          <div className="flex-grow overflow-hidden flex flex-col space-y-4 py-1 text-xs min-h-0">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shrink-0">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block text-sm">{historyCustomer.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Historial completo de deudas y pagos</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">Deuda actual</span>
                <span className="text-lg font-black text-rose-500 block mt-0.5">${historyCustomer.currentDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 space-y-3 min-h-0 scrollbar-none">
              {historyCustomer.creditTransactions && historyCustomer.creditTransactions.length > 0 ? (
                historyCustomer.creditTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge 
                          variant="outline" 
                          className={tx.type === 'ABONO' 
                            ? 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 border-none font-black text-[9px] uppercase px-2 py-0.5' 
                            : 'text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 border-none font-black text-[9px] uppercase px-2 py-0.5'
                          }
                        >
                          {tx.type}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1">
                          {new Date(tx.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        {/* El monto de abono reduce la deuda (mostrado en verde), el de deuda la aumenta (mostrado en rojo) */}
                        <span className={`text-sm font-black block ${tx.type === 'ABONO' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {tx.type === 'ABONO' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {tx.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-350 font-medium bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/30">
                        {tx.notes}
                      </p>
                    )}

                    {/* DETALLES DE PRODUCTOS FIADOS */}
                    {tx.type === 'DEUDA' && tx.sale && tx.sale.items && tx.sale.items.length > 0 && (
                      <div className="mt-1 bg-indigo-50/30 dark:bg-indigo-950/10 p-2.5 rounded-lg border border-indigo-100/30 dark:border-indigo-900/10">
                        <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 block mb-1">
                          Detalle de Compra (Ticket #{tx.sale.id}):
                        </span>
                        <div className="space-y-1 divide-y divide-indigo-100/30 dark:divide-indigo-900/10">
                          {tx.sale.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-[11px] text-slate-650 dark:text-slate-300 pt-1 first:pt-0">
                              <span className="font-medium">
                                <span className="text-indigo-650 dark:text-indigo-400 font-extrabold mr-1">{item.quantity}x</span> {item.productName}
                              </span>
                              <span className="font-extrabold text-slate-700 dark:text-slate-205">${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium border border-dashed rounded-xl flex flex-col items-center justify-center gap-2">
                  <span>No se han registrado movimientos históricos de crédito para este cliente.</span>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="pt-2 shrink-0">
          <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => onOpenChange(false)}>
            Cerrar Ventana
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
