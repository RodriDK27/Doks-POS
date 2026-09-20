import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface InventoryMetricsProps {
  totalProductsCount: number;
  totalInvestment: number;
  expectedProfit: number;
  lowStockCount: number;
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 px-3 py-2 min-w-0">
      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{label}</span>
      <span className={cn('text-base font-black block leading-tight', tone ?? 'text-slate-800 dark:text-slate-100')}>{value}</span>
      <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">{note}</span>
    </div>
  );
}

/**
 * Resumen general discreto, pensado para ir DENTRO del card del catálogo (sin borde propio):
 * una línea que se despliega al tocarla.
 */
export function InventoryMetrics({
  totalProductsCount,
  totalInvestment,
  expectedProfit,
  lowStockCount,
}: InventoryMetricsProps) {
  const { role } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[36px] flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
          Resumen general
        </span>
        <span className="flex items-center gap-2 min-w-0 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          <span className="truncate">{totalProductsCount} artículos</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className={cn('truncate', lowStockCount > 0 && 'text-amber-500')}>{lowStockCount} bajo stock</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div
          className={cn(
            'grid gap-2 pt-1 pb-1 animate-in fade-in duration-200',
            role === 'ADMIN' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
          )}
        >
          <Stat label="Catálogo" value={String(totalProductsCount)} note="Artículos distintos" />
          {role === 'ADMIN' && (
            <>
              <Stat label="Inversión neta" value={`$${totalInvestment.toFixed(0)}`} note="Costo de adquisición" />
              <Stat label="Ganancia estimada" value={`$${expectedProfit.toFixed(0)}`} note="Margen potencial" tone="text-indigo-600 dark:text-indigo-400" />
            </>
          )}
          <Stat
            label="Bajo stock"
            value={String(lowStockCount)}
            note="Artículos agotándose"
            tone={lowStockCount > 0 ? 'text-amber-500' : undefined}
          />
        </div>
      )}
    </div>
  );
}
