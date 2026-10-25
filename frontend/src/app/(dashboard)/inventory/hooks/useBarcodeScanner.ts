import { useEffect, useRef } from 'react';

/** Un lector escribe cada carácter en pocos milisegundos; una persona tarda bastante más. */
const MAX_GAP_MS = 50;
const MIN_LENGTH = 3;
const BARCODE_PATTERN = /^[\w./-]+$/;
const BARCODE_CELL_SELECTOR = '[data-cell$=":barcode"]';

function isTextField(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(target.type))
  );
}

/** Cambia el valor de un campo controlado por React como si se hubiera escrito */
function restoreFieldValue(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Lector de código de barras "de teclado" (USB / Bluetooth): detecta ráfagas rápidas de caracteres
 * terminadas en Enter y llama a `onScan(código)` sin importar dónde esté el foco.
 *
 * - Si el foco estaba en un campo (una celda, el buscador...), el campo regresa a lo que tenía antes de la
 *   lectura: el código no se queda escrito donde no va.
 * - Al detectar una lectura se cancela el Enter, para que no active un botón ni mueva de celda.
 * - Con un diálogo abierto no se escucha: la lectura es para ese diálogo.
 * - Con el foco en una celda de código de barras tampoco: el código se queda escrito en la celda.
 */
export function useBarcodeScanner(onScan: (code: string) => void) {
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let buffer = '';
    let lastKeyAt = 0;
    let burstTarget: EventTarget | null = null;
    let valueBeforeBurst: string | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) {
        buffer = '';
        return;
      }

      const now = performance.now();
      if (now - lastKeyAt > MAX_GAP_MS) {
        // Posible inicio de lectura: se guarda lo que tenía el campo antes de la primera tecla
        buffer = '';
        burstTarget = event.target;
        valueBeforeBurst = isTextField(event.target) ? event.target.value : null;
      }
      lastKeyAt = now;

      if (event.key !== 'Enter') {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) buffer += event.key;
        // Shift no forma parte del código pero tampoco lo interrumpe (letras mayúsculas)
        else if (event.key !== 'Shift') buffer = '';
        return;
      }

      const code = buffer.trim();
      buffer = '';
      if (code.length < MIN_LENGTH || !BARCODE_PATTERN.test(code) || event.target !== burstTarget) return;
      // En la celda de código de barras la lectura es para esa celda (p. ej. al dar de alta un producto)
      if (event.target instanceof HTMLElement && event.target.matches(BARCODE_CELL_SELECTOR)) return;

      event.preventDefault();
      event.stopPropagation();
      if (isTextField(event.target)) restoreFieldValue(event.target, valueBeforeBurst ?? '');
      onScanRef.current(code);
    };

    // Captura: se procesa antes que los manejadores de botones y campos
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}
