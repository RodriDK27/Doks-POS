import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useCartStore } from '@/store/useCartStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import dbHelper from '@/lib/indexedDb';
import { parseAxiosError } from '@/lib/errorMapper';
import { Product, Customer } from '../types';

const SYNONYMS: Record<string, string[]> = {
  refresco: ['coca', 'fanta', 'sprite', 'sidral', 'soda', 'pepsi', 'mundet', 'boing'],
  soda: ['coca', 'fanta', 'sprite', 'sidral', 'pepsi', 'mundet', 'boing'],
  leche: ['alpura', 'lala', 'leche', 'santa clara'],
  sabritas: ['papas', 'chips', 'rufles', 'doritos', 'cheetos', 'fritos'],
  pan: ['bimbo', 'tía rosa', 'concha', 'dona', 'bolillo'],
};

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

  // Estados de cobro
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const searchInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda por voz
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const toggleVoiceSearch = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('El reconocimiento de voz no es soportado en este navegador.');
      return;
    }

    if (isListeningRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('SpeechRecognition stop error:', err);
        }
      }
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    // Solicitar permisos de micrófono
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let audioDevices = devices.filter(d => d.kind === 'audioinput');
        
        if (audioDevices.length === 0 || !audioDevices[0].label) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          devices = await navigator.mediaDevices.enumerateDevices();
          audioDevices = devices.filter(d => d.kind === 'audioinput');
        }

        // Buscar dispositivo "D1"
        const d1Device = audioDevices.find(d => d.label.toLowerCase().includes('d1'));
        
        const constraints = d1Device 
          ? { audio: { deviceId: { exact: d1Device.deviceId } } } 
          : { audio: true };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Detener todas las pistas de audio para liberar el hardware del micrófono
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping stream track:', e);
          }
        });
      } catch (micErr) {
        console.error('Microphone permission request failed:', micErr);
        toast.error('Permiso de micrófono denegado o no disponible. Habilítalo en tu navegador.');
        return;
      }
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'es-MX';

      recog.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recog.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onerror = (event: any) => {
        setIsListening(false);
        isListeningRef.current = false;
        
        if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado o bloqueado.');
        } else if (event.error === 'no-speech') {
          toast.error('No se detectó voz. Intenta de nuevo.');
        } else if (event.error === 'network') {
          toast.error('Error de red. Asegúrate de tener conexión a Internet.');
        } else {
          toast.error(`Error de búsqueda por voz: ${event.error}`);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const cleanedText = transcript.endsWith('.') ? transcript.slice(0, -1) : transcript;
        setSearchQuery(cleanedText);
        toast.success(`Búsqueda por voz: "${cleanedText}"`);
      };

      recognitionRef.current = recog;
      recog.start();
    } catch (err) {
      console.error('SpeechRecognition start error:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

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
      toast.warning(`"${product.name}" no tiene existencias en inventario.`);
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
    setGenericName('');
    
    // Auto cambiar a la pestaña de carrito si es táctil para ver el cobro
    setPosTab('CART');
  };

  const normalizeText = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredCatalog = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return catalogProducts.filter(p => activeCategory === 'TODOS' || p.category === activeCategory);
    }

    const normalizedQuery = normalizeText(rawQuery);
    // Split query by spaces to match words in any order
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    return catalogProducts.filter(p => {
      const matchesCategory = activeCategory === 'TODOS' || p.category === activeCategory;
      if (!matchesCategory) return false;

      const normName = normalizeText(p.name);
      const normCat = p.category ? normalizeText(p.category) : '';
      const normBarcode = p.barcode ? p.barcode.toLowerCase() : '';

      // Product must match all words of the search query
      return queryWords.every(word => {
        // Expand query term with synonyms only if search word is longer than 2 characters
        const synonyms = word.length > 2 ? (SYNONYMS[word] || []) : [];
        const termsToMatch = [word, ...synonyms.map(normalizeText)];

        return termsToMatch.some(term => {
          const nameMatches = normName.includes(term);
          const catMatches = normCat ? normCat.includes(term) : false;
          const barcodeMatches = normBarcode ? normBarcode.includes(term) : false;

          return nameMatches || catMatches || barcodeMatches;
        });
      });
    });
  }, [catalogProducts, searchQuery, activeCategory]);


  const handleBarcodeScanned = useCallback((barcode: string) => {
    const code = barcode.trim();
    if (!code) return;

    const product = catalogProducts.find(p => p.barcode === code || p.id === code);
    if (product) {
      if (product.unitType === 'WEIGHT') {
        setSelectedBulkProduct(product);
        setIsBulkOpen(true);
        return;
      }
      if (product.stock <= 0) {
        toast.warning(`"${product.name}" no tiene existencias en inventario.`);
      }
      addToCart(product, 1);
      toast.success(`+1 ${product.name}`, { id: 'pos-add-toast' });
    } else {
      toast.error(`Producto no encontrado (${code})`);
    }
  }, [catalogProducts, addToCart]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    const query = value.trim();
    if (!query || query.length < 3) return; // avoid matching incomplete inputs

    const exactBarcodeProduct = catalogProducts.find(p => p.barcode === query);
    if (exactBarcodeProduct) {
      if (exactBarcodeProduct.stock <= 0) {
        toast.warning(`"${exactBarcodeProduct.name}" no tiene existencias en inventario.`);
      }
      addToCart(exactBarcodeProduct, 1);
      toast.success(`Añadido: ${exactBarcodeProduct.name} (código escaneado)`, { id: 'pos-add-toast' });
      setSearchQuery('');
    }
  }, [catalogProducts, addToCart, setSearchQuery]);

  const handleSearchSubmit = useCallback(() => {
    if (filteredCatalog.length === 1) {
      const singleProduct = filteredCatalog[0];
      if (singleProduct.stock <= 0) {
        toast.warning(`"${singleProduct.name}" no tiene existencias en inventario.`);
      }
      addToCart(singleProduct, 1);
      toast.success(`Añadido: ${singleProduct.name}`, { id: 'pos-add-toast' });
      setSearchQuery('');
    }
  }, [filteredCatalog, addToCart, setSearchQuery]);

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
        
        // Simular descuento de stock localmente
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
      // Recargar catálogo para actualizar el stock local
      mutateProducts();
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
  }, [cartItems, paymentMethod, posTab, amountPaid, selectedCustomerId, canCheckout, handleCheckout, isGenericOpen, isShortcutsHelpOpen, isSuspendModalOpen, isSuspendedOpen]);

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
    genericName,
    setGenericName,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    isSubmitting,
    changeAmount,

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
