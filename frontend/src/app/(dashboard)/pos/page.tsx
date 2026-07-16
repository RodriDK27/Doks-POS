'use client';

import React from 'react';
import { 
  ShoppingCart, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  History, 
  Plus, 
  Keyboard, 
  Package, 
  Search 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { usePOS } from './hooks/usePOS';
import { getCategoryIcon } from './helpers';
import { ProductCard } from './components/ProductCard';
import { TicketPanel } from './components/TicketPanel';
import { PaymentPanel } from './components/PaymentPanel';
import { GenericSaleDialog } from './components/GenericSaleDialog';
import { SuspendCartDialog } from './components/SuspendCartDialog';
import { SuspendedCartsDialog } from './components/SuspendedCartsDialog';
import { ShortcutsHelpDialog } from './components/ShortcutsHelpDialog';

export default function POSPage() {
  const {
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
    filteredCatalog,
  } = usePOS();

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-9rem)] overflow-hidden gap-4 select-none">
      
      {/* BARRA SUPERIOR DE ACCIONES Y CONECTIVIDAD */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 px-4 py-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">Terminal Punto de Venta</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 px-2 py-0.5 rounded-full border border-emerald-200/30">
                  <Wifi className="h-3 w-3" /> En Línea
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-550 bg-amber-50 dark:bg-amber-950/10 px-2 py-0.5 rounded-full border border-amber-200/30 animate-pulse">
                  <WifiOff className="h-3 w-3" /> Modo Local (Offline)
                </span>
              )}

              {syncQueueCount > 0 && (
                <button
                  onClick={syncOfflineSales}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-200/30 hover:bg-indigo-100/50 cursor-pointer active:scale-95 transition-all"
                  title="Presiona para sincronizar ahora"
                >
                  <RefreshCw className="h-3 w-3 animate-spin duration-3000" /> {syncQueueCount} por sincronizar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ACCIONES DEL POS */}
        <div className="flex items-center justify-end gap-2">
          {suspendedCarts.length > 0 && (
            <Button
              variant="outline"
              className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-100/50 font-black text-xs h-10 rounded-xl flex items-center gap-1.5 shrink-0 px-3.5 active:scale-95 transition-all cursor-pointer relative"
              onClick={() => setIsSuspendedOpen(true)}
            >
              <History className="h-4 w-4" />
              <span>Espera</span>
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                {suspendedCarts.length}
              </span>
            </Button>
          )}

          <Button
            variant="outline"
            className="border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350 font-extrabold text-xs h-10 rounded-xl flex items-center gap-1.5 px-3.5 active:scale-95 transition-all cursor-pointer"
            onClick={() => setIsGenericOpen(true)}
          >
            <Plus className="h-4 w-4 text-indigo-500" /> Cobro Rápido
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer"
            onClick={() => setIsShortcutsHelpOpen(true)}
            title="Atajos de teclado"
          >
            <Keyboard className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑA TÁCTIL EN TABLET VERTICAL / MÓVIL */}
      <div className="flex bg-slate-100/80 dark:bg-slate-800/40 p-1 rounded-2xl md:hidden w-full shrink-0 border dark:border-slate-800/60">
        <Button
          variant={posTab === 'CATALOG' ? 'default' : 'ghost'}
          className={`flex-1 h-11 font-extrabold text-xs rounded-xl transition-all cursor-pointer ${
            posTab === 'CATALOG' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50/20'
          }`}
          onClick={() => setPosTab('CATALOG')}
        >
          <Package className="h-4 w-4 mr-1.5 text-indigo-650 dark:text-indigo-400" /> Catálogo
        </Button>
        <Button
          variant={posTab === 'CART' ? 'default' : 'ghost'}
          className={`flex-1 h-11 font-extrabold text-xs rounded-xl transition-all cursor-pointer ${
            posTab === 'CART' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50/20'
          }`}
          onClick={() => setPosTab('CART')}
        >
          <ShoppingCart className="h-4 w-4 mr-1.5 text-indigo-655 dark:text-indigo-400" /> Ticket ({cartItemsCount})
        </Button>
        <Button
          variant={posTab === 'PAYMENT' ? 'default' : 'ghost'}
          disabled={cartItems.length === 0}
          className={`flex-1 h-11 font-extrabold text-xs rounded-xl transition-all cursor-pointer ${
            posTab === 'PAYMENT' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50/20'
          }`}
          onClick={() => setPosTab('PAYMENT')}
        >
          <ShoppingCart className="h-4 w-4 mr-1.5 text-indigo-655 dark:text-indigo-400" /> Cobro
        </Button>
      </div>

      {/* CUERPO DEL POS (DISEÑO A 2 COLUMNAS ORIENTADO A TABLET LANDSCAPE / ESCRITORIO) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO TÁCTIL (62% DE ANCHO EN DESKTOP) */}
        <div className={`md:flex-[1.2] lg:flex-[1.25] xl:flex-[1.35] flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden ${
          posTab === 'CATALOG' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* BUSCADOR Y CATEGORÍAS */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 space-y-3 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Nombre o código de barras... [F2]"
                className="pl-10 h-11 border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-bold shadow-xs focus-visible:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* CATEGORÍAS (PILLS TÁCTILES MÁS GRANDES) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none items-center">
              <Button
                variant={activeCategory === 'TODOS' ? 'default' : 'outline'}
                className={`h-9 px-4 text-[10px] font-black uppercase rounded-xl shrink-0 cursor-pointer tracking-wider active:scale-95 transition-all ${
                  activeCategory === 'TODOS' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800/80 text-slate-650 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveCategory('TODOS')}
              >
                TODOS
              </Button>
              {categories.map((c) => {
                const Icon = getCategoryIcon(c);
                const isActive = activeCategory === c;
                return (
                  <Button
                    key={c}
                    variant={isActive ? 'default' : 'outline'}
                    className={`h-9 px-3.5 text-[10px] font-black uppercase rounded-xl shrink-0 cursor-pointer tracking-wider active:scale-95 transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800/80 text-slate-650 dark:text-slate-355 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setActiveCategory(c)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{c}</span>
                  </Button>
                );
              })}
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
        </div>

        {/* COLUMNA DERECHA: TICKET / PAGO (38% DE ANCHO EN DESKTOP) */}
        <div className={`md:flex-[0.8] xl:flex-[0.75] flex flex-col gap-3.5 overflow-hidden min-w-0 ${
          posTab === 'CART' || posTab === 'PAYMENT' ? 'flex' : 'hidden md:flex'
        }`}>
          {posTab !== 'PAYMENT' ? (
            <TicketPanel
              cartItems={cartItems}
              cartItemsCount={cartItemsCount}
              getSubtotal={getSubtotal}
              getTotal={getTotal}
              discount={discount}
              setDiscount={setDiscount}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customers={customers}
              onProceedToPayment={() => setPosTab('PAYMENT')}
              onSuspend={() => setIsSuspendModalOpen(true)}
              onClearCart={handleClearCart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          ) : (
            <PaymentPanel
              getTotal={getTotal}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customers={customers}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              changeAmount={changeAmount}
              amountPaidInputRef={amountPaidInputRef}
              confirmButtonRef={confirmButtonRef}
              canCheckout={canCheckout}
              onCheckout={handleCheckout}
              onBackToTicket={() => setPosTab('CART')}
            />
          )}
        </div>

      </div>

      {/* DIÁLOGOS Y MODALES AUXILIARES */}
      <GenericSaleDialog
        open={isGenericOpen}
        onOpenChange={setIsGenericOpen}
        genericPrice={genericPrice}
        genericName={genericName}
        setGenericName={setGenericName}
        onAdd={handleAddGeneric}
        handleKeypadPress={handleKeypadPress}
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

    </div>
  );
}
