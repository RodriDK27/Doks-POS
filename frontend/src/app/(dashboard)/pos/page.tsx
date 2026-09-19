'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Wifi,
  WifiOff,
  RefreshCw,
  History,
  Plus,
  Keyboard,
  Package,
  Search,
  Mic,
  Camera,
  Zap,
  Layers,
  Receipt,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/CustomSelect';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { cn } from '@/lib/utils';

import { usePOS } from './hooks/usePOS';
import { ProductCard } from './components/ProductCard';
import { TicketPanel } from './components/TicketPanel';
import { PaymentPanel } from './components/PaymentPanel';
import { GenericSaleDialog } from './components/GenericSaleDialog';
import { BulkProductDialog } from './components/BulkProductDialog';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { SuspendCartDialog } from './components/SuspendCartDialog';
import { SuspendedCartsDialog } from './components/SuspendedCartsDialog';
import { ShortcutsHelpDialog } from './components/ShortcutsHelpDialog';
import { ExpressScannerMobileView } from './components/ExpressScannerMobileView';
import { QuickLinkBarcodeModal } from './components/QuickLinkBarcodeModal';
import { ZeroStockRestockModal } from './components/ZeroStockRestockModal';
import { DailySuppliersModal } from '../register/components/DailySuppliersModal';
import { QuickSupplierPaymentModal } from '@/components/QuickSupplierPaymentModal';

