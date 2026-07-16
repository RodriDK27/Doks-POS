import React from 'react';
import { Calculator, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface CloseRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countedCash: number | null;
  setCountedCash: (val: number | null) => void;
  closeNotes: string;
  setCloseNotes: (val: string) => void;
  billCounts: Record<number, number>;
  setBillCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  calculatedSum: number;
  applyCalculatedToClose: () => void;
  onCloseRegister: () => void;
  activeRegisterExpected: number;
}

export function CloseRegisterDialog({
  open,
  onOpenChange,
  countedCash,
  setCountedCash,
  closeNotes,
  setCloseNotes,
  billCounts,
  setBillCounts,
  calculatedSum,
  applyCalculatedToClose,
  onCloseRegister,
  activeRegisterExpected,
}: CloseRegisterDialogProps) {
  const denominations = [
    { label: '$1,000 Pesos', val: 1000, isCoin: false },
    { label: '$500 Pesos', val: 500, isCoin: false },
    { label: '$200 Pesos', val: 200, isCoin: false },
    { label: '$100 Pesos', val: 100, isCoin: false },
    { label: '$50 Pesos', val: 50, isCoin: false },
    { label: '$20 Pesos', val: 20, isCoin: false },
    { label: '$10 Pesos', val: 10, isCoin: true },
    { label: '$5 Pesos', val: 5, isCoin: true },
    { label: '$2 Pesos', val: 2, isCoin: true },
    { label: '$1 Peso', val: 1, isCoin: true },
    { label: '50¢ Centavos', val: 0.5, isCoin: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 flex items-center gap-1.5">
            Cerrar Turno de Caja (Arqueo)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Compara el dinero esperado en el sistema con el efectivo físico en el cajón.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2 text-xs">
          {/* LADO IZQUIERDO: CALCULADORA DE EFECTIVO (7/12 ANCHO) */}
          <div className="md:col-span-7 space-y-3.5 border border-slate-100 bg-slate-50/50 p-3 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" /> Calculadora de Denominaciones
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {denominations.map((d) => (
                <div key={d.val} className="flex justify-between items-center gap-2">
                  <span className="font-bold text-[10px] text-slate-600 truncate">{d.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-8 w-16 text-center text-xs font-bold"
                      value={billCounts[d.val] || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBillCounts((prev) => ({ ...prev, [d.val]: val }));
                      }}
                    />
                    <span className="text-[10px] text-slate-400 w-16 text-right font-black">
                      ${((billCounts[d.val] || 0) * d.val).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-between items-center bg-indigo-50/20 p-2 rounded-lg">
              <div className="text-[10px] font-black text-indigo-700 flex items-center gap-1">
                <Coins className="h-4 w-4" /> Total Calculado: ${calculatedSum.toFixed(2)}
              </div>
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-755 text-white font-extrabold text-[10px] h-7 px-3.5 rounded-lg cursor-pointer"
                onClick={applyCalculatedToClose}
              >
                Copiar a Arqueo
              </Button>
            </div>
          </div>

          {/* LADO DERECHO: ARQUEO Y NOTAS (5/12 ANCHO) */}
          <div className="md:col-span-5 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Información de Arqueo</span>

              <div className="bg-slate-50 border p-3 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold">Esperado en Caja:</span>
                  <span className="font-bold text-slate-700">${activeRegisterExpected.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1.5 border-t">
                  <label className="text-[9px] font-bold text-slate-450 uppercase">Efectivo Real Contado ($)</label>
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    className="focus-visible:ring-indigo-500 h-9 font-black text-sm"
                    value={countedCash !== null ? countedCash : ''}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Notas / Observaciones</label>
                <textarea
                  placeholder="Ej. Retiro de caja sobrante, incidencias..."
                  rows={2}
                  className="w-full focus-visible:ring-indigo-500 rounded-xl border border-slate-200 p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs h-10 rounded-xl mt-3 active:scale-95 transition-all cursor-pointer"
              disabled={countedCash === null}
              onClick={onCloseRegister}
            >
              Confirmar Cierre de Turno
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
