'use client';

import React from 'react';
import { HelpCircle, ImageIcon, PackagePlus, Plus, Scale } from 'lucide-react';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../../pos/types';
import { getCategoryColor } from '../../pos/helpers';
import { SimpleFamily, familyPiecePrices, formatMoney } from '../helpers';
import { SimpleOverlay } from './SimpleOverlay';

function familyPriceLabel(family: SimpleFamily): string {
  const first = family.products[0];
  if (family.products.length === 1) return formatMoney(first.sellPrice);
  const last = family.products[family.products.length - 1];
  return first.sellPrice === last.sellPrice
    ? formatMoney(first.sellPrice)
    : `${formatMoney(first.sellPrice)} a ${formatMoney(last.sellPrice)}`;
}

interface BigProductCardProps {
  name: string;
  category: string | null;
  imageSrc: string | null;
  price: string;
  isWeight?: boolean;
  onClick: () => void;
}

/**
 * Tarjeta del punto de venta (ProductCard) en tamaño grande: mismos colores por categoría,
 * etiqueta, precio en el color de la categoría y botón "+" índigo; la foto es la protagonista.
 */
function BigProductCard({ name, category, imageSrc, price, isWeight, onClick }: BigProductCardProps) {
  const colors = getCategoryColor(category);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col text-left rounded-2xl border overflow-hidden select-none cursor-pointer bg-white dark:bg-slate-900 ${colors.bg} ${colors.border} shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150`}
    >
      <div className="flex items-center gap-1.5 flex-wrap px-3 pt-3">
        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md tracking-wider truncate max-w-[160px] ${colors.badge}`}>
          {category || 'General'}
        </span>
        {isWeight && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-800/50">
            <Scale className="h-3.5 w-3.5" /> Granel
          </span>
        )}
      </div>

      <div className="mx-3 mt-2 aspect-[4/3] rounded-xl bg-white border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
          <img src={imageSrc} alt={name} crossOrigin="anonymous" loading="lazy" className="h-full w-full object-contain p-2" />
        ) : (
          <ImageIcon className="h-14 w-14 text-slate-300" />
        )}
      </div>

      <p className="flex-1 px-3 pt-2 pb-3 text-xl font-black leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {name}
      </p>

      <div className="flex items-center justify-between gap-2 px-3 py-3 border-t border-slate-100 dark:border-slate-800/60">
        {/* Un rango ("$15 a $22") va un poco más chico para que quepa en un solo renglón */}
        <span className={`${price.length > 7 ? 'text-xl' : 'text-2xl'} font-black leading-none tracking-tight whitespace-nowrap ${colors.accent}`}>
          {price}
          {isWeight && <span className="text-base font-bold text-slate-400 dark:text-slate-500 ml-0.5">/kg</span>}
        </span>
        <span className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:bg-indigo-700 shrink-0">
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </span>
      </div>
    </button>
  );
}

/** Tarjeta punteada para las opciones "sin producto exacto" (mismo tamaño que las de producto) */
function DashedOptionCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: 'slate' | 'amber';
  onClick: () => void;
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:border-amber-500'
      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-[280px] cursor-pointer active:scale-[0.97] transition-all ${toneClass}`}
    >
      <Icon className="h-14 w-14" />
      <span className="text-xl font-black text-center px-4">{title}</span>
      <span className="text-base font-bold text-center px-4 opacity-80">{subtitle}</span>
    </button>
  );
}

interface FamilyGridProps {
  families: SimpleFamily[];
  onSelectFamily: (family: SimpleFamily) => void;
  onOtherProduct: () => void;
}

/** Pantalla de inicio: una tarjeta grande con foto por familia, siempre en el mismo orden */
export function FamilyGrid({ families, onSelectFamily, onOtherProduct }: FamilyGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {families.map((family) => {
        const first = family.products[0];
        return (
          <BigProductCard
            key={family.key}
            name={family.name}
            category={first.category ?? null}
            imageSrc={family.imageSrc}
            price={familyPriceLabel(family)}
            isWeight={family.products.length === 1 && first.unitType === 'WEIGHT'}
            onClick={() => onSelectFamily(family)}
          />
        );
      })}

      {/* Siempre al final: para lo que no tiene foto ni código de barras */}
      <DashedOptionCard icon={PackagePlus} title="Otro producto" subtitle="Poner el precio a mano" tone="slate" onClick={onOtherProduct} />
    </div>
  );
}

interface VariantPickerProps {
  family: SimpleFamily;
  onPick: (product: Product) => void;
  /** "No sé cuál": se cobra por precio y el administrador lo aclara después */
  onUnsure: () => void;
  onBack: () => void;
}

/** Variantes de una familia (Boing → Mango 300ml, Guayaba 500ml...) con foto y precio grandes */
export function VariantPicker({ family, onPick, onUnsure, onBack }: VariantPickerProps) {
  // Solo con piezas: a granel ya se cobra por monto y el precio por kilo no ayuda a adivinar
  const canBeUnsure = familyPiecePrices(family).length > 0;
  return (
    <SimpleOverlay title={`¿Cuál ${family.name}?`} onBack={onBack}>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {family.products.map((product) => (
          <BigProductCard
            key={product.id}
            name={product.name}
            category={product.category ?? null}
            // Sin la foto de la familia como respaldo: dos sabores con la misma foto confunden
            imageSrc={getProductImageSrc(product.imageUrl)}
            price={formatMoney(product.sellPrice)}
            isWeight={product.unitType === 'WEIGHT'}
            onClick={() => onPick(product)}
          />
        ))}

        {/* Siempre al final, igual que "Otro producto" en el inicio */}
        {canBeUnsure && (
          <DashedOptionCard icon={HelpCircle} title="No sé cuál" subtitle="Cobrar por el precio" tone="amber" onClick={onUnsure} />
        )}
      </div>
    </SimpleOverlay>
  );
}

interface UnsurePriceStepProps {
  family: SimpleFamily;
  onPickPrice: (price: number) => void;
  onOtherPrice: () => void;
  onBack: () => void;
}

/** "¿Cuánto costó el Boing?": un botón por cada precio de la familia, sin tener que escribir */
export function UnsurePriceStep({ family, onPickPrice, onOtherPrice, onBack }: UnsurePriceStepProps) {
  const prices = familyPiecePrices(family);
  const colors = getCategoryColor(family.products[0]?.category ?? null);
  return (
    <SimpleOverlay title={`¿Cuánto costó el ${family.name}?`} onBack={onBack}>
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {prices.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => onPickPrice(price)}
              className={`h-32 rounded-2xl border bg-white dark:bg-slate-900 ${colors.border} shadow-xs hover:shadow-lg active:scale-95 transition-all cursor-pointer text-5xl font-black tabular-nums ${colors.accent}`}
            >
              {formatMoney(price)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOtherPrice}
          className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-2xl font-black cursor-pointer active:scale-95 transition-all shadow-xs"
        >
          Otro precio
        </button>
      </div>
    </SimpleOverlay>
  );
}
