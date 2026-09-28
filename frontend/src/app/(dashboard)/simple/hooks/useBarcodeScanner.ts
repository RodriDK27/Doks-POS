import { useEffect, useRef } from 'react';

/**
 * Detecta lectores de código de barras USB/Bluetooth (se comportan como un teclado muy rápido).
 * Las teclas escritas con más de 60ms de separación se descartan, así un toque accidental
 * del teclado no se confunde con un escaneo.
 */
export function useBarcodeScanner(onScan: (code: string) => void, enabled: boolean) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 60) buffer = '';
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          onScanRef.current(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    // Fase de captura + preventDefault: el Enter del lector no debe "presionar" el botón que tenga el foco
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
}
