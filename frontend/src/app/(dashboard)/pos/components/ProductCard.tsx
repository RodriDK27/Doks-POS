import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { getCategoryColor } from '../helpers';

interface ProductCardProps {
  product: Product;
  qtyInCart: number;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, qtyInCart, onAdd }: ProductCardProps) {
  const colors = getCategoryColor(product.category);
  const isLowStock = product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      className={`group p-3.5 border rounded-2xl relative text-left flex flex-col justify-between transition-all duration-300 min-h-[125px] select-none ${isOutOfStock
        ? 'opacity-40 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
        : `cursor-pointer bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${colors.bg} ${colors.border}`
        }`}
      onClick={() => onAdd(product)}
    >
      {/* Badge cantidad agregada */}
      {qtyInCart > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1.5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200">
          {qtyInCart}
        </span>
      )}

      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md ${colors.badge} tracking-wider`}>
            {product.category || 'Otros'}
          </span>
          {!isOutOfStock && isLowStock && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </div>
        <span
          className="font-extrabold text-[11px] leading-snug text-slate-800 dark:text-slate-100 block line-clamp-2 w-full group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors"
          title={product.name}
        >
          {product.name}
        </span>
      </div>

      <div className="flex justify-between items-end w-full mt-3">
        <div className="min-w-0">
          <span className={`font-black text-sm block tracking-tight ${colors.accent}`}>
            ${product.sellPrice.toFixed(2)}
          </span>
          <span
            className={`text-[9px] font-bold block mt-0.5 tracking-wide ${isOutOfStock
              ? 'text-rose-500 font-extrabold'
              : isLowStock
                ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            {isOutOfStock ? 'Agotado' : `Stock: ${product.stock.toFixed(0)}`}
          </span>
        </div>

        {!isOutOfStock && (
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm opacity-90 group-hover:opacity-100 group-hover:bg-indigo-700 active:scale-90 transition-all shrink-0">
            <Plus className="h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  );
}
