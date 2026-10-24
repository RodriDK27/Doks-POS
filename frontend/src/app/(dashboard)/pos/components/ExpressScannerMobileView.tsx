'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Heart,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Pause,
  PackagePlus,
  Percent,
  Pencil,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { cn, formatQuantity } from '@/lib/utils';
import { CartItem } from '@/store/useCartStore';
import { Customer, Product } from '../types';

/** Con texto en el buscador basta con unos cuantos resultados: si no está, se sigue escribiendo */
const MAX_SEARCH_RESULTS = 10;
/** Al explorar una categoría sin escribir se muestran más, con scroll */
const MAX_CATEGORY_RESULTS = 40;

interface ExpressScannerMobileViewProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  /** Abre la consulta de favoritos */
  onOpenFavorites: () => void;
  onToggleFavorite: (product: Product) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  cartItems: CartItem[];
  cartItemsCount: number;
  getTotal: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  discount: number;
  setDiscount: (discount: number) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  updateQuantity: (id: string, qty: number) => void;
  updatePrice: (id: string, price: number) => void;
  /** Solo administración puede cambiar el precio de un renglón */
  canEditPrice: boolean;
  removeFromCart: (id: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  onSuspend: () => void;
  filteredCatalog: Product[];
  /** Favoritos y más vendidos, para agregar con un toque con el ticket vacío */
  frequentProducts: Product[];
  onAddProduct: (product: Product) => void;
  /** Último producto agregado o cambiado: se resalta en el ticket */
  lastTouchedId: string | null;
  customers: Customer[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  /** Abre el agregado rápido (solo para quien puede administrar inventario) */
  onQuickRestock?: () => void;
}

export function ExpressScannerMobileView({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchInputRef,
  onOpenFavorites,
  onToggleFavorite,
  activeCategory,
  onCategoryChange,
  categories,
  cartItems,
  cartItemsCount,
  getTotal,
  getSubtotal,
  getDiscountAmount,
  discount,
  setDiscount,
  discountPercent,
  setDiscountPercent,
  updateQuantity,
  updatePrice,
  canEditPrice,
  removeFromCart,
  onProceedToPayment,
  onSuspend,
  filteredCatalog,
  frequentProducts,
  onAddProduct,
  lastTouchedId,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  onQuickRestock,
}: ExpressScannerMobileViewProps) {
  const currentTotal = getTotal();
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<'AMOUNT' | 'PERCENT'>(discountPercent > 0 ? 'PERCENT' : 'AMOUNT');
  const ticketListRef = useRef<HTMLDivElement>(null);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setSelectedSearchIndex(0);
  }

  const isBrowsingCategory = activeCategory !== 'TODOS';
  const isResultsOpen = !!searchQuery.trim() || isBrowsingCategory;
  const visibleResults = filteredCatalog.slice(0, searchQuery.trim() ? MAX_SEARCH_RESULTS : MAX_CATEGORY_RESULTS);
  const hiddenResults = filteredCatalog.length - visibleResults.length;
  const hasDiscount = discountAmount > 0;
  const showDiscountEditor = isDiscountOpen || hasDiscount;

  // Lo más nuevo va arriba del ticket: el cajero ve de inmediato lo que acaba de escanear
  const ticketRows = [...cartItems].reverse();

  // Llevar a la vista el renglón recién tocado (puede estar abajo si se le sumó una pieza)
  useEffect(() => {
    if (!lastTouchedId) return;
    const row = ticketListRef.current?.querySelector<HTMLElement>(`[data-cart-row="${CSS.escape(lastTouchedId)}"]`);
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lastTouchedId, cartItems]);

  // Listener directo para F2 en la vista
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);

  const closeResults = () => {
    onSearchQueryChange('');
    onCategoryChange('TODOS');
    setSelectedSearchIndex(0);
  };

  const addFromResults = (product: Product) => {
    onAddProduct(product);
    closeResults();
  };

  const changeDiscountMode = (mode: 'AMOUNT' | 'PERCENT') => {
    setDiscountMode(mode);
    // Cambiar de pesos a % (o al revés) empieza de cero para no confundir un 10 con $10
    if (mode === 'PERCENT') setDiscountPercent(0);
    else setDiscount(0);
  };

  const removeDiscount = () => {
    setDiscount(0);
    setIsDiscountOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-3 gap-2.5">
      {/* BARRA DE BÚSQUEDA / FAVORITOS / AGREGADO RÁPIDO */}
      <div className="relative shrink-0 flex gap-2 items-center z-30">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar producto o escanear código..."
            className="pl-10 pr-12 h-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-sm font-extrabold focus-visible:ring-indigo-500 w-full shadow-xs"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSearchIndex((prev) => Math.min(visibleResults.length - 1, prev + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSearchIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.includes('*') || visibleResults.length === 0) {
                  onSearchSubmit();
                } else if (selectedSearchIndex >= 0 && selectedSearchIndex < visibleResults.length) {
                  addFromResults(visibleResults[selectedSearchIndex]);
                } else {
                  onSearchSubmit();
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                closeResults();
              }
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="Borrar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-500/30 rounded font-black pointer-events-none select-none">
              F2
            </span>
          )}
        </div>

        {/* FAVORITOS: CONSULTA DE EXISTENCIA Y VENTAS */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenFavorites}
          className="h-12 w-12 p-0 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0"
          title="Favoritos: existencia y ventas"
          aria-label="Favoritos"
        >
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
        </Button>

        {/* AGREGADO RÁPIDO: SURTIR LO QUE LLEGÓ DEL PROVEEDOR */}
        {onQuickRestock && (
          <Button
            type="button"
            variant="outline"
            onClick={onQuickRestock}
            className="h-12 w-12 p-0 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            title="Llegó mercancía: surtir varios productos a la vez"
            aria-label="Llegó mercancía"
          >
            <PackagePlus className="h-5 w-5" />
          </Button>
        )}

        {/* LISTA FLOTANTE DE RESULTADOS (BÚSQUEDA O CATEGORÍA) */}
        {isResultsOpen && (
          <div className="absolute left-0 right-0 top-13 z-50 max-h-96 sm:max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 animate-in fade-in duration-150">
            {isBrowsingCategory && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {activeCategory} · {filteredCatalog.length}
                </span>
                <button
                  type="button"
                  onClick={closeResults}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Cerrar categoría"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {visibleResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleResults.map((prod, idx) => (
                  <SearchResultRow
                    key={prod.id}
                    product={prod}
                    isSelected={idx === selectedSearchIndex}
                    onAdd={() => addFromResults(prod)}
                    onToggleFavorite={() => onToggleFavorite(prod)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                {searchQuery.trim()
                  ? <>No se encontraron productos con &quot;{searchQuery}&quot;.</>
                  : 'No hay productos en esta categoría.'}
              </div>
            )}
            {hiddenResults > 0 && (
              <p className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">
                {searchQuery.trim()
                  ? `Y ${hiddenResults} más: escribe más letras para encontrarlo.`
                  : `Y ${hiddenResults} más: escribe en el buscador para filtrar.`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CATEGORÍAS DE UN TOQUE */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 -mt-0.5">
          {['TODOS', ...categories].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(isSelected && cat !== 'TODOS' ? 'TODOS' : cat)}
                className={cn(
                  'px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border shrink-0',
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {/* TICKET EN VIVO */}
      <div
        ref={ticketListRef}
        className="flex-1 overflow-y-auto scrollbar-none p-1 md:p-2 space-y-1.5 min-h-0 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800"
      >
        {ticketRows.length > 0 ? (
          ticketRows.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              isLastTouched={item.id === lastTouchedId}
              canEditPrice={canEditPrice}
              onQuantityChange={(qty) => updateQuantity(item.id, qty)}
              onPriceChange={(price) => updatePrice(item.id, price)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-3 text-slate-400 space-y-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Ticket de venta vacío</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600">Escanea un código, busca un producto o toca uno frecuente:</p>
            </div>

            {frequentProducts.length > 0 && (
              <div className="w-full space-y-1.5 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Favoritos y más vendidos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {frequentProducts.map((prod) => {
                    const isOutOfStock = prod.stock <= 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => onAddProduct(prod)}
                        className={cn(
                          'p-2.5 rounded-xl text-left transition-all active:scale-95 shadow-2xs cursor-pointer flex flex-col justify-between h-20 border',
                          isOutOfStock
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/60 dark:border-rose-500/50 hover:border-rose-600'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-500'
                        )}
                      >
                        <div className="flex items-start justify-between gap-1 w-full">
                          <span className={cn(
                            'font-extrabold text-xs line-clamp-2 leading-snug flex-1',
                            isOutOfStock ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'
                          )}>
                            {prod.name}
                          </span>
                          {prod.isFavorite && <Heart className="h-3 w-3 fill-rose-500 text-rose-500 shrink-0 mt-0.5" />}
                        </div>
                        <div className="flex items-center justify-between mt-1 w-full">
                          <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                            ${prod.sellPrice.toFixed(2)}
                          </span>
                          <span className={cn(
                            'text-[10px] font-extrabold px-1.5 py-0.5 rounded',
                            isOutOfStock
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          )}>
                            {isOutOfStock ? 'Sin stock' : '+ Añadir'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PIE: CLIENTE, DESCUENTO, TOTAL Y COBRO */}
      <div className="shrink-0 space-y-2">
        {cartItems.length > 0 && (
          <div className="bg-white dark:bg-slate-950 p-2.5 md:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Cliente (para fiado o venta registrada) */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <CustomSelect
                  className="h-9"
                  menuPlacement="top"
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  options={[
                    { value: '', label: 'Público general' },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: c.currentDebt > 0 ? `${c.name} (debe $${c.currentDebt.toFixed(2)})` : c.name,
                    })),
                  ]}
                />
              </div>

              {!showDiscountEditor && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDiscountOpen(true)}
                  className="h-9 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer shrink-0"
                >
                  <Percent className="h-3.5 w-3.5" /> Descuento
                </Button>
              )}

              {/* Total */}
              <div className="ml-auto text-right shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black px-2 py-0.5 rounded-md">
                    {cartItemsCount} uds
                  </span>
                </div>
                <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                  ${currentTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Descuento en pesos o porcentaje (oculto hasta que se pide) */}
            {showDiscountEditor && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
                  {(['AMOUNT', 'PERCENT'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => changeDiscountMode(mode)}
                      className={cn(
                        'h-7 w-8 rounded-md text-xs font-black cursor-pointer',
                        discountMode === mode ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs' : 'text-slate-500'
                      )}
                    >
                      {mode === 'AMOUNT' ? '$' : '%'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={discountMode === 'PERCENT' ? 100 : subtotal}
                  step="any"
                  placeholder={discountMode === 'PERCENT' ? 'Ej. 10' : '0.00'}
                  autoFocus={isDiscountOpen && !hasDiscount}
                  className="h-9 w-28 rounded-lg font-black text-right text-sm"
                  value={(discountMode === 'PERCENT' ? discountPercent : discount) || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (discountMode === 'PERCENT') setDiscountPercent(value);
                    else setDiscount(Math.min(value, subtotal));
                  }}
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex-1 truncate">
                  {hasDiscount ? `-$${discountAmount.toFixed(2)} de $${subtotal.toFixed(2)}` : 'Sin descuento'}
                </span>
                <button
                  type="button"
                  onClick={removeDiscount}
                  className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  aria-label="Quitar descuento"
                  title="Quitar descuento"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={cartItems.length === 0}
            onClick={onSuspend}
            className="h-11 md:h-12 px-3 border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0"
            title="Suspender Venta"
          >
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pausar</span>
          </Button>

          <Button
            type="button"
            disabled={cartItems.length === 0}
            onClick={onProceedToPayment}
            className="flex-1 h-11 md:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            <span>Cobrar</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-800/90 rounded font-mono font-black text-emerald-100 border border-emerald-400/30">
              F8
            </span>
            <span className="px-2 py-0.5 bg-emerald-700 dark:bg-emerald-900 rounded-lg text-xs font-black">
              ${currentTotal.toFixed(2)}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SearchResultRowProps {
  product: Product;
  isSelected: boolean;
  onAdd: () => void;
  onToggleFavorite: () => void;
}

function SearchResultRow({ product, isSelected, onAdd, onToggleFavorite }: SearchResultRowProps) {
  const isOutOfStock = product.stock <= 0;
  return (
    <div
      onClick={onAdd}
      className={cn(
        'p-2.5 cursor-pointer flex justify-between items-center rounded-xl transition-all border my-0.5',
        isOutOfStock
          ? isSelected
            ? 'border-rose-500 bg-rose-500/15 dark:bg-rose-950/40 ring-2 ring-rose-500'
            : 'border-rose-500/50 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40'
          : isSelected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-slate-800 ring-2 ring-indigo-500'
            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'font-extrabold text-xs sm:text-sm block truncate',
            isOutOfStock ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'
          )}>
            {product.name}
          </span>
          {isSelected && (
            <span className={cn('text-[9.5px] text-white font-black px-1.5 py-0.2 rounded', isOutOfStock ? 'bg-rose-600' : 'bg-indigo-600')}>
              Enter ↵
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-0.5">
          <span className="text-slate-600 dark:text-slate-400 font-extrabold">${product.sellPrice.toFixed(2)}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          {isOutOfStock ? (
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">Sin stock</span>
          ) : (
            <span className="text-slate-500">Stock: {formatQuantity(product.stock)}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          // Solo marca: no agrega el producto al ticket
          e.stopPropagation();
          onToggleFavorite();
        }}
        title={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-label={product.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={!!product.isFavorite}
        className="h-8 w-8 mr-1 shrink-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90 transition-all"
      >
        <Heart className={cn('h-4 w-4', product.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-600')} />
      </button>
      <span
        className={cn(
          'h-7 px-2.5 inline-flex items-center font-extrabold text-xs rounded-lg shrink-0',
          isOutOfStock
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            : isSelected
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        )}
      >
        {isOutOfStock ? 'Sin stock' : '+ Añadir'}
      </span>
    </div>
  );
}

interface CartRowProps {
  item: CartItem;
  isLastTouched: boolean;
  canEditPrice: boolean;
  onQuantityChange: (quantity: number) => void;
  onPriceChange: (price: number) => void;
  onRemove: () => void;
}

function CartRow({ item, isLastTouched, canEditPrice, onQuantityChange, onPriceChange, onRemove }: CartRowProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const priceChanged = item.originalPrice !== undefined;

  return (
    <div
      data-cart-row={item.id}
      className={cn(
        'flex justify-between items-center p-2.5 md:p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-2xs transition-all gap-2 md:gap-3',
        isLastTouched
          ? 'border-indigo-400 ring-2 ring-indigo-400/30 dark:border-indigo-500'
          : 'border-slate-150 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      )}
    >
      {/* Nombre + precio unitario (editable por administración) */}
      <div className="min-w-0 flex-1">
        <span className="block font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base truncate" title={item.name}>
          {item.name}
        </span>
        {isEditingPrice ? (
          <DraftNumberInput
            initialValue={item.sellPrice}
            autoFocus
            className="h-7 w-24 mt-0.5 text-xs"
            onCommit={(price) => {
              if (price !== null) onPriceChange(price);
              setIsEditingPrice(false);
            }}
          />
        ) : (
          <button
            type="button"
            disabled={!canEditPrice}
            onClick={() => setIsEditingPrice(true)}
            title={canEditPrice ? 'Cambiar precio de este producto' : undefined}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-bold',
              canEditPrice ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : 'cursor-default',
              priceChanged ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            )}
          >
            {priceChanged && <span className="line-through text-slate-400">${item.originalPrice!.toFixed(2)}</span>}
            ${item.sellPrice.toFixed(2)} c/u
            {canEditPrice && <Pencil className="h-3 w-3 opacity-60" />}
          </button>
        )}
      </div>

      {/* Cantidad: botones o escribirla directo (ej. 24 piezas o 0.750 kg) */}
      <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 h-9 md:h-10 select-none overflow-hidden shrink-0">
        <button
          type="button"
          className="h-full px-2 md:px-3 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => onQuantityChange(item.quantity - 1)}
          aria-label="Quitar uno"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <DraftNumberInput
          // Si la cantidad cambia por fuera (botones, escáner) el campo se reinicia con el valor nuevo
          key={item.quantity}
          initialValue={item.quantity}
          className="h-full w-12 md:w-14 border-0 rounded-none bg-transparent text-xs md:text-base"
          onCommit={(qty) => {
            if (qty !== null && qty !== item.quantity) onQuantityChange(qty);
          }}
        />
        <button
          type="button"
          className="h-full px-2 md:px-3 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => onQuantityChange(item.quantity + 1)}
          aria-label="Agregar uno"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Total del renglón y eliminar (pequeño y separado del + para no borrar sin querer) */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-xl tracking-tight min-w-[64px] text-right">
          ${item.total.toFixed(2)}
        </span>
        <button
          type="button"
          className="h-8 w-8 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer flex items-center justify-center transition-colors"
          onClick={onRemove}
          title="Quitar del ticket"
          aria-label={`Quitar ${item.name} del ticket`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface DraftNumberInputProps {
  initialValue: number;
  className?: string;
  autoFocus?: boolean;
  /** Se llama al salir del campo o con Enter; null si quedó vacío o inválido */
  onCommit: (value: number | null) => void;
}

/** Campo numérico que solo aplica el valor al confirmar, para poder borrar y escribir sin que se mueva el ticket */
function DraftNumberInput({ initialValue, className, autoFocus, onCommit }: DraftNumberInputProps) {
  const [draft, setDraft] = useState(formatQuantity(initialValue));

  const commit = () => {
    const parsed = parseFloat(draft);
    onCommit(isNaN(parsed) || parsed < 0 ? null : parsed);
    // Si el valor se aplicó, el renglón se remonta con el nuevo; si se rechazó (ej. sin stock), vuelve al anterior
    setDraft(formatQuantity(initialValue));
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      autoFocus={autoFocus}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setDraft(formatQuantity(initialValue));
          onCommit(null);
        }
      }}
      className={cn(
        'font-black text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className
      )}
    />
  );
}
