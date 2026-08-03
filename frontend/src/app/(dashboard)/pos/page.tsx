'use client';

import React, { useState, useEffect } from 'react';
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
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';

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

export default function POSPage() {
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
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
    handleBarcodeScanned,
  } = usePOS();

  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);

  // Autofocus del buscador al iniciar la página o al vaciar/cobrar el carrito
  useEffect(() => {
    if (cartItems.length === 0) {
      searchInputRef.current?.focus();
    }
  }, [cartItems.length, searchInputRef]);

  return (
    <div className="flex flex-col h-[calc(100vh-10.8rem)] md:h-[calc(100vh-12rem)] overflow-hidden gap-2 sm:gap-4 select-none pb-1 sm:pb-0">


      {/* HEADER DE LA PÁGINA CON BOTONES DE MODO DE VISTA */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Operaciones de Caja
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Vender Productos
          </h1>
        </div>

        {/* BOTONES DE CAMBIO DE MODO (VISIBLES EN MÓVIL Y TABLETS EN VERTICAL `lg:hidden`) */}
        <div className="flex lg:hidden items-center bg-slate-100/90 dark:bg-slate-800/60 p-1 rounded-2xl border dark:border-slate-800">
          <Button
            variant={mobileMode === 'STANDARD' ? 'default' : 'ghost'}
            className={`h-8 px-2 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer ${mobileMode === 'STANDARD'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 hover:bg-slate-50/20'
              }`}
            onClick={() => changeMobileMode('STANDARD')}
            title="Modo Pestañas"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </Button>
          <Button
            variant={mobileMode === 'EXPRESS' ? 'default' : 'ghost'}
            className={`h-8 px-2 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer ${mobileMode === 'EXPRESS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50/20'
              }`}
            onClick={() => changeMobileMode('EXPRESS')}
            title="Escáner Express"
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>      {/* BARRA SUPERIOR DE ACCIONES Y CONECTIVIDAD */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 px-3 sm:px-5 py-2.5 sm:py-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-12 sm:w-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0 shadow-xs">
              <ShoppingCart className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-xs sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight truncate">Punto de Venta</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200/40 shrink-0">
                    <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> En Línea
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-extrabold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-200/40 animate-pulse shrink-0">
                    <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Offline
                  </span>
                )}

                {syncQueueCount > 0 && (
                  <button
                    onClick={() => setIsOfflineSyncModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 sm:px-2.5 py-0.5 rounded-full border border-indigo-200/40 animate-pulse cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncing
                        ? 'Sincronizando...'
                        : syncErrorCount > 0
                          ? `${syncErrorCount} con error (${syncQueueCount})`
                          : `${syncQueueCount} por sincronizar`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS EN MÓVIL (COMPACTAS Y SIN DESBORDAMIENTO) */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            {suspendedCarts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold text-xs h-9 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer relative shadow-xs"
                onClick={() => setIsSuspendedOpen(true)}
              >
                <History className="h-4 w-4" />
                <span className="h-4.5 w-4.5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs">
                  {suspendedCarts.length}
                </span>
              </Button>
            )}

            <Link href="/tickets">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs h-9 rounded-xl flex items-center gap-1.5 px-2.5 active:scale-95 transition-all cursor-pointer bg-slate-100/60 dark:bg-slate-800/40 shadow-xs"
                title="Historial de Tickets"
              >
                <Receipt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden min-[380px]:inline">Tickets</span>
              </Button>
            </Link>

            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl flex items-center gap-1 px-2.5 active:scale-95 transition-all cursor-pointer shadow-xs border-none"
              onClick={() => setIsGenericOpen(true)}
            >
              <Plus className="h-4 w-4 text-white stroke-[2.5]" /> Exprés
            </Button>
          </div>
        </div>

        {/* ACCIONES DEL POS EN ESCRITORIO / TABLET */}
        <div className="hidden sm:flex items-center justify-end gap-2">
          {suspendedCarts.length > 0 && (
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-500 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-bold text-xs sm:text-sm h-10 rounded-xl flex items-center gap-1.5 shrink-0 px-3.5 active:scale-95 transition-all cursor-pointer relative shadow-xs"
              onClick={() => setIsSuspendedOpen(true)}
            >
              <History className="h-4.5 w-4.5" />
              <span>Espera</span>
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-xs">
                {suspendedCarts.length}
              </span>
            </Button>
          )}

          <Link href="/tickets">
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm h-10 rounded-xl flex items-center gap-1.5 px-3.5 active:scale-95 transition-all cursor-pointer bg-slate-100/60 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            >
              <Receipt className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" /> Tickets
            </Button>
          </Link>

          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm h-10 rounded-xl flex items-center gap-1.5 px-4 active:scale-95 transition-all cursor-pointer shadow-xs border-none"
            onClick={() => setIsGenericOpen(true)}
          >
            <Plus className="h-4.5 w-4.5 text-white stroke-[2.5]" /> Cobro Rápido
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-11.5 w-11.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer"
            onClick={() => setIsShortcutsHelpOpen(true)}
            title="Atajos de teclado"
          >
            <Keyboard className="h-5.5 w-5.5" />
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
            searchInputRef={searchInputRef}
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
          {/* BUSCADOR */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 shrink-0">
            <div className="flex gap-2 items-center w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Nombre o código de barras... [F2]"
                  className="pl-10 h-11 border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-xs font-bold shadow-xs focus-visible:ring-indigo-500 w-full"
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                />
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
          </div>

          {/* CUADRÍCULA DE PRODUCTOS */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/20 dark:bg-slate-900/10 scrollbar-none">
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredCatalog.map((prod) => {
                  const cartItem = cartItems.find(item => item.id === prod.id);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;
                  return (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      qtyInCart={qtyInCart}
                      onAdd={handleTouchAdd}
                      searchQuery={searchQuery}
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

          {/* BARRA INFERIOR / FOOTER: FILTRO DE CATEGORÍAS */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 flex justify-end items-center shrink-0">
            <div className="w-52">
              <CustomSelect
                menuPlacement="top"
                value={activeCategory}
                onChange={setActiveCategory}
                placeholder="Todas las categorías"
                options={[
                  { value: 'TODOS', label: 'Todas las categorías' },
                  ...categories.map((c) => ({
                    value: c,
                    label: c.toUpperCase(),
                  })),
                ]}
              />
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
              onBackToTicket={() => setIsCheckoutDrawerOpen(false)}
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

      {/* MODAL DE ESCÁNER DE CÓDIGO DE BARRAS CON CÁMARA */}
      <BarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(barcode) => {
          setSearchQuery(barcode);
          handleSearchQueryChange(barcode);
          handleSearchSubmit();
          setIsCameraScannerOpen(false);
        }}
        title="Escanear Producto para Cobro"
      />
    </div>
  );
}
