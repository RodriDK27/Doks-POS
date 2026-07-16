import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, User, Pause, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/CustomSelect';
import { Customer } from '../types';
import { CartItem } from '@/store/useCartStore';

interface TicketPanelProps {
  cartItems: CartItem[];
  cartItemsCount: number;
  getSubtotal: () => number;
  getTotal: () => number;
  discount: number;
  setDiscount: (val: number) => void;
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
  getSubtotal,
  getTotal,
  discount,
  setDiscount,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  onProceedToPayment,
  onSuspend,
  onClearCart,
  updateQuantity,
  removeFromCart,
}: TicketPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden min-h-0">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4.5 w-4.5 text-indigo-655 dark:text-indigo-400" />
          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Artículos en Ticket
          </span>
        </div>
        <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-none text-[10px] font-black px-2.5 py-0.5 rounded-lg">
          {cartItemsCount} uds
        </Badge>
      </div>

      {/* Lista de Artículos */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none p-2 space-y-1">
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

                <div className="flex items-center gap-1.5 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer active:scale-90 transition-transform"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    step="any"
                    className="h-8 w-12 text-center font-black text-xs p-0 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus-visible:ring-indigo-500"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer active:scale-90 transition-transform"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1.5 justify-between h-full py-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">${item.sellPrice.toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all active:scale-90"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="font-black text-slate-800 dark:text-slate-100 text-xs">
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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10 space-y-3.5 shrink-0">
        {/* Descuento y Subtotal */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subtotal</span>
            <span className="font-black text-slate-700 dark:text-slate-350">${getSubtotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-end items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Desc:</span>
            <div className="relative w-20">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-450 dark:text-slate-655">$</span>
              <Input
                type="number"
                className="h-8 rounded-lg text-right pr-2 pl-4 font-black text-xs border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus-visible:ring-indigo-500"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <User className="h-3 w-3" /> Cliente Asociado (Opcional)
          </label>
          <CustomSelect
            className="h-9.5 rounded-xl text-[11px] bg-white dark:bg-slate-950 dark:border-slate-800 shadow-none border-slate-200/80"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            placeholder="-- Público General --"
            options={[
              { value: '', label: '-- Público General --' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.name} ${c.currentDebt > 0 ? `(Debe: $${c.currentDebt.toFixed(0)})` : ''}`,
              })),
            ]}
          />
        </div>

        {/* Botón de Proceder al Pago */}
        <Button
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-12 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer mt-1"
          disabled={cartItems.length === 0}
          onClick={onProceedToPayment}
        >
          Proceder al Pago
          <span className="px-2 py-0.5 bg-emerald-700 dark:bg-emerald-900 rounded-lg text-[10px] font-black shadow-xs">
            ${getTotal().toFixed(2)}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        {/* Botones secundarios */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/40">
          <Button
            type="button"
            variant="outline"
            className="h-8.5 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 active:scale-95 transition-all cursor-pointer shadow-none"
            disabled={cartItems.length === 0}
            onClick={onSuspend}
          >
            <Pause className="h-3.5 w-3.5 mr-1" /> Suspender
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8.5 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-rose-500 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer shadow-none"
            disabled={cartItems.length === 0}
            onClick={onClearCart}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Vaciar
          </Button>
        </div>
      </div>
    </div>
  );
}
