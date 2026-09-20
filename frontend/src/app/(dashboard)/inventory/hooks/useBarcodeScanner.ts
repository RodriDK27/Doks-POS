import { useEffect, useRef } from 'react';

/** Un lector escribe cada carácter en pocos milisegundos; una persona tarda bastante más. */
const MAX_GAP_MS = 60;
const MIN_LENGTH = 4;
const BARCODE_PATTERN = /^[\w./-]+$/;

/** Los campos con este atributo también reciben lecturas (p. ej. el buscador del catálogo). */
export const BARCODE_INPUT_ATTR = 'data-barcode-input';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}

/**
 * Lector de código de barras "de teclado" (USB / Bluetooth): detecta ráfagas rápidas de caracteres
 * terminadas en Enter y llama a `onScan(código)` sin importar dónde esté el foco.
 *
 * - Se ignora mientras se escribe en cualquier otro campo (cantidad, precio...) o hay un diálogo abierto.
 * - Al detectar una lectura se cancela el Enter, para que no active un botón que tenga el foco.
 */
export function useBarcodeScanner(onScan: (code: string) => void) {
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let buffer = '';
    let lastKeyAt = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      const allowedInput = target instanceof HTMLElement && target.hasAttribute(BARCODE_INPUT_ATTR);
      if ((isEditable(target) && !allowedInput) || document.querySelector('[role="dialog"]')) {
        buffer = '';
        return;
      }

      if (event.key === 'Enter') {
        const code = buffer;
        buffer = '';
        if (code.length >= MIN_LENGTH && BARCODE_PATTERN.test(code)) {
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      // Shift, Tab, flechas, etc. no forman parte del código
      if (event.key.length !== 1) return;

      const now = Date.now();
      buffer = now - lastKeyAt > MAX_GAP_MS ? event.key : buffer + event.key;
      lastKeyAt = now;
    };

    // Captura: se procesa antes que los manejadores de botones y campos
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}
