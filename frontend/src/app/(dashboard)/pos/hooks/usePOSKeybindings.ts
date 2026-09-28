import { useEffect } from 'react';
import { toast } from 'sonner';

interface KeyboardShortcutsOptions {
  cartItemsCount: number;
  paymentMethod: string;
  posTab: string;
  amountPaid: number;
  selectedCustomerId: string;
  canCheckout: boolean;
  isGenericOpen: boolean;
  isSuspendModalOpen: boolean;
  isSuspendedOpen: boolean;
  isShortcutsHelpOpen: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  setIsGenericOpen: (open: boolean) => void;
  setIsSuspendModalOpen: (open: boolean) => void;
  setIsSuspendedOpen: (open: boolean) => void;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  setPosTab: (tab: 'CATALOG' | 'CART' | 'PAYMENT') => void;
  handleCheckout: () => void;
  handleBarcodeScanned: (barcode: string) => void;
}

export function usePOSKeybindings({
  cartItemsCount,
  posTab,
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
}: KeyboardShortcutsOptions) {
  // Atajos F2, F4, F8, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 enfocar buscador
      if (e.key === 'F2') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pos-focus-search'));
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4 cobro rápido / artículo libre
      if (e.key === 'F4') {
        e.preventDefault();
        setIsGenericOpen(true);
      }
      // F8 cobro: emitir evento para que la vista gestione abrir modal o confirmar venta
      if (e.key === 'F8') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pos-f8-press'));
      }
      // Esc cerrar modales auxiliares o volver al ticket
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
  }, [
    cartItemsCount,
    posTab,
    canCheckout,
    handleCheckout,
    isGenericOpen,
    isShortcutsHelpOpen,
    isSuspendModalOpen,
    isSuspendedOpen,
    searchInputRef,
    setIsGenericOpen,
    setIsShortcutsHelpOpen,
    setIsSuspendModalOpen,
    setIsSuspendedOpen,
    setPosTab,
  ]);

  // Detector global para escáneres de códigos de barras físicos (USB / Bluetooth)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        // Dentro de cualquier campo (incluido el buscador) no se escucha: el buscador ya maneja el escaneo
        // (agrega el producto al completar el código). Escucharlo aquí también lo agregaba dos veces.
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (isInput) {
          return;
        }
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 60) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleBarcodeScanned(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleBarcodeScanned, searchInputRef]);
}