export default function POSPage() {
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isDailySuppliersOpen, setIsDailySuppliersOpen] = useState(false);
  const [isQuickSupplierPaymentOpen, setIsQuickSupplierPaymentOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<'STANDARD' | 'EXPRESS'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('doks_pos_mobile_mode');
      if (savedMode === 'EXPRESS' || savedMode === 'STANDARD') {
        return savedMode;
      }
      return window.innerWidth < 768 ? 'EXPRESS' : 'STANDARD';
    }
    return 'STANDARD';
  });

  const changeMobileMode = (mode: 'STANDARD' | 'EXPRESS') => {
    setMobileMode(mode);
    localStorage.setItem('doks_pos_mobile_mode', mode);
  };

  const {
    isOnline,
    isSyncing,
    syncQueueCount,
    syncErrorCount,
    syncOfflineSales,
    cartItems,
    suspendedCarts,
    getTotal,
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
    handleQuickLinkBarcode,
    isZeroStockModalOpen,
    setIsZeroStockModalOpen,
    selectedZeroStockProduct,
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
    selectedCatalogIndex,
    handleSearchKeyDown,
    isListening,
    toggleVoiceSearch,
    handleSearchSubmit,
    handleSearchQueryChange,
    handleBarcodeScanned,
  } = usePOS();

  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const focusSearchInput = useCallback(() => {
    if (mobileMode === 'EXPRESS' && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
      mobileSearchInputRef.current.select();
      return;
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [mobileMode, searchInputRef]);

  // Captura global prioritaria de F2 y evento pos-focus-search
  useEffect(() => {
    const handleF2KeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        focusSearchInput();
      }
    };
    const handleFocusSearchEvent = () => {
      focusSearchInput();
    };

    window.addEventListener('keydown', handleF2KeyDown, true);
    window.addEventListener('pos-focus-search', handleFocusSearchEvent);
    return () => {
      window.removeEventListener('keydown', handleF2KeyDown, true);
      window.removeEventListener('pos-focus-search', handleFocusSearchEvent);
    };
  }, [focusSearchInput]);

  // Atajo F7 para abrir Pago Express a Proveedor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7') {
        e.preventDefault();
        setIsQuickSupplierPaymentOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Coordinación del atajo F8 para abrir modal de cobro o confirmar venta
  useEffect(() => {
    const handleF8Event = async () => {
      if (!isCheckoutDrawerOpen) {
        if (cartItems.length > 0) {
          setIsCheckoutDrawerOpen(true);
        }
      } else {
        if (canCheckout && !isSubmitting) {
          await handleCheckout();
          setIsCheckoutDrawerOpen(false);
          focusSearchInput();
        }
      }
    };

    window.addEventListener('pos-f8-press', handleF8Event);
    return () => window.removeEventListener('pos-f8-press', handleF8Event);
  }, [isCheckoutDrawerOpen, cartItems.length, canCheckout, isSubmitting, handleCheckout, focusSearchInput]);

  // Atajos de teclado generales (Escape para cerrar cobro, +, -, Delete para editar el ticket)
  useEffect(() => {
    const handleTicketKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCheckoutDrawerOpen) {
          e.preventDefault();
          setIsCheckoutDrawerOpen(false);
          focusSearchInput();
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isInput && !isCheckoutDrawerOpen && cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          updateQuantity(lastItem.id, lastItem.quantity + 1);
        } else if (e.key === '-') {
          e.preventDefault();
          if (lastItem.quantity > 1) {
            updateQuantity(lastItem.id, lastItem.quantity - 1);
          } else {
            removeFromCart(lastItem.id);
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          removeFromCart(lastItem.id);
        }
      }
    };

    window.addEventListener('keydown', handleTicketKeyboard);
    return () => window.removeEventListener('keydown', handleTicketKeyboard);
  }, [isCheckoutDrawerOpen, cartItems, updateQuantity, removeFromCart, focusSearchInput]);

  // Autofocus del buscador al iniciar la página o al vaciar/cobrar el carrito
  useEffect(() => {
    if (cartItems.length === 0) {
      focusSearchInput();
    }
  }, [cartItems.length, focusSearchInput]);
  return (
    <div className="flex flex-col h-[calc(100vh-9.8rem)] md:h-[calc(100vh-10.2rem)] overflow-hidden gap-2 select-none pb-1 sm:pb-2">
      {/* BARRA COMPACTA DE ACCIONES Y HERRAMIENTAS DEL POS (OPTIMIZADA PARA TABLET) */}
      <div className="flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          {/* BOTONES DE CAMBIO DE MODO (VISIBLE EN MOBILE/TABLET `lg:hidden`) */}
          <div className="flex lg:hidden items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border dark:border-slate-800">
            <Button
              variant={mobileMode === 'STANDARD' ? 'default' : 'ghost'}
              className={cn(
                "h-7 px-2 font-bold text-xs rounded-lg transition-all",
                mobileMode === 'STANDARD'
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500"
              )}
              onClick={() => changeMobileMode('STANDARD')}
              title="Modo Pestañas"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </Button>
            <Button
              variant={mobileMode === 'EXPRESS' ? 'default' : 'ghost'}
              className={cn(
                "h-7 px-2 font-bold text-xs rounded-lg transition-all",
                mobileMode === 'EXPRESS'
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500"
              )}
              onClick={() => changeMobileMode('EXPRESS')}
              title="Escáner Express"
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* ESTADO DE CONEXIÓN */}
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-200/40">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}

          {syncQueueCount > 0 && (
            <button
              onClick={() => setIsOfflineSyncModalOpen(true)}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-200/40 animate-pulse cursor-pointer"
            >
              <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
              <span>{syncQueueCount} pendientes</span>
            </button>
          )}
        </div>

        {/* ACCIONES RÁPIDAS DEL POS */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">

          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
            onClick={() => setIsQuickSupplierPaymentOpen(true)}
            title="Pago Express a Proveedor (F7)"
          >
            <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Pagar Proveedor</span>
            <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 rounded font-black text-emerald-800 dark:text-emerald-300">F7</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
            onClick={() => setIsDailySuppliersOpen(true)}
            title="Proveedores Diarios"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden md:inline">Preventas</span>
          </Button>

          {suspendedCarts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer relative shadow-2xs"
              onClick={() => setIsSuspendedOpen(true)}
              title="Carritos en Espera"
            >
              <History className="h-3.5 w-3.5 text-amber-500" />
              <span className="h-4 w-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">
                {suspendedCarts.length}
              </span>
            </Button>
          )}

          <Link href="/tickets">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Historial de Tickets"
            >
              <Receipt className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tickets</span>
            </Button>
          </Link>

          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-2xs border-none"
            onClick={() => setIsGenericOpen(true)}
            title="Venta de producto sin código (F4)"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Exprés</span>
            <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-black text-white">F4</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer"
            onClick={() => setIsShortcutsHelpOpen(true)}
            title="Atajos de teclado"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PESTAÑAS CATÁLOGO / TICKET EN MÓVIL Y TABLETS (SÓLO SI ESTÁ ACTIVO MODO ESTÁNDAR) */}
      {mobileMode === 'STANDARD' && (
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl lg:hidden w-full shrink-0 border border-slate-200 dark:border-slate-800">
          <Button
            variant={posTab === 'CATALOG' ? 'default' : 'ghost'}
            className={`flex-1 h-9 font-extrabold text-xs rounded-xl transition-all cursor-pointer ${posTab === 'CATALOG' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-slate-500'
              }`}
            onClick={() => setPosTab('CATALOG')}
          >
            <Package className="h-4 w-4 mr-1.5" /> Catálogo
          </Button>
          <Button
            variant={posTab === 'CART' ? 'default' : 'ghost'}
            className={`flex-1 h-9 font-extrabold text-xs rounded-xl transition-all cursor-pointer ${posTab === 'CART' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-slate-500'
              }`}
            onClick={() => setPosTab('CART')}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" /> Ticket ({cartItemsCount})
          </Button>
        </div>
      )}

      {/* VISTA ESCÁNER EXPRESS EN MÓVIL Y TABLETS */}
      {mobileMode === 'EXPRESS' && (
        <div className="flex lg:hidden flex-col flex-1 h-full min-h-0 overflow-hidden">
          <ExpressScannerMobileView
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            onSearchSubmit={handleSearchSubmit}
            searchInputRef={mobileSearchInputRef}
            onBarcodeScanned={handleBarcodeScanned}
            onToggleVoice={toggleVoiceSearch}
            isListening={isListening}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={categories}
            cartItems={cartItems}
            cartItemsCount={cartItemsCount}
            getTotal={getTotal}
            discount={discount}
            setDiscount={setDiscount}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onClearCart={handleClearCart}
            onProceedToPayment={() => setIsCheckoutDrawerOpen(true)}
            onSuspend={() => setIsSuspendModalOpen(true)}
            filteredCatalog={filteredCatalog}
            onAddProduct={handleTouchAdd}
          />
        </div>
      )}

      {/* CUERPO DEL POS (DISEÑO A 2 COLUMNAS ORIENTADO A TABLET LANDSCAPE / ESCRITORIO / PESTAÑAS) */}
      <div className={`flex-1 flex-col lg:flex-row gap-4 overflow-hidden min-h-0 ${mobileMode === 'STANDARD' ? 'flex' : 'hidden lg:flex'}`}>

        {/* COLUMNA IZQUIERDA: CATÁLOGO TÁCTIL */}
        <div className={`lg:flex-[1.2] lg:flex-[1.25] xl:flex-[1.35] flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden h-full ${posTab === 'CATALOG' ? 'flex' : 'hidden lg:flex'
          }`}>
          {/* BUSCADOR CON MULTIPLICADOR Y NAVEGACIÓN */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 shrink-0 space-y-2">
            <div className="flex gap-2 items-center w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar o '3*coca'... [Flechas ↑↓, Enter]"
                  className="pl-10 pr-12 h-11 border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-xs font-bold shadow-xs focus-visible:ring-indigo-500 w-full"
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {!searchQuery && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-500/30 rounded font-black pointer-events-none select-none">
                    F2
                  </span>
                )}
              </div>
              <Button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="h-11 w-11 sm:w-auto px-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95 transition-all shrink-0 shadow-xs"
                title="Escanear con Cámara"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Cámara</span>
              </Button>
              <Button
                type="button"
                onClick={toggleVoiceSearch}
                className="h-11 w-11 sm:w-auto px-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs bg-indigo-50 dark:bg-indigo-955/40 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100/70 border border-indigo-100/50 dark:border-indigo-900/30 cursor-pointer active:scale-95 transition-all shrink-0 shadow-none"
              >
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar por voz</span>
              </Button>
            </div>

            {/* BARRA SUPERIOR DE CATEGORÍAS TIPO PILLS / CHIPS DE 1 TOQUE */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('TODOS')}
                className={cn(
                  "px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1",
                  activeCategory === 'TODOS'
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span>TODOS</span>
                <span className={cn("text-[9px] px-1.5 py-0.2 rounded-full font-extrabold", activeCategory === 'TODOS' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                  {catalogProducts.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = catalogProducts.filter((p) => p.category === cat).length;
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1.5",
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{cat.toUpperCase()}</span>
                    <span className={cn("text-[9px] px-1.5 py-0.2 rounded-full font-extrabold", isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUADRÍCULA DE PRODUCTOS */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/20 dark:bg-slate-900/10 scrollbar-none">
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredCatalog.map((prod, idx) => {
                  const cartItem = cartItems.find(item => item.id === prod.id);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;
                  return (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      qtyInCart={qtyInCart}
                      onAdd={handleTouchAdd}
                      searchQuery={searchQuery}
                      isSelectedByKeyboard={idx === selectedCatalogIndex}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <Package className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs font-bold">No se encontraron productos.</p>
              </div>
            )}
          </div>

          {/* FOOTER: CONTADOR Y GUÍA RÁPIDA DE ATAJOS */}
          <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 flex flex-wrap justify-between items-center text-[10.5px] font-bold text-slate-400 dark:text-slate-500 shrink-0 gap-2">
            <span>
              {filteredCatalog.length} de {catalogProducts.length} productos
            </span>
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <span><kbd className="px-1 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono">F2</kbd> Buscar</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono">↑↓</kbd> Navegar</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono">Enter</kbd> Agregar</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono">F7</kbd> Proveedor</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: TICKET PANEL */}
        <div className={`lg:flex-[0.8] xl:flex-[0.75] flex flex-col gap-3.5 overflow-hidden min-w-0 h-full ${posTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
          <TicketPanel
            cartItems={cartItems}
            cartItemsCount={cartItemsCount}
            getTotal={getTotal}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            customers={customers}
            discount={discount}
            setDiscount={setDiscount}
            onProceedToPayment={() => setIsCheckoutDrawerOpen(true)}
            onSuspend={() => setIsSuspendModalOpen(true)}
            onClearCart={handleClearCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        </div>

      </div>

      {/* DIÁLOGOS Y MODALES AUXILIARES */}

      {/* MODAL VENTA GENÉRICA / LIBRE */}
      <GenericSaleDialog
        open={isGenericOpen}
        onOpenChange={setIsGenericOpen}
        genericPrice={genericPrice}
        setGenericPrice={setGenericPrice}
        genericName={genericName}
        setGenericName={setGenericName}
        onAdd={handleAddGeneric}
        handleKeypadPress={handleKeypadPress}
      />

      {/* MODAL VENTA A GRANEL (PESO / IMPORTE) */}
      <BulkProductDialog
        key={selectedBulkProduct?.id ?? 'bulk'}
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        product={selectedBulkProduct}
        onConfirm={handleConfirmBulkAdd}
      />

      {/* MODAL COLA OFFLINE */}
      <OfflineSyncModal
        open={isOfflineSyncModalOpen}
        onOpenChange={setIsOfflineSyncModalOpen}
      />

      <SuspendCartDialog
        open={isSuspendModalOpen}
        onOpenChange={setIsSuspendModalOpen}
        suspendName={suspendName}
        setSuspendName={setSuspendName}
        onConfirm={handleSuspendCart}
      />

      <SuspendedCartsDialog
        open={isSuspendedOpen}
        onOpenChange={setIsSuspendedOpen}
        suspendedCarts={suspendedCarts}
        onResume={handleResumeCart}
        onDelete={handleDeleteSuspended}
      />

      <ShortcutsHelpDialog
        open={isShortcutsHelpOpen}
        onOpenChange={setIsShortcutsHelpOpen}
      />

      {/* MODAL CENTRAL DE COBRO (DESKTOP Y MÓVIL) */}
      {isCheckoutDrawerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg sm:max-w-xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <PaymentPanel
              getTotal={getTotal}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customers={customers}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              isSubmitting={isSubmitting}
              changeAmount={changeAmount}
              amountPaidInputRef={amountPaidInputRef}
              confirmButtonRef={confirmButtonRef}
              canCheckout={canCheckout}
              onCheckout={async () => {
                await handleCheckout();
                setIsCheckoutDrawerOpen(false);
              }}
              onBackToTicket={() => {
                setIsCheckoutDrawerOpen(false);
                focusSearchInput();
              }}
            />
          </div>
        </div>
      )}

      {/* OVERLAY DE BÚSQUEDA POR VOZ PARA ACCESIBILIDAD */}
      {isListening && (
        <div className="fixed inset-0 z-[999] bg-slate-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center justify-center gap-6 shadow-2xl border border-slate-200/60 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
            <div className="h-20 w-20 bg-rose-50 dark:bg-rose-955/20 rounded-full flex items-center justify-center text-rose-500 animate-bounce relative">
              <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping duration-1000" />
              <Mic className="h-10 w-10 relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100">Te estoy escuchando...</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Di el nombre del producto que buscas.</p>
            </div>
            <Button
              variant="outline"
              onClick={toggleVoiceSearch}
              className="mt-2 border-slate-200 dark:border-slate-800 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl w-full h-10 cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE VINCULACIÓN RÁPIDA DE CÓDIGO NO RECONOCIDO */}
      <QuickLinkBarcodeModal
        open={isQuickLinkOpen}
        onOpenChange={setIsQuickLinkOpen}
        unrecognizedBarcode={unrecognizedBarcode}
        catalogProducts={catalogProducts}
        onLinkBarcode={handleQuickLinkBarcode}
      />

      {/* MODAL DE RESTABLECIMIENTO EXPRÉS DE STOCK (CUANDO STOCK ES 0) */}
      <ZeroStockRestockModal
        open={isZeroStockModalOpen}
        onOpenChange={setIsZeroStockModalOpen}
        product={selectedZeroStockProduct}
        onRestockAndAdd={handleQuickRestockAndAdd}
        onAddWithoutRestock={handleAddWithoutRestock}
      />

      {/* MODAL DE ESCÁNER DE CÓDIGO DE BARRAS CON CÁMARA */}
      <BarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(barcode) => {
          handleBarcodeScanned(barcode);
          setIsCameraScannerOpen(false);
        }}
        title="Escanear Producto para Cobro"
      />

      {/* MODAL TODO-EN-UNO DE PROVEEDORES Y GASTOS DIARIOS */}
      <DailySuppliersModal
        open={isDailySuppliersOpen}
        onOpenChange={setIsDailySuppliersOpen}
      />

      {/* MODAL UNIVERSAL PAGO EXPRESS A PROVEEDOR (1 PASO) */}
      <QuickSupplierPaymentModal
        open={isQuickSupplierPaymentOpen}
        onOpenChange={setIsQuickSupplierPaymentOpen}
      />
    </div>
  );
}
