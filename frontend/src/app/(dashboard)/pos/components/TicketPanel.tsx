import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, User, Pause, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Customer } from '../types';
import { CartItem } from '@/store/useCartStore';

interface TicketPanelProps {
  cartItems: CartItem[];
  cartItemsCount: number;
  getTotal: () => number;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  customers: Customer[];
  discount: number;
  setDiscount: (discount: number) => void;
  onProceedToPayment: () => void;
  onSuspend: () => void;
  onClearCart: () => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
}

export function TicketPanel({
  cartItems,
  cartItemsCount,
  getTotal,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  discount,
  setDiscount,
  onProceedToPayment,
  onSuspend,
  onClearCart,
  updateQuantity,
  removeFromCart,
}: TicketPanelProps) {
  const currentTotal = getTotal();

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 flex justify-between items-center shrink-0 min-h-[68px]">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4.5 w-4.5 text-indigo-650" />
          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Artículos en Ticket
          </span>
        </div>
        <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-none text-[10px] font-black px-2.5 py-0.5 rounded-lg">
          {cartItemsCount} uds
        </Badge>
      </div>

      {/* Lista de Artículos */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none p-2 space-y-1 min-h-0">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-3 md:p-3.5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all gap-3 md:gap-4 animate-in fade-in duration-100"
            >
              {/* Nombre del Producto + Precio Unitario al lado */}
              <div className="min-w-0 flex-1 flex items-baseline gap-2">
                <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm md:text-base truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold shrink-0">
                  (${item.sellPrice.toFixed(2)})
                </span>
              </div>

              {/* Controles de Cantidad */}
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 h-9 md:h-11 select-none overflow-hidden shrink-0">
                <button
                  type="button"
                  className="h-full px-2.5 md:px-3.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95 border-none outline-none"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
                <input
                  type="number"
                  step="any"
                  className="h-full w-10 md:w-12 text-center font-black text-xs md:text-base bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-slate-850 dark:text-slate-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                />
                <button
                  type="button"
                  className="h-full px-2.5 md:px-3.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95 border-none outline-none"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>

              {/* Total (sin texto "Total") + Botón Borrar Más Grande */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-2xl tracking-tight">
                  ${item.total.toFixed(2)}
                </span>

                <button
                  type="button"
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-2xl cursor-pointer transition-all active:scale-90 flex items-center justify-center shrink-0 border-none bg-transparent"
                  onClick={() => removeFromCart(item.id)}
                  title="Eliminar del ticket"
                >
                  <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-rose-500 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-450 p-6 min-h-[180px] space-y-2">
            <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-350 dark:text-slate-700 animate-pulse">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">El ticket de venta está vacío</p>
          </div>
        )}
      </div>

      {/* Sección Inferior de Totales y Cliente - Opción 1 */}
      {cartItems.length > 0 && (
        <div className="p-3.5 md:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 shrink-0">
          {/* Banner Horizontal Superior: Cliente + Descuento a la izq | Total a la der */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white dark:bg-slate-950 p-3 md:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
            {/* Inputs Izquierda */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                  <User className="h-3 w-3 text-indigo-500" /> Cliente
                </label>
                <CustomSelect
                  className="w-full h-9 md:h-10 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="Público General"
                  options={[
                    { value: '', label: 'Público General' },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: `${c.name} ${c.currentDebt > 0 ? `($${c.currentDebt})` : ''}`,
                    })),
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider block">
                  Descuento ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className="w-full h-11 md:h-12 rounded-xl border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 font-black text-right text-sm md:text-base focus-visible:ring-indigo-500"
                  value={discount > 0 ? discount : ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Total Gigante Derecha */}
            <div className="text-left md:text-right shrink-0 md:pl-5 md:border-l border-slate-100 dark:border-slate-800/80 pt-2 md:pt-0 border-t md:border-t-0 flex flex-col justify-center">
              <span className="font-black text-xs md:text-sm text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Total Ticket
              </span>
              {discount > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">
                  Desc. -${discount.toFixed(2)}
                </span>
              )}
              <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none pt-0.5">
                ${currentTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Fila Inferior de Acciones: Botón de Cobrar Principal + Pausar & Vaciar al lado */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 md:h-12 px-3 border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
              onClick={onSuspend}
              title="Suspender Venta"
            >
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">Pausar</span>
            </Button>

            <Button
              type="button"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs md:text-sm h-11 md:h-12 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              onClick={onProceedToPayment}
            >
              <span>Proceder al Cobro</span>
              <span className="px-2.5 py-0.5 bg-indigo-700 dark:bg-indigo-900 rounded-lg text-xs font-black">
                ${currentTotal.toFixed(2)}
              </span>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 md:h-12 px-3 border-rose-200 dark:border-rose-900/60 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
              onClick={onClearCart}
              title="Vaciar Carrito"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Vaciar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
