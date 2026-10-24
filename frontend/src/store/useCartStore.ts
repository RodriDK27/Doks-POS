import { create } from 'zustand';
import { toast } from 'sonner';
import { roundMoney } from '@/lib/utils';

export interface CartItem {
  id: string;
  barcode: string | null;
  name: string;
  sellPrice: number;
  stock: number;
  quantity: number;
  total: number;
  /** Precio de catálogo cuando se cambió el precio a mano en el ticket */
  originalPrice?: number;
}

export interface SuspendedCart {
  id: string;
  name: string;
  items: CartItem[];
  discount: number;
  discountPercent?: number;
  createdAt: Date;
}

interface CartState {
  // Estado actual del carrito
  cartItems: CartItem[];
  /** Descuento en pesos (se ignora si hay descuento en porcentaje) */
  discount: number;
  /** Descuento en porcentaje sobre el subtotal; 0 = sin porcentaje */
  discountPercent: number;
  /** Último producto agregado o con cantidad cambiada, para resaltarlo en el ticket */
  lastTouchedId: string | null;
  
  // Ventas suspendidas / en espera
  suspendedCarts: SuspendedCart[];

  // Acciones de gestión del carrito activo
  addToCart: (product: { id: string; barcode: string | null; name: string; sellPrice: number; stock: number }, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, price: number) => void;
  setDiscount: (discount: number) => void;
  setDiscountPercent: (percent: number) => void;
  clearCart: () => void;

  // Acciones de ventas en espera
  suspendCart: (name: string) => void;
  resumeCart: (suspendedId: string) => void;
  deleteSuspendedCart: (suspendedId: string) => void;

  // Selectores calculados
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  discount: 0,
  discountPercent: 0,
  lastTouchedId: null,
  suspendedCarts: [],

  // Agregar producto al carrito (maneja código de barras e incrementos)
  addToCart: (product, quantity = 1) => {
    const { cartItems } = get();
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        toast.warning(`Stock insuficiente para "${product.name}". Solo hay ${product.stock} unidades en inventario.`);
        return;
      }
      // Incrementar cantidad del item existente
      const updatedItems = cartItems.map((item) => {
        if (item.id === product.id) {
          return {
            ...item,
            quantity: newQty,
            total: roundMoney(item.sellPrice * newQty),
          };
        }
        return item;
      });
      set({ cartItems: updatedItems, lastTouchedId: product.id });
    } else {
      if (quantity > product.stock) {
        toast.warning(`Stock insuficiente para "${product.name}". Solo hay ${product.stock} unidades en inventario.`);
        return;
      }
      // Agregar nuevo producto
      const newItem: CartItem = {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        sellPrice: product.sellPrice,
        stock: product.stock,
        quantity,
        total: roundMoney(product.sellPrice * quantity),
      };
      set({ cartItems: [...cartItems, newItem], lastTouchedId: product.id });
    }
  },

  // Eliminar un item del carrito
  removeFromCart: (productId) => {
    const { cartItems } = get();
    set({ cartItems: cartItems.filter((item) => item.id !== productId) });
  },

  // Modificar la cantidad de un item del carrito (soporta decimales para ventas a granel)
  updateQuantity: (productId, quantity) => {
    const { cartItems } = get();
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    const existingItem = cartItems.find((item) => item.id === productId);
    if (existingItem && quantity > existingItem.stock) {
      toast.warning(`Stock insuficiente para "${existingItem.name}". Solo hay ${existingItem.stock} unidades en inventario.`);
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (item.id === productId) {
        return {
          ...item,
          quantity,
          total: roundMoney(item.sellPrice * quantity),
        };
      }
      return item;
    });
    set({ cartItems: updatedItems, lastTouchedId: productId });
  },

  // Cambiar el precio de un renglón (etiqueta con precio viejo, rebaja a una sola pieza)
  updatePrice: (productId, price) => {
    if (isNaN(price) || price < 0) return;
    const updatedItems = get().cartItems.map((item) => {
      if (item.id !== productId) return item;
      const originalPrice = item.originalPrice ?? item.sellPrice;
      const sellPrice = roundMoney(price);
      return {
        ...item,
        sellPrice,
        // Si vuelve al precio de catálogo ya no cuenta como cambiado
        originalPrice: Math.abs(sellPrice - originalPrice) < 0.005 ? undefined : originalPrice,
        total: roundMoney(sellPrice * item.quantity),
      };
    });
    set({ cartItems: updatedItems, lastTouchedId: productId });
  },

  // Asignar descuento total en pesos
  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount), discountPercent: 0 });
  },

  // Asignar descuento en porcentaje (se recalcula si cambia el ticket)
  setDiscountPercent: (percent) => {
    set({ discountPercent: Math.min(100, Math.max(0, percent)), discount: 0 });
  },

  // Limpiar carrito activo
  clearCart: () => {
    set({ cartItems: [], discount: 0, discountPercent: 0, lastTouchedId: null });
  },

  // Suspender la venta actual (poner en espera)
  suspendCart: (name) => {
    const { cartItems, discount, discountPercent, suspendedCarts } = get();
    if (cartItems.length === 0) return;

    const newSuspension: SuspendedCart = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `Cliente ${suspendedCarts.length + 1}`,
      items: [...cartItems],
      discount,
      discountPercent,
      createdAt: new Date(),
    };

    set({
      suspendedCarts: [...suspendedCarts, newSuspension],
      cartItems: [], // Limpiar carrito actual para atender nueva venta
      discount: 0,
      discountPercent: 0,
      lastTouchedId: null,
    });
  },

  // Recuperar una venta en espera
  resumeCart: (suspendedId) => {
    const { suspendedCarts, cartItems } = get();
    const cartToResume = suspendedCarts.find((c) => c.id === suspendedId);
    
    if (!cartToResume) return;

    // Si el carrito actual tiene productos, primero lo suspendemos automáticamente
    if (cartItems.length > 0) {
      get().suspendCart(`Autoguardado antes de reanudar`);
    }

    set({
      cartItems: cartToResume.items,
      discount: cartToResume.discount,
      discountPercent: cartToResume.discountPercent ?? 0,
      lastTouchedId: null,
      suspendedCarts: get().suspendedCarts.filter((c) => c.id !== suspendedId), // Remover de la lista de espera
    });
  },

  // Eliminar una venta en espera
  deleteSuspendedCart: (suspendedId) => {
    const { suspendedCarts } = get();
    set({
      suspendedCarts: suspendedCarts.filter((c) => c.id !== suspendedId),
    });
  },

  // Calcular subtotal antes de descuento
  getSubtotal: () => {
    const { cartItems } = get();
    return roundMoney(cartItems.reduce((acc, item) => acc + item.total, 0));
  },

  // Descuento efectivo en pesos (el porcentaje se calcula sobre el subtotal actual)
  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountPercent } = get();
    const amount = discountPercent > 0 ? roundMoney((subtotal * discountPercent) / 100) : discount;
    return Math.min(amount, subtotal);
  },

  // Calcular total neto aplicando el descuento
  getTotal: () => {
    const subtotal = get().getSubtotal();
    return Math.max(0, roundMoney(subtotal - get().getDiscountAmount()));
  },
}));
