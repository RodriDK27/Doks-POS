'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCartStore, CartItem } from '@/store/useCartStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useOfflineStore } from '@/store/useOfflineStore';
import dbHelper from '@/lib/indexedDb';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  User, 
  Pause, 
  History,
  AlertCircle,
  ShoppingCart,
  Coins,
  Check,
  Package,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/CustomSelect';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

interface Product {
  id: string;
  barcode: string | null;
  name: string;
  sellPrice: number;
  stock: number;
  category: string | null;
}

interface Customer {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
}

const getCategoryColor = (category: string | null) => {
  const cat = (category || 'OTROS').toUpperCase();
  if (cat.includes('BEBIDAS')) {
    return {
      bg: 'bg-blue-50/40 dark:bg-blue-950/10',
      border: 'border-blue-100 dark:border-blue-900/30 hover:border-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      accent: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    };
  }
  if (cat.includes('ABARROTES') || cat.includes('ALIMENTOS')) {
    return {
      bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
      border: 'border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      accent: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    };
  }
  if (cat.includes('LIMPIEZA')) {
    return {
      bg: 'bg-purple-50/40 dark:bg-purple-950/10',
      border: 'border-purple-100 dark:border-purple-900/30 hover:border-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      accent: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100/50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
    };
  }
  if (cat.includes('DULCES') || cat.includes('SABRITAS') || cat.includes('BOTANAS')) {
    return {
      bg: 'bg-amber-50/40 dark:bg-amber-950/10',
      border: 'border-amber-100 dark:border-amber-900/30 hover:border-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      accent: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    };
  }
  return {
    bg: 'bg-slate-50/40 dark:bg-slate-800/10',
    border: 'border-slate-100 dark:border-slate-700/30 hover:border-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    accent: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
  };
};

export default function POSPage() {
  const { role } = useAuthStore();
  const { isOnline, updateSyncQueueCount } = useOfflineStore();
  const { 
    cartItems, 
    discount, 
    suspendedCarts, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    setDiscount, 
    clearCart, 
    suspendCart, 
    resumeCart,
    deleteSuspendedCart,
    getTotal,
    getSubtotal
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [categories, setCategories] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // CONTROL DE VISTA PESTAÑA PARA TABLET/MÓVIL (CART vs CATALOG)
  const [posTab, setPosTab] = useState<'CATALOG' | 'CART'>('CATALOG');

  // Modales
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendName, setSuspendName] = useState('');
  const [isSuspendedOpen, setIsSuspendedOpen] = useState(false);

  // Modal Venta Genérica / Libre
  const [isGenericOpen, setIsGenericOpen] = useState(false);
  const [genericPrice, setGenericPrice] = useState<string>('');
  const [genericName, setGenericName] = useState<string>('Artículo Común');

  // Estados de cobro
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar Catálogo Completo (con soporte offline)
  const loadCatalog = async () => {
    if (!isOnline && dbHelper) {
      try {
        const localProds = await dbHelper.getProducts();
        setCatalogProducts(localProds);
        const localCats = Array.from(new Set(localProds.map(p => p.category).filter((c): c is string => !!c)));
        setCategories(localCats);
        toast.info('Cargado catálogo local desde memoria (Sin conexión).');
      } catch (err) {
        console.error('Error al cargar catálogo local:', err);
      }
      return;
    }

    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
        api.get('/customers')
      ]);
      setCatalogProducts(prodRes.data);
      setCategories(catRes.data);
      setCustomers(custRes.data);

      if (dbHelper) {
        await dbHelper.saveProducts(prodRes.data);
      }
    } catch (error) {
      console.error('Error loading POS catalog:', error);
      toast.error('No se pudo cargar el catálogo táctil.');
    }
  };

  useEffect(() => {
    if (role !== 'NONE') {
      loadCatalog();
    }
  }, [role]);

  const handleTouchAdd = (product: Product) => {
    if (product.stock <= 0) {
      toast.warning(`"${product.name}" no tiene existencias en inventario.`);
    }
    addToCart(product, 1);
    toast.success(`Añadido: ${product.name}`);
  };

  const handleAddGeneric = () => {
    const price = parseFloat(genericPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Por favor introduce un precio válido mayor a cero.');
      return;
    }

    const mockProduct: Product = {
      id: `generic-${Date.now()}`,
      barcode: null,
      name: genericName.trim() || 'Artículo Común',
      sellPrice: price,
      stock: 9999,
      category: 'VARIOS',
    };

    addToCart(mockProduct, 1);
    toast.success(`Añadido: ${mockProduct.name} - $${price.toFixed(2)}`);
    setIsGenericOpen(false);
    setGenericPrice('');
    setGenericName('Artículo Común');
    
    // Auto cambiar a la pestaña de carrito si es táctil para ver el cobro
    setPosTab('CART');
  };

  const filteredCatalog = catalogProducts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = activeCategory === 'TODOS' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenPayModal = () => {
    const total = getTotal();
    setAmountPaid(total);
    setChangeAmount(0);
    setPaymentMethod('EFECTIVO');
    setIsPayModalOpen(true);
  };

  useEffect(() => {
    const total = getTotal();
    if (paymentMethod === 'EFECTIVO' && amountPaid >= total) {
      setChangeAmount(amountPaid - total);
    } else {
      setChangeAmount(0);
    }
  }, [amountPaid, paymentMethod]);

  const handleCheckout = async () => {
    const total = getTotal();
    const customer = customers.find(c => c.id === selectedCustomerId);

    if (paymentMethod === 'FIADO') {
      if (!selectedCustomerId) {
        toast.error('Debe seleccionar un cliente registrado para poder fiar la venta.');
        return;
      }
      if (customer && customer.creditLimit > 0 && (customer.currentDebt + total) > customer.creditLimit) {
        toast.error(`El monto total excede el límite de crédito del cliente ($${customer.creditLimit}).`);
        return;
      }
    }

    const payload = {
      discount,
      paymentMethod,
      amountPaid: paymentMethod === 'EFECTIVO' ? amountPaid : total,
      customerId: selectedCustomerId || undefined,
      items: cartItems.map(item => ({
        productId: item.id.startsWith('generic-') ? undefined : item.id,
        quantity: item.quantity,
        genericName: item.id.startsWith('generic-') ? item.name : undefined,
        genericPrice: item.id.startsWith('generic-') ? item.sellPrice : undefined,
      })),
    };

    if (!isOnline) {
      try {
        if (!dbHelper) throw new Error('IndexedDB no disponible');
        
        await dbHelper.queueSale(payload);
        await updateSyncQueueCount();
        
        // Simular descuento de stock localmente
        const updatedProducts = catalogProducts.map(p => {
          const cartItem = cartItems.find(item => item.id === p.id);
          if (cartItem) {
            return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
          }
          return p;
        });
        setCatalogProducts(updatedProducts);
        await dbHelper.saveProducts(updatedProducts);

        toast.success('Venta guardada localmente. Se sincronizará al recuperar la conexión.', { duration: 8000 });
        clearCart();
        setSelectedCustomerId('');
        setIsPayModalOpen(false);
      } catch (err) {
        toast.error('Error al guardar la venta de forma local.');
      }
      return;
    }

    try {
      const response = await api.post('/sales', payload);
      const createdSale = response.data;

      if (paymentMethod === 'EFECTIVO' && createdSale.change > 0) {
        toast.success(`¡Venta Exitosa! CAMBIO: $${createdSale.change.toFixed(2)}`, { duration: 10000 });
      } else {
        toast.success(`¡Venta registrada! Folio: #${createdSale.id}`);
      }

      clearCart();
      setSelectedCustomerId('');
      setIsPayModalOpen(false);
      // Recargar catálogo para actualizar el stock local
      loadCatalog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar la venta.');
    }
  };

  const handleSuspendCart = () => {
    suspendCart(suspendName.trim());
    setSuspendName('');
    setIsSuspendModalOpen(false);
    toast.info('Venta suspendida.');
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setGenericPrice('');
    } else if (val === '.') {
      if (!genericPrice.includes('.')) {
        setGenericPrice(genericPrice + '.');
      }
    } else {
      setGenericPrice(genericPrice + val);
    }
  };

  const cartItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] overflow-hidden gap-4">
      
      {/* SELECTOR DE PESTAÑA TÁCTIL EN TABLET / MÓVIL */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl lg:hidden w-full shrink-0">
        <Button
          variant={posTab === 'CATALOG' ? 'default' : 'ghost'}
          className={`flex-1 h-11 font-extrabold text-xs rounded-xl transition-all ${
            posTab === 'CATALOG' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setPosTab('CATALOG')}
        >
          <Package className="h-4 w-4 mr-1.5" /> 📦 Catálogo Táctil
        </Button>
        <Button
          variant={posTab === 'CART' ? 'default' : 'ghost'}
          className={`flex-1 h-11 font-extrabold text-xs rounded-xl transition-all ${
            posTab === 'CART' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setPosTab('CART')}
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" /> 🛒 Carrito ({cartItemsCount})
        </Button>
      </div>

      {/* DISEÑO RESPONSIVO: O PESTAÑA O LADO A LADO */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* PANEL DERECHA: EL CATÁLOGO (ACTIVO SI PESTAÑA ES CATALOG O EN PANTALLA ANCHA) */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white border border-slate-150 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden ${
          posTab === 'CATALOG' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* BUSCADOR Y ACCIONES DE CATÁLOGO */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar producto..."
                  className="pl-9 h-11 border-slate-200 rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {suspendedCarts.length > 0 && (
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 font-extrabold text-xs h-11 rounded-xl flex items-center gap-1.5 shrink-0 px-4 active:scale-95 transition-all"
                  onClick={() => setIsSuspendedOpen(true)}
                >
                  <History className="h-4 w-4" /> Espera ({suspendedCarts.length})
                </Button>
              )}
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl flex items-center gap-1 shrink-0 px-4 active:scale-95 transition-all"
                onClick={() => setIsGenericOpen(true)}
              >
                <Plus className="h-4 w-4" /> Cobro Rápido
              </Button>
            </div>

            {/* CATEGORÍAS (TABS GRANDES) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              <Button
                variant={activeCategory === 'TODOS' ? 'default' : 'outline'}
                className={`h-9 px-4 text-[10px] font-bold uppercase rounded-xl shrink-0 ${
                  activeCategory === 'TODOS' ? 'bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setActiveCategory('TODOS')}
              >
                TODOS
              </Button>
              {categories.map((c) => (
                <Button
                  key={c}
                  variant={activeCategory === c ? 'default' : 'outline'}
                  className={`h-9 px-4 text-[10px] font-bold uppercase rounded-xl shrink-0 ${
                    activeCategory === c ? 'bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* CUADRÍCULA DE TARJETAS TÁCTILES */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCatalog.map((prod) => {
                  const themeColors = getCategoryColor(prod.category);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      className={`h-24 p-3.5 border ${themeColors.border} ${themeColors.bg} hover:shadow-[0_8px_20px_rgba(99,102,241,0.06)] rounded-2xl hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between active:scale-95 duration-200 cursor-pointer`}
                      onClick={() => handleTouchAdd(prod)}
                    >
                      <div className="w-full">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${themeColors.badge} mb-1.5 inline-block tracking-wider`}>
                          {prod.category || 'Otros'}
                        </span>
                        <span className="font-bold text-xs text-slate-850 dark:text-slate-200 block truncate w-full" title={prod.name}>
                          {prod.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline w-full mt-1.5">
                        <span className={`font-extrabold text-xs ${themeColors.accent}`}>
                          ${prod.sellPrice.toFixed(2)}
                        </span>
                        <span className={`text-[9px] font-bold ${prod.stock <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`}>
                          Disp: {prod.stock.toFixed(0)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                No se encontraron productos en esta categoría.
              </div>
            )}
          </div>
        </div>

        {/* PANEL IZQUIERDA: EL CARRITO (ACTIVO SI PESTAÑA ES CART O EN PANTALLA ANCHA) */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white border border-slate-150 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden ${
          posTab === 'CART' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <span className="font-extrabold text-sm text-slate-700 flex items-center gap-1.5">
              <ShoppingCart className="h-4.5 w-4.5 text-indigo-650" />
              Artículos en el ticket
            </span>
            <div className="flex items-center gap-1.5">
              {suspendedCarts.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[9px] font-black uppercase text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100/50 px-2 rounded-lg"
                  onClick={() => setIsSuspendedOpen(true)}
                >
                  Espera ({suspendedCarts.length})
                </Button>
              )}
              <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-bold">
                {cartItemsCount} uds
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cartItems.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/30 sticky top-0 z-10">
                  <TableRow className="border-b">
                    <TableHead className="w-12 text-center"></TableHead>
                    <TableHead className="text-xs font-bold">Producto</TableHead>
                    <TableHead className="text-right text-xs font-bold w-20">Precio</TableHead>
                    <TableHead className="text-center text-xs font-bold w-36">Cantidad</TableHead>
                    <TableHead className="text-right text-xs font-bold w-24">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {cartItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/20 border-b">
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-bold text-slate-700 text-xs block truncate max-w-[130px]" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-slate-500">
                        ${item.sellPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            step="any"
                            className="h-8 w-12 text-center font-bold text-xs p-0 rounded-lg border-slate-200"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 text-xs">
                        ${item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <ShoppingCart className="h-12 w-12 text-slate-200 mb-2" />
                <p className="text-xs font-bold">Carrito vacío</p>
              </div>
            )}
          </div>

          {/* TOTAL Y CONFIRMACIÓN XL */}
          <div className="p-4 border-t border-slate-150 bg-slate-50/50 space-y-4 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Cliente (Fiado/Abono)
                </label>
                <CustomSelect
                  className="h-10 rounded-lg text-xs"
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="-- Público General --"
                  options={[
                    { value: '', label: '-- Público General --' },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: `${c.name} ${c.currentDebt > 0 ? `(Deuda: $${c.currentDebt.toFixed(0)})` : ''}`
                    }))
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Descuento ($)</label>
                <Input
                  type="number"
                  className="h-10 rounded-lg text-right font-bold text-xs border-slate-200"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-indigo-900 text-white p-4 rounded-xl border border-indigo-950 shadow-md">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Monto Neto Cobro</span>
                <p className="text-2xl font-black text-indigo-100">${getTotal().toFixed(2)}</p>
              </div>
              <Button 
                className="bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-xs h-11 px-6 rounded-xl shadow active:scale-95 transition-all"
                disabled={cartItems.length === 0}
                onClick={handleOpenPayModal}
              >
                COBRAR TICKET
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="outline"
                className="h-9 rounded-lg font-bold border-slate-200 hover:bg-amber-50 hover:text-amber-600 text-amber-500"
                disabled={cartItems.length === 0}
                onClick={() => setIsSuspendModalOpen(true)}
              >
                <Pause className="h-4 w-4" /> Suspender
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-lg font-bold border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-rose-500"
                disabled={cartItems.length === 0}
                onClick={() => {
                  clearCart();
                  setSelectedCustomerId('');
                  toast.info('Carrito vaciado.');
                  setPosTab('CATALOG'); // Cambiar a catálogo al vaciar
                }}
              >
                <Trash2 className="h-4 w-4" /> Vaciar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DIÁLOGO: COBRAR VENTA (BILLETES RÁPIDOS) */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Cobrar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="bg-indigo-900 text-white p-4 rounded-xl flex items-center justify-between shadow-inner">
              <span className="text-xs text-indigo-300 font-bold uppercase">Total a pagar:</span>
              <span className="text-2xl font-black text-indigo-100">${getTotal().toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', name: 'Efectivo' },
                  { id: 'TARJETA', name: 'Tarjeta' },
                  { id: 'TRANSFERENCIA', name: 'Transfer' },
                  { id: 'FIADO', name: 'Fiado (Crédito)' },
                ].map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className={`h-11 text-xs font-bold rounded-xl active:scale-95 transition-all ${
                      paymentMethod === method.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    {method.name}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === 'EFECTIVO' && (
              <div className="space-y-4 p-4 border border-slate-100 bg-slate-50/50 rounded-xl">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Billetes Recibidos</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[20, 50, 100, 200, 500].map((bill) => (
                      <Button
                        key={bill}
                        type="button"
                        variant="outline"
                        className="h-9 px-3.5 text-xs font-bold border-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg shrink-0"
                        onClick={() => setAmountPaid(bill)}
                      >
                        ${bill}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-3.5 text-xs font-bold border-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg shrink-0"
                      onClick={() => setAmountPaid(getTotal())}
                    >
                      Exacto
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-indigo-600 uppercase">Dinero Recibido ($)</label>
                  <Input
                    type="number"
                    step="any"
                    className="h-11 text-base font-black border-slate-200 focus-visible:ring-indigo-500 text-indigo-600"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold text-slate-700 text-xs">SU CAMBIO:</span>
                  <span className="text-2xl font-black text-indigo-600">
                    ${changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'FIADO' && (
              <div className="p-4 border border-rose-100 bg-rose-50/10 text-rose-600 rounded-xl space-y-1 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Venta Fiada / Cuenta de Crédito</p>
                  <p className="text-[10px] text-rose-500 leading-normal mt-0.5">
                    {selectedCustomerId 
                      ? `La cantidad de $${getTotal().toFixed(2)} se anotará como deuda de "${customers.find(c => c.id === selectedCustomerId)?.name}".`
                      : '¡ATENCIÓN! Debes seleccionar un cliente registrado en la pestaña del carrito antes de cobrar como Fiado.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsPayModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 rounded-xl h-10"
              disabled={paymentMethod === 'FIADO' && !selectedCustomerId}
              onClick={handleCheckout}
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: COBRO RÁPIDO / VENTA LIBRE (TECLADO GIGANTE) */}
      <Dialog open={isGenericOpen} onOpenChange={setIsGenericOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Venta Libre (Genérico)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto</label>
                <Input
                  type="text"
                  placeholder="Ej. Bolillo, Dulces..."
                  className="h-11 focus-visible:ring-indigo-500 text-xs font-bold"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Precio ($)</label>
                <Input
                  type="text"
                  readOnly
                  placeholder="0.00"
                  className="h-11 text-right font-black text-lg text-indigo-600 bg-slate-50 border-slate-200"
                  value={genericPrice}
                />
              </div>
            </div>

            {/* TECLADO GIGANTE */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  className={`h-11 font-black text-sm rounded-xl active:bg-indigo-50 active:border-indigo-200 transition-all ${
                    key === 'C' ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleKeypadPress(key)}
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsGenericOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 rounded-xl h-10 flex items-center gap-1"
              disabled={!genericPrice || parseFloat(genericPrice) <= 0}
              onClick={handleAddGeneric}
            >
              <Check className="h-4 w-4" /> Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: SUSPENDER VENTA */}
      <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Suspender Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-400">Identificador para recuperar la venta:</p>
            <Input
              type="text"
              placeholder="Ej. Sra. María, Bolillo y jamón..."
              value={suspendName}
              onChange={(e) => setSuspendName(e.target.value)}
              className="focus-visible:ring-indigo-500 h-10 text-xs font-semibold"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsSuspendModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-xl px-5"
              disabled={!suspendName.trim()}
              onClick={handleSuspendCart}
            >
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: RECUPERAR VENTA EN ESPERA */}
      <Dialog open={isSuspendedOpen} onOpenChange={setIsSuspendedOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800 flex items-center gap-1.5">
              <History className="h-5 w-5 text-indigo-600" />
              Ventas en Espera
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecciona una venta para reanudar el cobro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs max-h-64 overflow-y-auto divide-y divide-slate-100">
            {suspendedCarts.length > 0 ? (
              suspendedCarts.map((cart) => {
                const totalAmount = cart.items.reduce((acc, i) => acc + i.total, 0) - cart.discount;
                const itemsNames = cart.items.map((i) => `${i.quantity.toFixed(0)}x ${i.name}`).join(', ');

                return (
                  <div key={cart.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-800 block truncate text-xs">{cart.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={itemsNames}>
                        {itemsNames}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-slate-700 text-xs mr-1">${totalAmount.toFixed(2)}</span>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] h-8 rounded-lg active:scale-95 transition-all"
                        onClick={() => {
                          resumeCart(cart.id);
                          setIsSuspendedOpen(false);
                          toast.success(`Venta "${cart.name}" reanudada.`);
                          setPosTab('CART'); // Cambiar a pestaña del carrito al reanudar en móvil
                        }}
                      >
                        Reanudar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                        onClick={() => {
                          deleteSuspendedCart(cart.id);
                          toast.info(`Venta "${cart.name}" eliminada.`);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                No hay ventas en espera.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => setIsSuspendedOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
