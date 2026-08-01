import React, { useState } from 'react';
import { Calculator, Coins, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CloseRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countedCash: number | null;
  setCountedCash: (val: number | null) => void;
  closeNotes: string;
  setCloseNotes: (val: string) => void;
  nextInitialBalance: number;
  setNextInitialBalance: (val: number) => void;
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
  nextInitialBalance,
  setNextInitialBalance,
  billCounts,
  setBillCounts,
  calculatedSum,
  applyCalculatedToClose,
  onCloseRegister,
  activeRegisterExpected,
}: CloseRegisterDialogProps) {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'CALCULATOR'>('DIRECT');

  const denominations = [
    { label: '$1,000', val: 1000 },
    { label: '$500', val: 500 },
    { label: '$200', val: 200 },
    { label: '$100', val: 100 },
    { label: '$50', val: 50 },
    { label: '$20', val: 20 },
    { label: '$10', val: 10 },
    { label: '$5', val: 5 },
    { label: '$2', val: 2 },
    { label: '$1', val: 1 },
    { label: '50¢', val: 0.5 },
  ];

  const diff = countedCash !== null ? countedCash - activeRegisterExpected : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* HEADER */}
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shrink-0">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100 leading-none">
                Cierre de Caja
              </DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                Ingresa el efectivo total o desgiosa billetes/monedas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 flex-1">

          {/* COMPARATIVA EN 2 COLUMNAS */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Sistema (Esperado)</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                ${activeRegisterExpected.toFixed(2)}
              </span>
            </div>

            <div className={cn(
              "p-3 rounded-2xl border transition-colors",
              diff === null
                ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800"
                : diff === 0
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                  : diff < 0
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                    : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40"
            )}>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {diff === null ? 'Diferencia' : diff === 0 ? 'Resultado Cuadrado' : diff < 0 ? 'Faltante' : 'Sobrante'}
              </span>
              <span className={cn(
                "text-base font-black block mt-0.5",
                diff === null ? "text-slate-400" : diff === 0 ? "text-emerald-600 dark:text-emerald-400" : diff < 0 ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
              )}>
                {diff === null ? '$0.00' : `${diff >= 0 ? '+' : '-'}$${Math.abs(diff).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* MONTO TOTAL DIRECTO */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Efectivo Físico en Cajón ($) *
              </label>
              {calculatedSum > 0 && (
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  Desglose: ${calculatedSum.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-indigo-600 dark:text-indigo-400">$</span>
              <Input
                type="number"
                step="any"
                required
                placeholder="0.00"
                className="focus-visible:ring-indigo-500 pl-8 h-11 text-base font-black bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl"
                value={countedCash !== null ? countedCash : ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* FONDO PARA EL SIGUIENTE TURNO Y PREVISIÓN BÓVEDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="space-y-1">
              <label className="text-[9.5px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Fondo a Dejar en Caja ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600 dark:text-indigo-400">$</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="500.00"
                  className="pl-7 h-9 text-xs font-black bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 rounded-xl"
                  value={nextInitialBalance}
                  onChange={(e) => setNextInitialBalance(parseFloat(e.target.value) || 0)}
                />
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Dinero reservado para cambio del próx. turno.</span>
            </div>

            <div className="flex flex-col justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-800/80">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                Depósito Automático a Caja Grande
              </span>
              <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +${Math.max(0, (countedCash || 0) - nextInitialBalance).toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Se acumulará en tu Bóveda Principal</span>
            </div>
          </div>

          {/* SECCIÓN DESGLOSE OPCIONAL RÁPIDO */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
            <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Desglose Opcional de Billetes y Monedas
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-none">
              {denominations.map((d) => (
                <div key={d.val} className="flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <span className="font-extrabold text-[10px] text-slate-600 dark:text-slate-300">{d.label}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="h-6 w-11 text-center text-xs font-black p-0 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg"
                    value={billCounts[d.val] || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const nextCounts = { ...billCounts, [d.val]: val };
                      setBillCounts(nextCounts);

                      const nextSum = Object.entries(nextCounts).reduce(
                        (acc, [denom, count]) => acc + parseFloat(denom) * (count || 0),
                        0
                      );
                      setCountedCash(nextSum);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* NOTAS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Notas del Turno (Opcional)
            </label>
            <textarea
              placeholder="Ej. Incidencias, motivo de faltante..."
              rows={2}
              className="w-full focus-visible:ring-indigo-500 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900 p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </div>
        </div>

        {/* ACCIONES FOOTER */}
        <div className="flex items-center gap-2 pt-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-10 rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            disabled={countedCash === null}
            onClick={onCloseRegister}
          >
            Confirmar Cierre de Turno
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
