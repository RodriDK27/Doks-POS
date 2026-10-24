'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WifiOff,
  RefreshCw,
  History,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

import { usePOS } from './hooks/usePOS';
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
import { QuickRestockDialog } from '../inventory/components/QuickRestockDialog';
import { FavoritesDialog } from './components/FavoritesDialog';
import { useFavoriteToggle } from './hooks/useFavoriteToggle';
import { QuickSupplierPaymentModal } from '@/components/QuickSupplierPaymentModal';
import { PosMoreMenu } from './components/PosMoreMenu';
import { LastSaleBar } from './components/LastSaleBar';
import { TicketDetailsDialog } from '../tickets/components/TicketDetailsDialog';
import type { Sale } from '../tickets/types';

export default function POSPage() {
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isQuickRestockOpen, setIsQuickRestockOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const toggleFavorite = useFavoriteToggle();
  // Sumar existencias es de administración: el cajero no ve el botón
  const canRestock = useAuthStore((s) => s.role === 'ADMIN' || s.role === 'GERENTE');
  const [isDailySuppliersOpen, setIsDailySuppliersOpen] = useState(false);
  const [isQuickSupplierPaymentOpen, setIsQuickSupplierPaymentOpen] = useState(false);
  const {
    isOnline,
    isSyncing,
    syncQueueCount,
    cartItems,
    suspendedCarts,
    getTotal,
    getSubtotal,
    searchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
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
    amountPaidInputRef,
    confirmButtonRef,
    handleTouchAdd,
    handleAddGeneric,
    handleCheckout,
    handleSuspendCart,
    handleKeypadPress,
    discount,
    setDiscount,
    discountPercent,
    setDiscountPercent,
    getDiscountAmount,
    updatePrice,
    canEditPrice,
    lastTouchedId,
    frequentProducts,
    lastSale,
    setLastSale,
    cartItemsCount,
    canCheckout,
    handleResumeCart,
    handleDeleteSuspended,
    handleClearCart,
    updateQuantity,
    removeFromCart,
    filteredCatalog,
    handleSearchSubmit,
    handleSearchQueryChange,
  } = usePOS();

  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [lastSaleTicket, setLastSaleTicket] = useState<Sale | null>(null);

  // Abre el recibo de la última venta para revisarlo o reimprimirlo
  const openLastSaleTicket = useCallback(async () => {
    if (!lastSale?.id) return;
    try {
      const response = await api.get<Sale>(`/sales/${lastSale.id}`);
      setLastSaleTicket(response.data);
    } catch (error) {
      toast.error(parseAxiosError(error, 'No se pudo cargar el ticket.'));
    }
  }, [lastSale]);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Cada cobro arranca en efectivo: un método elegido en el cobro anterior no debe quedarse puesto
  const openCheckout = useCallback(() => {
    setPaymentMethod('EFECTIVO');
    setAmountPaid(getTotal());
    setIsCheckoutDrawerOpen(true);
  }, [setPaymentMethod, setAmountPaid, getTotal]);

  const focusSearchInput = useCallback(() => {
    mobileSearchInputRef.current?.focus();
    mobileSearchInputRef.current?.select();
  }, []);

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
          openCheckout();
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
  }, [isCheckoutDrawerOpen, cartItems.length, canCheckout, isSubmitting, handleCheckout, focusSearchInput, openCheckout]);

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
        // Actúan sobre el renglón resaltado en el ticket (el último agregado o cambiado)
        const lastItem = cartItems.find((item) => item.id === lastTouchedId) ?? cartItems[cartItems.length - 1];
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
  }, [isCheckoutDrawerOpen, cartItems, lastTouchedId, updateQuantity, removeFromCart, focusSearchInput]);

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
        <div className="flex items-center gap-1.5">

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

          <PosMoreMenu
            onPaySupplier={() => setIsQuickSupplierPaymentOpen(true)}
            onOpenDailySuppliers={() => setIsDailySuppliersOpen(true)}
            onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
          />
        </div>
      </div>

      {lastSale && (
        <LastSaleBar
          lastSale={lastSale}
          onViewTicket={openLastSaleTicket}
          onDismiss={() => setLastSale(null)}
        />
      )}

      {/* VISTA DE VENTA: BUSCADOR + TICKET EN LISTA (WEB Y MÓVIL) */}
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
          <ExpressScannerMobileView
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            onSearchSubmit={handleSearchSubmit}
            searchInputRef={mobileSearchInputRef}
            onQuickRestock={canRestock ? () => setIsQuickRestockOpen(true) : undefined}
            onOpenFavorites={() => setIsFavoritesOpen(true)}
            onToggleFavorite={toggleFavorite}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={categories}
            cartItems={cartItems}
            cartItemsCount={cartItemsCount}
            getTotal={getTotal}
            getSubtotal={getSubtotal}
            getDiscountAmount={getDiscountAmount}
            discount={discount}
            setDiscount={setDiscount}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            updateQuantity={updateQuantity}
            updatePrice={updatePrice}
            canEditPrice={canEditPrice}
            removeFromCart={removeFromCart}
            onClearCart={handleClearCart}
            onProceedToPayment={openCheckout}
            onSuspend={() => setIsSuspendModalOpen(true)}
            filteredCatalog={filteredCatalog}
            frequentProducts={frequentProducts}
            onAddProduct={handleTouchAdd}
            lastTouchedId={lastTouchedId}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        </div>

      {/* DIÁLOGOS Y MODALES AUXILIARES */}

      {/* RECIBO DE LA ÚLTIMA VENTA (REVISAR / REIMPRIMIR) */}
      <TicketDetailsDialog
        open={!!lastSaleTicket}
        onOpenChange={(open) => !open && setLastSaleTicket(null)}
        selectedSale={lastSaleTicket}
        onPrint={() => window.print()}
      />

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
        <div data-pos-modal="" className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
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

      {/* AGREGADO RÁPIDO: SURTIR LO QUE LLEGÓ DEL PROVEEDOR */}
      <QuickRestockDialog open={isQuickRestockOpen} onOpenChange={setIsQuickRestockOpen} />

      {/* FAVORITOS: CONSULTA DE EXISTENCIA Y VENTAS */}
      <FavoritesDialog open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen} />

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
