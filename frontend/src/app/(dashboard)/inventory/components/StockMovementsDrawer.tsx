'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, SlidersHorizontal, Package } from 'lucide-react';
import { Product } from '../types';

interface StockMovement {
  id: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  reason: string | null;
  createdAt: string;
}

interface StockMovementsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  movements: StockMovement[];
  loading: boolean;
}

const typeConfig = {
  ENTRADA: {
    label: 'Entrada',
    icon: TrendingUp,
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-none',
    quantityClass: 'text-emerald-600 dark:text-emerald-400',
    sign: '+',
  },
  SALIDA: {
    label: 'Salida',
    icon: TrendingDown,
    badgeClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 border-none',
    quantityClass: 'text-rose-500 dark:text-rose-400',
    sign: '',
  },
  AJUSTE: {
    label: 'Ajuste',
    icon: SlidersHorizontal,
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-none',
    quantityClass: 'text-amber-600 dark:text-amber-400',
    sign: '',
  },
};

export function StockMovementsDrawer({
  open,
  onOpenChange,
  product,
  movements,
  loading,
}: StockMovementsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <SheetTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-indigo-600" />
            Bitácora de Stock
          </SheetTitle>
          {product && (
            <SheetDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {product.name}
              {product.category && (
                <span className="ml-2 text-indigo-500">[{product.category}]</span>
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Stock actual */}
        {product && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stock Actual
            </span>
            <span className={`text-2xl font-black ${
              product.stock === 0
                ? 'text-rose-500'
                : product.stock <= product.minStock
                ? 'text-amber-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}>
              {product.stock}
            </span>
          </div>
        )}

        {/* Movimientos */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-slate-200/60 dark:border-slate-800 rounded-xl p-3"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 rounded-lg" />
              </div>
            ))
          ) : movements.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs space-y-2">
              <SlidersHorizontal className="h-8 w-8 mx-auto text-slate-300" />
              <p>Sin movimientos registrados para este producto.</p>
              <p className="text-[10px]">Los movimientos se registran al vender, comprar o ajustar el stock manualmente.</p>
            </div>
          ) : (
            movements.map((mov) => {
              const config = typeConfig[mov.type as keyof typeof typeConfig] ?? typeConfig.AJUSTE;
              const Icon = config.icon;
              const sign = mov.quantity > 0 ? '+' : '';

              return (
                <div
                  key={mov.id}
                  className="border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      <Icon className={`h-4 w-4 ${config.quantityClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[9px] font-black px-1.5 py-0 ${config.badgeClass}`}>
                          {config.label}
                        </Badge>
                        <span className={`font-black text-sm ${config.quantityClass}`}>
                          {sign}{mov.quantity}
                        </span>
                      </div>
                      {mov.reason && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {mov.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(mov.createdAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {new Date(mov.createdAt).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
