import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { useCartStore } from '@/store/useCartStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import dbHelper from '@/lib/indexedDb';
import { parseAxiosError } from '@/lib/errorMapper';
import { Product, Customer } from '../types';
import { useVoiceSearch } from './useVoiceSearch';
import { useCatalogFilter } from './useCatalogFilter';
import { usePOSKeybindings } from './usePOSKeybindings';

export function usePOS() {
  const { role } = useAuthStore();
  const { isOnline, isSyncing, syncQueueCount, syncErrorCount, queuedSales, fetchQueuedSales, updateSyncQueueCount, syncOfflineSales } = useOfflineStore();
  const { 
    cartItems, 
    suspendedCarts, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    suspendCart, 
    resumeCart,
    deleteSuspendedCart,
    getTotal,
    getSubtotal,
    discount,
    setDiscount
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [localCategories, setLocalCategories] = useState<string[]>([]);
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
  const [genericName, setGenericName] = useState<string>('');
  const [genericMarginPercent, setGenericMarginPercent] = useState<number>(30);

  // Modal Vinculación Rápida de Código no Reconocido (Quick-Link)
  const [isQuickLinkOpen, setIsQuickLinkOpen] = useState(false);
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string>('');

  // Modal Restablecer Stock Express cuando producto tiene 0 existencia
  const [isZeroStockModalOpen, setIsZeroStockModalOpen] = useState(false);
  const [selectedZeroStockProduct, setSelectedZeroStockProduct] = useState<Product | null>(null);

  // Estados de cobro
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const searchInputRef = useRef<HTMLInputElement>(null);

  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const { isListening, toggleVoiceSearch } = useVoiceSearch(setSearchQuery);

  // SWR queries con caché global
  const { data: swrProducts, mutate: mutateProducts } = useSWR<Product[]>(role !== 'NONE' && isOnline ? '/products' : null);
  const { data: swrCategories } = useSWR<string[]>(role !== 'NONE' && isOnline ? '/products/categories' : null);
  const { data: swrCustomers } = useSWR<Customer[]>(role !== 'NONE' && isOnline ? '/customers' : null);

  // Compute derived state
  const catalogProducts = useMemo(() => {
    return isOnline ? (swrProducts ?? []) : localProducts;
  }, [isOnline, swrProducts, localProducts]);

  const categories = useMemo(() => {
    return isOnline ? (swrCategories ?? []) : localCategories;
  }, [isOnline, swrCategories, localCategories]);

  const customers = useMemo(() => {
    return isOnline ? (swrCustomers ?? []) : [];
  }, [isOnline, swrCustomers]);

  // Guardar catálogo en IndexedDB al cambiar
  useEffect(() => {
    if (isOnline && swrProducts && dbHelper) {
      dbHelper.saveProducts(swrProducts);
    }
  }, [swrProducts, isOnline]);

  // Cargar desde IndexedDB si estamos sin conexión
  useEffect(() => {
    if (!isOnline && dbHelper) {
      dbHelper.getProducts<Product>().then((localProds) => {
        setLocalProducts(localProds);
        const localCats = Array.from(new Set(localProds.map(p => p.category).filter((c): c is string => !!c)));
        setLocalCategories(localCats);
        toast.info('Cargado catálogo local desde memoria (Sin conexión).');
      }).catch((err: unknown) => {
        console.error('Error al cargar catálogo local:', err);
      });
    }
  }, [isOnline]);

  // Cargar cola offline al montar
  useEffect(() => {
    fetchQueuedSales();
  }, [fetchQueuedSales]);

  // Modal Venta a Granel
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<Product | null>(null);

  const handleTouchAdd = (product: Product) => {
    if (product.unitType === 'WEIGHT') {
      setSelectedBulkProduct(product);
      setIsBulkOpen(true);
      return;
    }

    if (product.stock <= 0) {
      setSelectedZeroStockProduct(product);
      setIsZeroStockModalOpen(true);
      return;
    }
    addToCart(product, 1);
    toast.success(`Añadido: ${product.name}`, { id: 'pos-add-toast' });
  };

  const handleConfirmBulkAdd = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast.success(`Añadido: ${quantity} kg de ${product.name}`, { id: 'pos-add-toast' });
    setPosTab('CART');
  };

  const handleAddGeneric = () => {
    const price = parseFloat(genericPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Por favor introduce un precio válido mayor a cero.');
      return;
    }

    // Estimar automáticamente un 16% de utilidad para productos de cobro rápido/no registrados
    const costPrice = price * 0.84;

    const mockProduct: Product = {
      id: `generic-${Date.now()}`,
      barcode: null,
      name: genericName.trim() || 'Artículo Común',
      sellPrice: price,
      costPrice: Math.max(0, costPrice),
      stock: 9999,
      category: 'VARIOS',
    };

    addToCart(mockProduct, 1);
    toast.success(`Añadido: ${mockProduct.name} - $${price.toFixed(2)}`);
    setIsGenericOpen(false);
    setGenericPrice('');
    setGenericName('');
    
    // Auto cambiar a la pestaña de carrito si es táctil para ver el cobro
    setPosTab('CART');
  };

  const { filteredCatalog } = useCatalogFilter(catalogProducts, searchQuery, activeCategory);

  const findProductByCode = useCallback((code: string): Product | undefined => {
    const clean = code.trim().toLowerCase();
    if (!clean) return undefined;

    return catalogProducts.find(p => {
      if (p.barcode && p.barcode.toLowerCase() === clean) return true;
      if (p.id.toLowerCase() === clean) return true;
      if (p.barcodes && p.barcodes.some(b => (b.barcode || '').toLowerCase() === clean)) return true;
      return false;
    });
  }, [catalogProducts]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const code = barcode.trim();
    if (!code) return;

    const product = findProductByCode(code);
    if (product) {
      if (product.unitType === 'WEIGHT') {
        setSelectedBulkProduct(product);
        setIsBulkOpen(true);
        return;
      }
      if (product.stock <= 0) {
        setSelectedZeroStockProduct(product);
        setIsZeroStockModalOpen(true);
        return;
      }
      addToCart(product, 1);
      toast.success(`+1 ${product.name}`, { id: 'pos-add-toast' });
    } else {
      // Abrir modal interactivo de vinculación rápida
      setUnrecognizedBarcode(code);
      setIsQuickLinkOpen(true);
    }
  }, [findProductByCode, addToCart]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    const query = value.trim();
    if (!query || query.length < 3) return;

    const exactProduct = findProductByCode(query);
    if (exactProduct) {
      if (exactProduct.stock <= 0) {
        setSelectedZeroStockProduct(exactProduct);
        setIsZeroStockModalOpen(true);
        setSearchQuery('');
        return;
      }
      addToCart(exactProduct, 1);
      toast.success(`Añadido: ${exactProduct.name} (código escaneado)`, { id: 'pos-add-toast' });
      setSearchQuery('');
    }
  }, [findProductByCode, addToCart, setSearchQuery]);

  const handleSearchSubmit = useCallback(() => {
    if (filteredCatalog.length === 1) {
      const singleProduct = filteredCatalog[0];
      if (singleProduct.stock <= 0) {
        setSelectedZeroStockProduct(singleProduct);
        setIsZeroStockModalOpen(true);
        setSearchQuery('');
        return;
      }
      addToCart(singleProduct, 1);
      toast.success(`Añadido: ${singleProduct.name}`, { id: 'pos-add-toast' });
      setSearchQuery('');
    } else if (filteredCatalog.length === 0 && searchQuery.trim()) {
      handleBarcodeScanned(searchQuery.trim());
      setSearchQuery('');
    }
  }, [filteredCatalog, addToCart, setSearchQuery, searchQuery, handleBarcodeScanned]);

  // Handler para vincular en caliente un código de barras a un producto desde el POS
  const handleQuickLinkBarcode = useCallback(async (productId: string, barcodeToLink: string) => {
    try {
      const cleanCode = barcodeToLink.trim();
      const res = await api.post(`/products/${productId}/barcodes`, { barcode: cleanCode });
      const updatedProduct: Product = res.data;

      // Actualizar caché de SWR
      await mutateProducts();

      // Actualizar almacenamiento local / IndexedDB
      if (dbHelper) {
        const allProds = await dbHelper.getProducts<Product>();
        const updatedList = allProds.map(p => p.id === productId ? { ...p, ...updatedProduct } : p);
        await dbHelper.saveProducts(updatedList);
        setLocalProducts(updatedList);
      }

      // Añadir automáticamente al carrito de la venta en curso
      const targetProduct = catalogProducts.find(p => p.id === productId) || updatedProduct;
      if (targetProduct.unitType === 'WEIGHT') {
        setSelectedBulkProduct(targetProduct);
        setIsBulkOpen(true);
      } else {
        if (targetProduct.stock <= 0) {
          toast.warning(`"${targetProduct.name}" no tiene existencias en inventario.`);
        }
        addToCart(targetProduct, 1);
        toast.success(`¡Código vinculado exitosamente! +1 ${targetProduct.name}`, { id: 'pos-add-toast' });
      }

      setIsQuickLinkOpen(false);
      setUnrecognizedBarcode('');
    } catch (err: unknown) {
      const errorMsg = parseAxiosError(err) || 'Error al vincular el código de barras.';
      toast.error(errorMsg);
    }
  }, [catalogProducts, mutateProducts, addToCart]);

  // Handler para restablecer stock rápido en el POS y añadir al ticket
  const handleQuickRestockAndAdd = useCallback(async (product: Product, newStock: number) => {
    try {
      await api.patch(`/products/${product.id}/stock`, { stock: newStock });

      // Actualizar caché de productos SWR
      await mutateProducts();

      // Actualizar almacenamiento local / IndexedDB
      if (dbHelper) {
        const allProds = await dbHelper.getProducts<Product>();
        const updatedList = allProds.map(p => p.id === product.id ? { ...p, stock: newStock } : p);
        await dbHelper.saveProducts(updatedList);
        setLocalProducts(updatedList);
      }

      // Añadir al ticket con el nuevo stock reflejado
      const updatedProduct = { ...product, stock: newStock };
      addToCart(updatedProduct, 1);
      toast.success(`Stock de "${product.name}" actualizado a ${newStock} y añadido al ticket.`);

      setIsZeroStockModalOpen(false);
      setSelectedZeroStockProduct(null);
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al restablecer stock.'));
    }
  }, [mutateProducts, addToCart]);

  // Permitir vender sin restablecer (en caso de omitir ajuste)
  const handleAddWithoutRestock = useCallback((product: Product) => {
    addToCart(product, 1);
    toast.warning(`"${product.name}" añadido sin ajustar stock.`);
    setIsZeroStockModalOpen(false);
    setSelectedZeroStockProduct(null);
  }, [addToCart]);

  const total = getTotal();
  const changeAmount = (paymentMethod === 'EFECTIVO' && amountPaid >= total) ? amountPaid - total : 0;

  useEffect(() => {
    const totalVal = getTotal();
    Promise.resolve().then(() => {
      if (paymentMethod !== 'EFECTIVO') {
        setAmountPaid(totalVal);
      }
    });
  }, [paymentMethod, cartItems, getTotal]);

  useEffect(() => {
    const totalVal = getTotal();
    Promise.resolve().then(() => {
      setAmountPaid(totalVal);
    });
  }, [cartItems, getTotal]);

  const handleCheckout = useCallback(async () => {
    const totalVal = getTotal();
    const customer = customers.find(c => c.id === selectedCustomerId);

    if (paymentMethod === 'FIADO') {
      if (!selectedCustomerId) {
        toast.error('Debe seleccionar un cliente registrado para poder fiar la venta.');
        return;
      }
      if (customer && customer.creditLimit > 0 && (customer.currentDebt + totalVal) > customer.creditLimit) {
        toast.error(`El monto total excede el límite de crédito del cliente ($${customer.creditLimit}).`);
        return;
      }
    }

    const payload = {
      discount: 0,
      paymentMethod,
      amountPaid: paymentMethod === 'EFECTIVO' ? amountPaid : totalVal,
      customerId: selectedCustomerId || undefined,
      items: cartItems.map(item => ({
        productId: item.id.startsWith('generic-') ? undefined : item.id,
        quantity: item.quantity,
        genericName: item.id.startsWith('generic-') ? item.name : undefined,
        genericPrice: item.id.startsWith('generic-') ? item.sellPrice : undefined,
      })),
    };

    setIsSubmitting(true);

    if (!isOnline) {
      try {
        if (!dbHelper) throw new Error('IndexedDB no disponible');
        
        await dbHelper.queueSale(payload);
        await updateSyncQueueCount();
        
        const updatedProducts = catalogProducts.map(p => {
          const cartItem = cartItems.find(item => item.id === p.id);
          if (cartItem) {
            return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
          }
          return p;
        });

        setLocalProducts(updatedProducts);
        await dbHelper.saveProducts(updatedProducts);

        toast.success('Venta guardada localmente. Se sincronizará al recuperar la conexión.', { duration: 8005 });
        clearCart();
        setSelectedCustomerId('');
        setPosTab('CATALOG');
      } catch {
        toast.error('Error al guardar la venta de forma local.');
      } finally {
        setIsSubmitting(false);
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
      setPosTab('CATALOG');
      mutateProducts();
      void mutate('/register/active');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('register-active-updated'));
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al procesar la venta.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    getTotal,
    customers,
    selectedCustomerId,
    paymentMethod,
    amountPaid,
    cartItems,
    isOnline,
    updateSyncQueueCount,
    catalogProducts,
    clearCart,
    mutateProducts
  ]);

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

  const rawCartItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartItemsCount = Number.isInteger(rawCartItemsCount)
    ? rawCartItemsCount
    : Number(rawCartItemsCount.toFixed(2));

  const canCheckout = cartItems.length > 0 && 
    !(paymentMethod === 'FIADO' && !selectedCustomerId) && 
    !(paymentMethod === 'EFECTIVO' && amountPaid < getTotal());

  usePOSKeybindings({
    cartItemsCount,
    paymentMethod,
    posTab,
    amountPaid,
    selectedCustomerId,
    canCheckout,
    isGenericOpen,
    isSuspendModalOpen,
    isSuspendedOpen,
    isShortcutsHelpOpen,
    searchInputRef,
    setIsGenericOpen,
    setIsSuspendModalOpen,
    setIsSuspendedOpen,
    setIsShortcutsHelpOpen,
    setPosTab,
    handleCheckout,
    handleBarcodeScanned,
  });

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
    isSyncing,
    syncQueueCount,
    syncErrorCount,
    queuedSales,
    syncOfflineSales,
    cartItems,
    suspendedCarts,
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
    isBulkOpen,
    setIsBulkOpen,
    selectedBulkProduct,
    handleConfirmBulkAdd,
    genericPrice,
    setGenericPrice,
    genericName,
    setGenericName,
    genericMarginPercent,
    setGenericMarginPercent,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    isSubmitting,
    changeAmount,

    catalogProducts,
    isQuickLinkOpen,
    setIsQuickLinkOpen,
    unrecognizedBarcode,
    setUnrecognizedBarcode,
    handleQuickLinkBarcode,
    isZeroStockModalOpen,
    setIsZeroStockModalOpen,
    selectedZeroStockProduct,
    setSelectedZeroStockProduct,
    handleQuickRestockAndAdd,
    handleAddWithoutRestock,
    searchInputRef,
    amountPaidInputRef,
    confirmButtonRef,
    handleTouchAdd,
    handleAddGeneric,
    handleCheckout,
    handleSuspendCart,
    handleKeypadPress,
    discount,
    setDiscount,
    cartItemsCount,
    canCheckout,
    handleResumeCart,
    handleDeleteSuspended,
    handleClearCart,
    updateQuantity,
    removeFromCart,
    filteredCatalog,
    isListening,
    toggleVoiceSearch,
    handleSearchSubmit,
    handleSearchQueryChange,
    handleBarcodeScanned
  };
}
