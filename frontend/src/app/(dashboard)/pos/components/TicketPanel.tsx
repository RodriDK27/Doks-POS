import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, User, Pause, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
              className="flex justify-between items-center p-3 bg-white dark:bg-slate-900/40 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/40 transition-all gap-3 animate-in fade-in duration-100"
            >
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block truncate" title={item.name}>
                  {item.name}
                </span>

                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 h-8 w-fit mt-2 select-none overflow-hidden focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors">
                  <button
                    type="button"
                    className="h-full px-2 text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-755 dark:hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95 border-none outline-none focus:outline-none"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    className="h-full w-10 text-center font-black text-xs bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-slate-850 dark:text-slate-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="h-full px-2 text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-755 dark:hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95 border-none outline-none focus:outline-none"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1.5 justify-between h-full py-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">${item.sellPrice.toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all active:scale-90"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="font-black text-slate-800 dark:text-slate-105 text-xs">
                  ${item.total.toFixed(2)}
                </span>
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

      {/* Sección Inferior de Totales y Cliente */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10 space-y-3.5 shrink-0">
          {/* Totales finos */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 pt-1 gap-4">
              <span className="flex items-center gap-1 shrink-0"><User className="h-3.5 w-3.5 text-slate-400" /> Cliente</span>
              <div className="w-48 shrink-0">
                <CustomSelect
                  className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 font-bold text-xs"
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
            </div>

            <div className="flex justify-between items-center pt-2.5">
              <span className="font-black text-slate-850 dark:text-slate-200">Total a Cobrar</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                ${currentTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botón de Proceder al Pago */}
          <Button
            type="button"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-11.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer mt-1"
            onClick={onProceedToPayment}
          >
            Proceder al Cobro
            <span className="px-2 py-0.5 bg-indigo-700 dark:bg-indigo-900 rounded-lg text-[10px] font-black shadow-xs">
              ${currentTotal.toFixed(2)}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Botones secundarios */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 active:scale-95 transition-all cursor-pointer shadow-none"
              onClick={onSuspend}
            >
              <Pause className="h-3.5 w-3.5 mr-1" /> Suspender
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-rose-500 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer shadow-none"
              onClick={onClearCart}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Vaciar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
