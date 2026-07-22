import React from 'react';
import { Plus, Scale } from 'lucide-react';
import { Product } from '../types';
import { getCategoryColor } from '../helpers';

interface ProductCardProps {
  product: Product;
  qtyInCart: number;
  onAdd: (product: Product) => void;
  searchQuery?: string;
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return <>{text}</>;

  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = words.some(w => part.toLowerCase() === w.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 font-extrabold rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

export function ProductCard({ product, qtyInCart, onAdd, searchQuery }: ProductCardProps) {
  const colors = getCategoryColor(product.category);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;
  const isBulk = product.unitType === 'WEIGHT';

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onAdd(product)}
      className={`group relative flex flex-col text-left rounded-2xl border transition-all duration-200 select-none overflow-hidden
        ${isOutOfStock
          ? 'opacity-40 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
          : `cursor-pointer bg-white dark:bg-slate-900 ${colors.bg} ${colors.border} shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]`
        }`}
    >
      {/* BADGE CARRITO (esquina) */}
      {qtyInCart > 0 && (
        <span className="absolute top-2 right-2 z-20 h-5.5 min-w-5.5 px-1.5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200">
          {qtyInCart}
        </span>
      )}

      {/* ZONA SUPERIOR — NOMBRE + CATEGORÍA */}
      <div className="flex-1 flex flex-col justify-start gap-2 px-3.5 pt-3.5 pb-2.5">
        {/* FILA META: categoría + granel */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest ${colors.badge}`}>
            {product.category || 'General'}
          </span>
          {isBulk && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-800/50">
              <Scale className="h-2.5 w-2.5" />
              Granel
            </span>
          )}
          {isLowStock && (
            <span className="ml-auto h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          )}
        </div>

        {/* NOMBRE DEL PRODUCTO — protagonista */}
        <p
          className={`font-black text-[14px] leading-tight line-clamp-2 transition-colors
            ${isOutOfStock
              ? 'text-slate-500 dark:text-slate-500'
              : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }`}
          title={product.name}
        >
          <HighlightText text={product.name} query={searchQuery} />
        </p>
      </div>

      {/* ZONA INFERIOR — PRECIO + BOTÓN */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-t ${isOutOfStock ? 'border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800/60'}`}>
        <div>
          <div className={`font-black text-[15px] leading-none tracking-tight ${colors.accent}`}>
            ${product.sellPrice.toFixed(2)}
            {isBulk && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-0.5">/kg</span>}
          </div>
          <div className={`text-[9.5px] font-bold mt-1 ${
            isOutOfStock
              ? 'text-rose-500'
              : isLowStock
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-500'
          }`}>
            {isOutOfStock ? 'Sin stock' : `Stock: ${isBulk ? product.stock.toFixed(2) + ' kg' : product.stock}`}
          </div>
        </div>

        {!isOutOfStock && (
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:bg-indigo-700 group-hover:scale-105 active:scale-90 transition-all shrink-0">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
        )}
      </div>
    </button>
  );
}

