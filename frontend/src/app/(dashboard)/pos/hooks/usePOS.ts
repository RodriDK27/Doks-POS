import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useCartStore } from '@/store/useCartStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import dbHelper from '@/lib/indexedDb';
import { Product, Customer } from '../types';

export function usePOS() {
  const { role } = useAuthStore();
  const { isOnline, updateSyncQueueCount, syncQueueCount, syncOfflineSales } = useOfflineStore();
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
  
  // CONTROL DE VISTA PESTAÑA PARA TABLET / MÓVIL (CATALOG vs CART vs PAYMENT)
  const [posTab, setPosTab] = useState<'CATALOG' | 'CART' | 'PAYMENT'>('CATALOG');

  // Modales
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendName, setSuspendName] = useState('');
  const [isSuspendedOpen, setIsSuspendedOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Modal Venta Genérica / Libre
  const [isGenericOpen, setIsGenericOpen] = useState(false);
  const [genericPrice, setGenericPrice] = useState<string>('');
  const [genericName, setGenericName] = useState<string>('Artículo Común');

  // Estados de cobro
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // SWR queries con caché global
  const { data: swrProducts, mutate: mutateProducts } = useSWR<Product[]>(role !== 'NONE' && isOnline ? '/products' : null);
  const { data: swrCategories } = useSWR<string[]>(role !== 'NONE' && isOnline ? '/products/categories' : null);
  const { data: swrCustomers } = useSWR<Customer[]>(role !== 'NONE' && isOnline ? '/customers' : null);

  // Sincronizar catálogo en línea
  useEffect(() => {
    if (isOnline && swrProducts) {
      setCatalogProducts(swrProducts);
      if (dbHelper) {
        dbHelper.saveProducts(swrProducts);
      }
    }
  }, [swrProducts, isOnline]);

  // Sincronizar categorías en línea
  useEffect(() => {
    if (isOnline && swrCategories) {
      setCategories(swrCategories);
    }
  }, [swrCategories, isOnline]);

  // Sincronizar clientes en línea
  useEffect(() => {
    if (isOnline && swrCustomers) {
      setCustomers(swrCustomers);
    }
  }, [swrCustomers, isOnline]);

  // Cargar desde IndexedDB si estamos sin conexión
  useEffect(() => {
    if (!isOnline && dbHelper) {
      dbHelper.getProducts().then((localProds) => {
        setCatalogProducts(localProds);
        const localCats = Array.from(new Set(localProds.map(p => p.category).filter((c): c is string => !!c)));
        setCategories(localCats);
        toast.info('Cargado catálogo local desde memoria (Sin conexión).');
      }).catch((err) => {
        console.error('Error al cargar catálogo local:', err);
      });
    }
  }, [isOnline]);

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

  useEffect(() => {
    const total = getTotal();
    if (paymentMethod !== 'EFECTIVO') {
      setAmountPaid(total);
      setChangeAmount(0);
    } else {
      if (amountPaid >= total) {
        setChangeAmount(amountPaid - total);
      } else {
        setChangeAmount(0);
      }
    }
  }, [amountPaid, paymentMethod, cartItems, discount]);

  useEffect(() => {
    const total = getTotal();
    setAmountPaid(total);
  }, [cartItems, discount]);

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

        toast.success('Venta guardada localmente. Se sincronizará al recuperar la conexión.', { duration: 8005 });
        clearCart();
        setSelectedCustomerId('');
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
      // Recargar catálogo para actualizar el stock local
      mutateProducts();
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

  const canCheckout = cartItems.length > 0 && 
    !(paymentMethod === 'FIADO' && !selectedCustomerId) && 
    !(paymentMethod === 'EFECTIVO' && amountPaid < getTotal());

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 enfocar buscador
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4 cobro rápido / artículo libre
      if (e.key === 'F4') {
        e.preventDefault();
        setIsGenericOpen(true);
      }
      // F8 cobro: ir a pagar o confirmar venta
      if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0) {
          if (posTab !== 'PAYMENT') {
            setPosTab('PAYMENT');
          } else {
            if (canCheckout) {
              handleCheckout();
            } else {
              toast.error('Complete la información de pago requerida.');
            }
          }
        }
      }
      // Esc cerrar modales auxiliares o volver al ticket si está en cobro
      if (e.key === 'Escape') {
        if (isGenericOpen || isSuspendModalOpen || isSuspendedOpen || isShortcutsHelpOpen) {
          setIsGenericOpen(false);
          setIsSuspendModalOpen(false);
          setIsSuspendedOpen(false);
          setIsShortcutsHelpOpen(false);
        } else if (posTab === 'PAYMENT') {
          e.preventDefault();
          setPosTab('CART');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, paymentMethod, posTab, amountPaid, selectedCustomerId, canCheckout]);

  // Autofoco automático al cambiar a la vista de pago
  useEffect(() => {
    if (posTab === 'PAYMENT') {
      const timer = setTimeout(() => {
        if (paymentMethod === 'EFECTIVO' && amountPaidInputRef.current) {
          amountPaidInputRef.current.focus();
          amountPaidInputRef.current.select();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [posTab, paymentMethod]);

  const handleResumeCart = (id: string, name: string) => {
    resumeCart(id);
    setIsSuspendedOpen(false);
    toast.success(`Venta "${name}" reanudada.`);
    setPosTab('CART');
  };

  const handleDeleteSuspended = (id: string, name: string) => {
    deleteSuspendedCart(id);
    toast.info(`Venta "${name}" eliminada.`);
  };

  const handleClearCart = () => {
    clearCart();
    setSelectedCustomerId('');
    toast.info('Carrito vaciado.');
    setPosTab('CATALOG');
  };

  return {
    isOnline,
    syncQueueCount,
    syncOfflineSales,
    cartItems,
    discount,
    suspendedCarts,
    setDiscount,
    getTotal,
    getSubtotal,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    posTab,
    setPosTab,
    isSuspendModalOpen,
    setIsSuspendModalOpen,
    suspendName,
    setSuspendName,
    isSuspendedOpen,
    setIsSuspendedOpen,
    isShortcutsHelpOpen,
    setIsShortcutsHelpOpen,
    isGenericOpen,
    setIsGenericOpen,
    genericPrice,
    genericName,
    setGenericName,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    changeAmount,
    searchInputRef,
    amountPaidInputRef,
    confirmButtonRef,
    handleTouchAdd,
    handleAddGeneric,
    handleCheckout,
    handleSuspendCart,
    handleKeypadPress,
    cartItemsCount,
    canCheckout,
    handleResumeCart,
    handleDeleteSuspended,
    handleClearCart,
    updateQuantity,
    removeFromCart,
    filteredCatalog
  };
}
