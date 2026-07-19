import { create } from 'zustand';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  barcode: string | null;
  name: string;
  sellPrice: number;
  stock: number;
  quantity: number;
  total: number;
}

export interface SuspendedCart {
  id: string;
  name: string;
  items: CartItem[];
  discount: number;
  createdAt: Date;
}

interface CartState {
  // Estado actual del carrito
  cartItems: CartItem[];
  discount: number;
  
  // Ventas suspendidas / en espera
  suspendedCarts: SuspendedCart[];

  // Acciones de gestión del carrito activo
  addToCart: (product: { id: string; barcode: string | null; name: string; sellPrice: number; stock: number }, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;

  // Acciones de ventas en espera
  suspendCart: (name: string) => void;
  resumeCart: (suspendedId: string) => void;
  deleteSuspendedCart: (suspendedId: string) => void;

  // Selectores calculados
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  discount: 0,
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
            total: item.sellPrice * newQty,
          };
        }
        return item;
      });
      set({ cartItems: updatedItems });
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
        total: product.sellPrice * quantity,
      };
      set({ cartItems: [...cartItems, newItem] });
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
          total: item.sellPrice * quantity,
        };
      }
      return item;
    });
    set({ cartItems: updatedItems });
  },

  // Asignar descuento total
  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount) });
  },

  // Limpiar carrito activo
  clearCart: () => {
    set({ cartItems: [], discount: 0 });
  },

  // Suspender la venta actual (poner en espera)
  suspendCart: (name) => {
    const { cartItems, discount, suspendedCarts } = get();
    if (cartItems.length === 0) return;

    const newSuspension: SuspendedCart = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `Cliente ${suspendedCarts.length + 1}`,
      items: [...cartItems],
      discount,
      createdAt: new Date(),
    };

    set({
      suspendedCarts: [...suspendedCarts, newSuspension],
      cartItems: [], // Limpiar carrito actual para atender nueva venta
      discount: 0,
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
    return cartItems.reduce((acc, item) => acc + item.total, 0);
  },

  // Calcular total neto aplicando el descuento
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const { discount } = get();
    return Math.max(0, subtotal - discount);
  },
}));
