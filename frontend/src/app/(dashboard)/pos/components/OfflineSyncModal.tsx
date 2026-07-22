import React from 'react';
import { Wifi, RefreshCw, Trash2, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOfflineStore, QueuedSale } from '@/store/useOfflineStore';

interface OfflineSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfflineSyncModal({ open, onOpenChange }: OfflineSyncModalProps) {
  const {
    isOnline,
    isSyncing,
    queuedSales,
    syncOfflineSales,
    removeQueuedSale,
  } = useOfflineStore();

  const totalAmount = queuedSales.reduce((acc, sale) => {
    const saleTotal = sale.items.reduce((sub, item) => sub + (item.genericPrice || 0) * item.quantity, 0);
    return acc + Math.max(0, saleTotal - (sale.discount || 0));
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl max-h-[88vh] flex flex-col">
        {/* HEADER */}
        <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100">
                  Cola de Ventas Offline
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  Ventas guardadas localmente pendientes de sincronizar con el servidor.
                </DialogDescription>
              </div>
            </div>

            {/* BADGE CONEXIÓN */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/40'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/40'
            }`}>
              {isOnline ? '● Conectado' : '○ Sin Internet'}
            </span>
          </div>
        </DialogHeader>

        {/* RESUMEN DE COLA */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between my-1">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Retenidas</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
              {queuedSales.length} ticket(s)
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto Total Retenido</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* LISTA DE VENTAS RETENIDAS */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 text-xs max-h-[340px]">
          {queuedSales.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/80" />
              <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">¡Todo al día!</p>
              <p className="text-xs text-slate-400 max-w-xs">No tienes ventas pendientes por sincronizar en este dispositivo.</p>
            </div>
          ) : (
            queuedSales.map((sale: QueuedSale) => {
              const formattedDate = sale.createdAt
                ? new Intl.DateTimeFormat('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(sale.createdAt))
                : 'Reciente';

              const isError = sale.status === 'ERROR';
              const isSyncingItem = sale.status === 'SYNCING';

              return (
                <div
                  key={sale.tempId}
                  className={`p-3 rounded-2xl border transition-all ${
                    isError
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : isSyncingItem
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 animate-pulse'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          #{sale.tempId.slice(-8)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formattedDate}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {sale.paymentMethod}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-700 dark:text-slate-200">
                        {sale.items.length} artículo(s)
                      </div>

                      {/* DETALLE ERROR */}
                      {isError && sale.errorMessage && (
                        <div className="flex items-start gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-medium bg-rose-100/50 dark:bg-rose-950/50 p-2 rounded-xl mt-1">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{sale.errorMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* BOTÓN DESCHARTAR */}
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                        title="Descartar esta venta"
                        onClick={() => removeQueuedSale(sale.tempId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>

          <Button
            type="button"
            disabled={!isOnline || isSyncing || queuedSales.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            onClick={syncOfflineSales}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todo Ahora'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
