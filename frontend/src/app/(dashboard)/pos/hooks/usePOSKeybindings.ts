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

  /**
   * Detector global del lector de códigos de barras (USB / Bluetooth). El lector "teclea" el código muy rápido
   * (menos de 50 ms entre teclas, algo imposible a mano) y termina con Enter. Se reconoce esa ráfaga esté
   * donde esté el foco:
   * - Sin foco o en un botón: se agrega el producto y el Enter se cancela (antes volvía a "picar" el botón).
   * - En otro campo (cantidad, descuento, precio): el campo regresa a lo que tenía y se agrega el producto.
   * - En el buscador con texto ("coca" + escaneo): la búsqueda se conserva y se agrega lo escaneado.
   *   Si el buscador estaba vacío, el propio buscador ya agregó el producto al completarse el código.
   * Se escucha en captura para cancelar el Enter antes de que llegue al botón o campo enfocado.
   */
  useEffect(() => {
    const MAX_GAP_MS = 50;
    const MIN_CODE_LENGTH = 3;

    let buffer = '';
    let lastKeyTime = 0;
    let burstTarget: EventTarget | null = null;
    let valueBeforeBurst: string | null = null;

    const isTextField = (el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement =>
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(el.type));

    /** Cambia el valor de un campo controlado por React como si se hubiera escrito */
    const restoreFieldValue = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
      const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const handleScannerKeyDown = (e: KeyboardEvent) => {
      // Con un diálogo abierto (cobro, "Llegó mercancía", vincular código...) la lectura es para ese diálogo
      if (document.querySelector('[role="dialog"], [data-pos-modal], [data-quick-restock]')) {
        buffer = '';
        return;
      }

      const now = performance.now();
      if (now - lastKeyTime > MAX_GAP_MS) {
        // Posible inicio de ráfaga: se guarda lo que tenía el campo antes de la primera tecla
        buffer = '';
        burstTarget = e.target;
        valueBeforeBurst = isTextField(e.target) ? e.target.value : null;
      }
      lastKeyTime = now;

      if (e.key !== 'Enter') {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) buffer += e.key;
        else if (e.key !== 'Shift') buffer = '';
        return;
      }

      const code = buffer.trim();
      buffer = '';
      if (code.length < MIN_CODE_LENGTH || e.target !== burstTarget) return;

      // Es el lector: este Enter no debe activar el botón ni el campo enfocado
      e.preventDefault();
      e.stopPropagation();

      const target = e.target;
      if (isTextField(target)) {
        const isSearch = target instanceof HTMLInputElement && target.dataset.posSearch !== undefined;
        // El buscador vacío ya agregó el producto al completarse el código (y se limpió)
        if (isSearch && !target.value.includes(code)) return;
        restoreFieldValue(target, valueBeforeBurst ?? '');
      }
      handleBarcodeScanned(code);
    };

    window.addEventListener('keydown', handleScannerKeyDown, true);
    return () => window.removeEventListener('keydown', handleScannerKeyDown, true);
  }, [handleBarcodeScanned]);
}
