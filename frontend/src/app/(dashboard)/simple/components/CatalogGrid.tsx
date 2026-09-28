'use client';

import React from 'react';
import { HelpCircle, ImageIcon, PackagePlus, Scale } from 'lucide-react';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../../pos/types';
import { SimpleFamily, familyPiecePrices, formatMoney } from '../helpers';
import { SimpleOverlay } from './SimpleOverlay';

function ProductPhoto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- la foto viene del backend en otro dominio, ya optimizada
  return <img src={src} alt={alt} crossOrigin="anonymous" loading="lazy" className="h-full w-full object-contain p-2" />;
}

function familyPriceLabel(family: SimpleFamily): string {
  const first = family.products[0];
  if (family.products.length === 1) {
    return first.unitType === 'WEIGHT' ? `${formatMoney(first.sellPrice)} el kilo` : formatMoney(first.sellPrice);
  }
  const last = family.products[family.products.length - 1];
  return first.sellPrice === last.sellPrice
    ? formatMoney(first.sellPrice)
    : `${formatMoney(first.sellPrice)} a ${formatMoney(last.sellPrice)}`;
}

interface FamilyGridProps {
  families: SimpleFamily[];
  onSelectFamily: (family: SimpleFamily) => void;
  onOtherProduct: () => void;
}

/** Pantalla de inicio: un cuadro grande con foto por familia, siempre en el mismo orden */
export function FamilyGrid({ families, onSelectFamily, onOtherProduct }: FamilyGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {families.map((family) => (
        <button
          key={family.key}
          type="button"
          onClick={() => onSelectFamily(family)}
          className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs hover:shadow-lg overflow-hidden text-left cursor-pointer active:scale-[0.97] active:border-indigo-500 transition-transform"
        >
          <div className="aspect-[4/3] w-full bg-white">
            <ProductPhoto src={family.imageSrc} alt={family.name} />
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-2xl font-black leading-tight line-clamp-2 text-slate-900 dark:text-slate-100">{family.name}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{familyPriceLabel(family)}</p>
          </div>
        </button>
      ))}

      {/* Siempre al final: para lo que no tiene foto ni código de barras */}
      <button
        type="button"
        onClick={onOtherProduct}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 min-h-[240px] cursor-pointer active:scale-[0.97] transition-transform text-slate-600 dark:text-slate-400"
      >
        <PackagePlus className="h-16 w-16" />
        <span className="text-2xl font-black text-center px-4">Otro producto</span>
        <span className="text-lg font-bold text-center px-4">Poner el precio a mano</span>
      </button>
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {family.products.map((product) => {
          const isWeight = product.unitType === 'WEIGHT';
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onPick(product)}
              className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs hover:shadow-lg overflow-hidden text-left cursor-pointer active:scale-[0.97] active:border-indigo-500 transition-transform"
            >
              <div className="aspect-[4/3] w-full bg-white">
                {/* Sin la foto de la familia como respaldo: dos sabores con la misma foto confunden */}
                <ProductPhoto src={getProductImageSrc(product.imageUrl)} alt={product.name} />
              </div>
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-black leading-tight line-clamp-3 text-slate-900 dark:text-slate-100">{product.name}</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-2">
                  {formatMoney(product.sellPrice)}
                  {isWeight && (
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Scale className="h-5 w-5" /> el kilo
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}

        {/* Siempre al final, igual que "Otro producto" en el inicio */}
        {canBeUnsure && (
          <button
            type="button"
            onClick={onUnsure}
            className="flex flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 min-h-[240px] cursor-pointer active:scale-[0.97] transition-transform text-amber-900 dark:text-amber-300"
          >
            <HelpCircle className="h-16 w-16" />
            <span className="text-2xl font-black text-center px-4">No sé cuál</span>
            <span className="text-lg font-bold text-center px-4">Cobrar por el precio</span>
          </button>
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
  return (
    <SimpleOverlay title={`¿Cuánto costó el ${family.name}?`} onBack={onBack}>
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {prices.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => onPickPrice(price)}
              className="h-32 rounded-3xl bg-white dark:bg-slate-900 border-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-5xl font-black shadow-sm cursor-pointer active:scale-95 active:bg-emerald-50 transition-transform"
            >
              {formatMoney(price)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOtherPrice}
          className="h-24 rounded-3xl bg-slate-200 dark:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 text-3xl font-black cursor-pointer"
        >
          Otro precio
        </button>
      </div>
    </SimpleOverlay>
  );
}
