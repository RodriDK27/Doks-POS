'use client';

import React from 'react';
import { HelpCircle, ImageIcon, LayoutGrid, PackagePlus, Plus, Scale } from 'lucide-react';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../../pos/types';
import { getCategoryColor } from '../../pos/helpers';
import { SimpleCategory, SimpleFamily, familyPiecePrices, formatMoney } from '../helpers';
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
      {/* La foto es la protagonista: ocupa todo el ancho y las etiquetas van encima de ella */}
      <div className="relative aspect-square w-full bg-white border-b border-slate-100 dark:border-slate-800/60 overflow-hidden flex items-center justify-center">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
          <img src={imageSrc} alt={name} crossOrigin="anonymous" loading="lazy" className="h-full w-full object-contain p-1" />
        ) : (
          <ImageIcon className="h-16 w-16 text-slate-300" />
        )}
        <div className="absolute top-2 left-2 right-2 flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md tracking-wider truncate max-w-full shadow-xs ${colors.badge}`}>
            {category || 'General'}
          </span>
          {isWeight && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-800/50 shadow-xs">
              <Scale className="h-3.5 w-3.5" /> Granel
            </span>
          )}
        </div>
      </div>

      <p className="flex-1 px-3 pt-2 pb-2 text-2xl font-black leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {name}
      </p>

      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        {/* Un rango ("$15 a $22") va un poco más chico para que quepa en un solo renglón */}
        <span className={`${price.length > 7 ? 'text-2xl' : 'text-3xl'} font-black leading-none tracking-tight whitespace-nowrap ${colors.accent}`}>
          {price}
          {isWeight && <span className="text-base font-bold text-slate-400 dark:text-slate-500 ml-0.5">/kg</span>}
        </span>
        <span className="h-14 w-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:bg-indigo-700 shrink-0">
          <Plus className="h-8 w-8 stroke-[2.5]" />
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
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-[260px] cursor-pointer active:scale-[0.97] transition-all ${toneClass}`}
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] portrait:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
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

/** Miniatura de una categoría: su imagen, o un cuadro del color de la categoría con un ícono */
export function CategoryImage({ category, className = 'h-full w-full' }: { category: SimpleCategory; className?: string }) {
  if (category.imageSrc) {
    // eslint-disable-next-line @next/next/no-img-element -- la imagen viene del backend en otro dominio, ya optimizada
    return <img src={category.imageSrc} alt={category.name} crossOrigin="anonymous" loading="lazy" className={`${className} object-contain p-2`} />;
  }
  const colors = getCategoryColor(category.name);
  return (
    <div className={`${className} ${colors.badge} flex items-center justify-center`}>
      <LayoutGrid className="h-1/3 w-1/3" />
    </div>
  );
}

function CategoryCard({ category, onPick }: { category: SimpleCategory; onPick: () => void }) {
  const colors = getCategoryColor(category.name);
  return (
    <button
      type="button"
      onClick={onPick}
      className={`group flex flex-col text-left rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 ${colors.border} shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer`}
    >
      <div className="aspect-[4/3] w-full bg-white border-b border-slate-100 dark:border-slate-800/60 overflow-hidden">
        <CategoryImage category={category} />
      </div>
      <div className="px-3 py-3">
        <p className="text-2xl font-black uppercase leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {category.name}
        </p>
        <p className={`text-base font-bold mt-1 ${colors.accent}`}>
          {category.count} {category.count === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </button>
  );
}

interface CategoryGridProps {
  categories: SimpleCategory[];
  totalCount: number;
  onPickCategory: (name: string) => void;
  onAllProducts: () => void;
  onOtherProduct: () => void;
}

/**
 * Pantalla de inicio: un cuadro grande con imagen por categoría (igual que "¿Qué proveedor vino?"),
 * en vez de una tira de pestañas de puro texto. Al tocar una se ven sus productos.
 */
export function CategoryGrid({ categories, totalCount, onPickCategory, onAllProducts, onOtherProduct }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] portrait:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
      {categories.map((category) => (
        <CategoryCard key={category.name} category={category} onPick={() => onPickCategory(category.name)} />
      ))}

      {/* Al final, para no mover de lugar las categorías que ya se aprendió */}
      {totalCount > 0 && (
        <button
          type="button"
          onClick={onAllProducts}
          className="group flex flex-col text-left rounded-2xl border border-indigo-200 dark:border-indigo-900/50 overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer"
        >
          <div className="aspect-[4/3] w-full bg-indigo-600 flex items-center justify-center text-white">
            <LayoutGrid className="h-1/3 w-1/3" />
          </div>
          <div className="px-3 py-3">
            <p className="text-2xl font-black uppercase leading-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Ver todo</p>
            <p className="text-base font-bold mt-1 text-indigo-600 dark:text-indigo-400">{totalCount} productos</p>
          </div>
        </button>
      )}

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] portrait:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
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
