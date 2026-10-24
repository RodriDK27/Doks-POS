'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Heart, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc } from '@/lib/productImages';
import { cn, formatQuantity } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { FAVORITES_KEY_PREFIX } from '../hooks/useFavoriteToggle';

/** Ajuste compartido por todos: a partir de cuántas ventas un producto entra solo a favoritos */
const SETTINGS_KEY = '/products/favorites/settings';

interface FavoriteStats {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unitType: 'PIECE' | 'WEIGHT' | string;
  category: string | null;
  imageUrl: string | null;
  /** Piezas (o kg) vendidas en el periodo */
  quantitySold: number;
  /** En cuántos tickets apareció */
  ticketCount: number;
  /** Está aquí por llegar al mínimo de ventas, no por tener corazón */
  isAuto: boolean;
}

const PERIODS = [
  { days: 0, label: 'Todo' },
  { days: 30, label: '30 días' },
  { days: 7, label: '7 días' },
] as const;

interface FavoritesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Consulta de favoritos: existencia y cuánto se ha vendido cada uno, del más al menos vendido */
export function FavoritesDialog({ open, onOpenChange }: FavoritesDialogProps) {
  const [days, setDays] = useState<number>(0);
  const key = `${FAVORITES_KEY_PREFIX}${days ? `?days=${days}` : ''}`;
  const { data, error, isLoading } = useSWR<FavoriteStats[]>(open ? key : null);
  const { data: settings } = useSWR<{ autoMinSales: number }>(open ? SETTINGS_KEY : null);
  const canConfigure = useAuthStore((s) => s.role === 'ADMIN' || s.role === 'GERENTE');
  const autoMinSales = settings?.autoMinSales ?? 0;

  const unit = (p: FavoriteStats) => (p.unitType === 'WEIGHT' ? 'kg' : 'pzas');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 max-w-[calc(100%-2.5rem)] sm:max-w-xl md:max-w-xl max-h-[calc(100dvh-6rem)] sm:max-h-[min(42rem,calc(100dvh-5rem))] rounded-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" /> Favoritos
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {autoMinSales > 0
              ? `Los que marcaste con corazón y los que tienen ${autoMinSales} ventas o más en el periodo, del más al menos vendido.`
              : 'Los productos que marcaste con corazón, del más al menos vendido.'}
          </DialogDescription>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 mt-2 w-fit">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs font-black cursor-pointer whitespace-nowrap',
                  days === p.days ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <AutoFavoritesSetting
            // Al cambiar el valor guardado, el campo se reinicia con él
            key={autoMinSales}
            autoMinSales={autoMinSales}
            canConfigure={canConfigure}
          />
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {isLoading && !data ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-xs font-bold text-rose-500">No se pudieron cargar los favoritos. Revisa la conexión.</p>
          ) : !data?.length ? (
            <div className="p-8 text-center space-y-2 text-slate-400">
              <Heart className="h-8 w-8 mx-auto" />
              <p className="text-xs font-bold">Aún no tienes favoritos.</p>
              <p className="text-[11px] font-semibold">
                {autoMinSales > 0
                  ? `Toca el corazón de un producto, o espera a que alguno llegue a ${autoMinSales} ventas en el periodo.`
                  : 'Toca el corazón de un producto para agregarlo aquí.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((p, i) => {
                const src = getProductImageSrc(p.imageUrl);
                const isOut = p.stock <= 0;
                const isLow = !isOut && p.stock <= p.minStock;
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-5 shrink-0 text-center text-[11px] font-black text-slate-400 tabular-nums">{i + 1}</span>
                    <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 dark:border-slate-800 bg-white overflow-hidden flex items-center justify-center">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
                        <img src={src} alt="" loading="lazy" crossOrigin="anonymous" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-0">
                        <span className="truncate">{p.name}</span>
                        {p.isAuto ? (
                          <span
                            title={`Entró solo por tener ${autoMinSales} ventas o más`}
                            className="inline-flex items-center gap-0.5 shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> Auto
                          </span>
                        ) : (
                          <Heart className="h-3 w-3 shrink-0 fill-rose-500 text-rose-500" />
                        )}
                      </p>
                      <p
                        className={cn(
                          'text-[11px] font-bold tabular-nums',
                          isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                        )}
                      >
                        {isOut ? 'Sin stock' : `Stock: ${formatQuantity(p.stock)} ${unit(p)}`}
                        {isLow && ' · bajo'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right tabular-nums leading-tight">
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {formatQuantity(p.quantitySold)} <span className="text-[10px] font-bold">{unit(p)}</span>
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        vendidos · {p.ticketCount} {p.ticketCount === 1 ? 'venta' : 'ventas'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AutoFavoritesSettingProps {
  autoMinSales: number;
  canConfigure: boolean;
}

/** "Agregar solos los que tengan N ventas o más": lo cambia administración y aplica para todos */
function AutoFavoritesSetting({ autoMinSales, canConfigure }: AutoFavoritesSettingProps) {
  const [draft, setDraft] = useState(autoMinSales > 0 ? String(autoMinSales) : '');
  const [isSaving, setIsSaving] = useState(false);
  const parsed = draft.trim() === '' ? 0 : Number(draft);
  const isValid = Number.isInteger(parsed) && parsed >= 0;
  const isDirty = isValid && parsed !== autoMinSales;

  const save = async (value: number) => {
    setIsSaving(true);
    try {
      await api.patch(SETTINGS_KEY, { autoMinSales: value });
      await mutate(SETTINGS_KEY);
      void mutate((k) => typeof k === 'string' && k.startsWith(FAVORITES_KEY_PREFIX) && k !== SETTINGS_KEY);
      toast.success(value > 0 ? `Se agregarán solos los productos con ${value} ventas o más.` : 'Favoritos automáticos desactivados.');
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo guardar el ajuste.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canConfigure) {
    return autoMinSales > 0 ? (
      <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
        <Sparkles className="h-3.5 w-3.5" /> Se agregan solos los productos con {autoMinSales} ventas o más.
      </p>
    ) : null;
  }

  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (isDirty && !isSaving) void save(parsed);
      }}
    >
      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <label htmlFor="auto-favorites-min" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
        Agregar solos los productos con
      </label>
      <input
        id="auto-favorites-min"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder="Ej. 30"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-8 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
      />
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">ventas o más</span>
      <div className="flex items-center gap-1.5 ml-auto">
        {autoMinSales > 0 && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setDraft('');
              void save(0);
            }}
            className="h-8 px-2.5 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            Desactivar
          </button>
        )}
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="h-8 px-3 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
          Guardar
        </button>
      </div>
    </form>
  );
}
