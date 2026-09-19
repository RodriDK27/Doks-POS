'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Search,
  Mic,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  RefreshCw,
  Package,
  X,
  Pause,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CartItem } from '@/store/useCartStore';
import { Product } from '../types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ExpressScannerMobileViewProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onBarcodeScanned: (barcode: string) => void;
  onToggleVoice: () => void;
  isListening: boolean;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  cartItems: CartItem[];
  cartItemsCount: number;
  getTotal: () => number;
  discount: number;
  setDiscount: (discount: number) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  onSuspend: () => void;
  filteredCatalog: Product[];
  onAddProduct: (product: Product) => void;
}

export function ExpressScannerMobileView({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchInputRef,
  onBarcodeScanned,
  onToggleVoice,
  isListening,
  cartItems,
  cartItemsCount,
  getTotal,
  discount,
  setDiscount,
  updateQuantity,
  removeFromCart,
  onProceedToPayment,
  onSuspend,
  filteredCatalog,
  onAddProduct,
}: ExpressScannerMobileViewProps) {
  const currentTotal = getTotal();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setSelectedSearchIndex(0);
  }

  // Listener directo para F2 en la vista móvil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const viewportId = 'express-inline-viewport';

  // Sonido Beep táctil
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignorar errores de Web Audio API
    }
  }, [soundEnabled]);

  // Iniciar la cámara integrada sin modales
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      const html5Qrcode = new Html5Qrcode(viewportId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          const now = Date.now();
          if (
            !lastScannedRef.current ||
            lastScannedRef.current.code !== decodedText ||
            now - lastScannedRef.current.time > 1500
          ) {
            lastScannedRef.current = { code: decodedText, time: now };
            playBeep();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(80);
            }
            onBarcodeScanned(decodedText);
          }
        },
        () => {
          // Frame sin código
        }
      );

      setIsCameraActive(true);

      const track = html5Qrcode.getRunningTrackCameraCapabilities();
      if (track) {
        try {
          const videoElement = document.querySelector(`#${viewportId} video`) as HTMLVideoElement | null;
          if (videoElement && 'BarcodeDetector' in window) {
            const barcodeDetector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (el: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
            });

            const nativeScanInterval = setInterval(async () => {
              if (!html5Qrcode.isScanning) {
                clearInterval(nativeScanInterval);
                return;
              }
              try {
                const barcodes = await barcodeDetector.detect(videoElement);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  const now = Date.now();
                  if (
                    !lastScannedRef.current ||
                    lastScannedRef.current.code !== code ||
                    now - lastScannedRef.current.time > 1500
                  ) {
                    lastScannedRef.current = { code, time: now };
                    playBeep();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(80);
                    }
                    onBarcodeScanned(code);
                  }
                }
              } catch {
                // ignorar errores frame a frame
              }
            }, 100);
          }
        } catch {
          // fallback suave
        }
      }
    } catch (err: unknown) {
      console.error('Error al iniciar cámara en línea:', err);
      setCameraError('Toca aquí para otorgar permiso a la cámara.');
      setIsCameraActive(false);
    }
  }, [onBarcodeScanned, playBeep]);

  // Detener la cámara
  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.error('Error al pausar cámara:', err);
      }
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (showScanner) {
      const timer = setTimeout(() => {
        if (isMounted) startCamera();
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        stopCamera();
      }
    }
  }, [showScanner, startCamera, stopCamera]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-3 gap-2.5">
      {/* BARRA DE BÚSQUEDA TECLADO / VOZ / BOTÓN ESCÁNER PEQUEÑO */}
      <div className="relative shrink-0 flex gap-2 items-center z-30">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar producto por nombre..."
            className="pl-10 pr-12 h-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-sm font-extrabold focus-visible:ring-indigo-500 w-full shadow-xs"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSearchIndex((prev) => Math.min(filteredCatalog.length - 1, prev + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSearchIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.includes('*') || filteredCatalog.length === 0) {
                  onSearchSubmit();
                } else if (filteredCatalog.length > 0 && selectedSearchIndex >= 0 && selectedSearchIndex < filteredCatalog.length) {
                  onAddProduct(filteredCatalog[selectedSearchIndex]);
                  onSearchQueryChange('');
                  setSelectedSearchIndex(0);
                } else {
                  onSearchSubmit();
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onSearchQueryChange('');
              }
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-500/30 rounded font-black pointer-events-none select-none">
              F2
            </span>
          )}
        </div>

        {/* BOTÓN BÚSQUEDA POR VOZ */}
        <Button
          type="button"
          onClick={onToggleVoice}
          className={`h-12 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 border ${isListening
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border-indigo-400/60 dark:border-indigo-500/50 text-slate-800 dark:text-slate-100 shadow-xs'
            }`}
          title="Buscar por Voz"
        >
          <Mic className={`h-4.5 w-4.5 ${isListening ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <span>Voz</span>
        </Button>

        {/* BOTÓN ESCÁNER PEQUEÑO DISCRETO */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowScanner(!showScanner)}
          className={`h-12 w-10 p-0 rounded-xl flex items-center justify-center border transition-all cursor-pointer shrink-0 ${showScanner
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          title={showScanner ? 'Ocultar Escáner' : 'Mostrar Escáner (Cámara)'}
        >
          <Camera className="h-4 w-4" />
        </Button>

        {/* LISTA DESPLEGABLE FLOTANTE DE RESULTADOS DE BÚSQUEDA */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-13 z-50 max-h-96 sm:max-h-[75vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-150">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map((prod, idx) => {
                const isSelected = idx === selectedSearchIndex;
                const isOutOfStock = prod.stock <= 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      onAddProduct(prod);
                      onSearchQueryChange('');
                    }}
                    className={cn(
                      "p-2.5 cursor-pointer flex justify-between items-center rounded-xl transition-all border my-0.5",
                      isOutOfStock
                        ? isSelected
                          ? "border-rose-500 bg-rose-500/15 dark:bg-rose-950/40 ring-2 ring-rose-500 shadow-xs"
                          : "border-rose-500/60 dark:border-rose-500/50 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40"
                        : isSelected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-slate-800 ring-2 ring-indigo-500 shadow-xs"
                          : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "font-extrabold text-xs sm:text-sm block truncate",
                          isOutOfStock ? "text-rose-700 dark:text-rose-300 font-black" : "text-slate-800 dark:text-slate-100"
                        )}>
                          {prod.name}
                        </span>
                        {isOutOfStock && (
                          <span className="text-[9.5px] bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-400 font-black px-1.5 py-0.2 rounded shadow-2xs">
                            Sin Stock
                          </span>
                        )}
                        {isSelected && (
                          <span className={cn(
                            "text-[9.5px] text-white font-black px-1.5 py-0.2 rounded",
                            isOutOfStock ? "bg-rose-600" : "bg-indigo-600"
                          )}>
                            Enter ↵
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold mt-0.5">
                        <span className="text-slate-600 dark:text-slate-400 font-extrabold">
                          ${prod.sellPrice.toFixed(2)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        {isOutOfStock ? (
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                            Stock: 0 (Agotado)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">
                            Stock: {prod.stock}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className={cn(
                        "h-7.5 px-2.5 font-extrabold text-xs rounded-lg shadow-xs shrink-0 cursor-pointer",
                        isOutOfStock
                          ? isSelected
                            ? "bg-rose-600 hover:bg-rose-700 text-white border border-rose-500"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900"
                          : isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {isOutOfStock ? 'Sin Stock' : '+ Añadir'}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                No se encontraron productos con &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CÁMARA EN VIVO OPCIONAL */}
      {showScanner && (
        <div className="relative shrink-0 w-full bg-slate-950 dark:bg-black rounded-2xl overflow-hidden shadow-md border border-slate-900 aspect-video max-h-36 flex items-center justify-center animate-in slide-in-from-top-2 duration-200">
          <div
            id={viewportId}
            className="w-full h-full object-cover overflow-hidden flex items-center justify-center [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:my-auto [&_div]:my-auto [&_#express-inline-viewport__scan_region]:my-auto [&_#express-inline-viewport__scan_region]:mx-auto [&_#express-inline-viewport__scan_region_border]:!border-none [&_#express-inline-viewport__shaded_region]:!hidden"
          />

          {isCameraActive && (
            <>
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-emerald-400 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Escaneando
                </span>
                <Button
                  type="button"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  onClick={stopCamera}
                  title="Pausar cámara"
                >
                  <CameraOff className="h-3 w-3" />
                </Button>
              </div>

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-[85%] h-[60px] border-2 border-red-500/70 rounded-xl overflow-hidden">
                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-red-500 rounded-tl-sm" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-red-500 rounded-tr-sm" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-red-500 rounded-bl-sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-red-500 rounded-br-sm" />
                  <div className="w-full h-1 bg-red-600 absolute left-0 shadow-[0_0_12px_#ef4444] animate-[scan_1.5s_infinite_linear]" />
                </div>
              </div>
            </>
          )}

          {(!isCameraActive || cameraError) && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center z-20">
              <Camera className="h-5 w-5 text-indigo-400 mb-1 animate-pulse" />
              <p className="text-[11px] font-black text-white">{cameraError || 'Cámara en Pausa'}</p>
              <Button
                type="button"
                onClick={startCamera}
                className="h-6 mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-2.5 rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Activar Cámara
              </Button>
            </div>
          )}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL: TICKET EN VIVO CON ESPACIO AMPLIO */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none p-1 md:p-2 space-y-1.5 min-h-0 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-3 md:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all gap-3 md:gap-4"
            >
              {/* Nombre del Producto + Precio Unitario */}
              <div className="min-w-0 flex-1 flex items-baseline gap-2">
                <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm md:text-base truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold shrink-0">
                  (${item.sellPrice.toFixed(2)})
                </span>
              </div>

              {/* Controles de Cantidad */}
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 h-9 md:h-11 select-none overflow-hidden shrink-0">
                <button
                  type="button"
                  className="h-full px-2.5 md:px-3.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
                <span className="h-full px-2.5 md:px-3 font-black text-xs md:text-base flex items-center justify-center text-slate-850 dark:text-slate-100 min-w-[24px]">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="h-full px-2.5 md:px-3.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>

              {/* Total y Botón Eliminar */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-2xl tracking-tight">
                  ${(item.sellPrice * item.quantity).toFixed(2)}
                </span>

                <button
                  type="button"
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-2xl cursor-pointer transition-all active:scale-90 flex items-center justify-center shrink-0 border-none bg-transparent"
                  onClick={() => removeFromCart(item.id)}
                  title="Eliminar del ticket"
                >
                  <Trash2 className="w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 text-rose-500 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-3 text-slate-400 space-y-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-1 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Ticket de venta vacío</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600">Escanea un código o toca un producto para agregarlo:</p>
            </div>

            {filteredCatalog.length > 0 && (
              <div className="w-full space-y-1.5 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Artículos Frecuentes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredCatalog.slice(0, 6).map((prod) => {
                    const isOutOfStock = prod.stock <= 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => onAddProduct(prod)}
                        className={cn(
                          "p-2.5 rounded-xl text-left transition-all active:scale-95 shadow-2xs cursor-pointer flex flex-col justify-between h-20 border",
                          isOutOfStock
                            ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/60 dark:border-rose-500/50 hover:border-rose-600"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-500"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1 w-full">
                          <span className={cn(
                            "font-extrabold text-xs line-clamp-2 leading-snug flex-1",
                            isOutOfStock ? "text-rose-700 dark:text-rose-300 font-black" : "text-slate-800 dark:text-slate-100"
                          )}>
                            {prod.name}
                          </span>
                          {isOutOfStock && (
                            <span className="text-[8.5px] bg-rose-600 text-white font-black px-1 py-0.2 rounded shrink-0">
                              0 stock
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1 w-full">
                          <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                            ${prod.sellPrice.toFixed(2)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-extrabold px-1.5 py-0.5 rounded",
                            isOutOfStock
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                          )}>
                            {isOutOfStock ? 'Reponer' : '+ Añadir'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER TOTAL Y BOTÓN DE COBRO - Opción 1 */}
      <div className="shrink-0 pt-1 space-y-2.5">
        {cartItems.length > 0 && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white dark:bg-slate-950 p-3 md:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
            {/* Input Descuento */}
            <div className="flex-1 space-y-1">
              <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider block">
                Descuento ($)
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                className="w-full h-11 md:h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-black text-right text-sm md:text-base focus-visible:ring-emerald-500"
                value={discount > 0 ? discount : ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Total Ticket Derecha */}
            <div className="text-left md:text-right shrink-0 md:pl-5 md:border-l border-slate-100 dark:border-slate-800/80 pt-2 md:pt-0 border-t md:border-t-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 md:justify-end">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Ticket</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {cartItemsCount} uds
                </span>
              </div>
              {discount > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">
                  Desc. -${discount.toFixed(2)}
                </span>
              )}
              <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none pt-0.5">
                ${currentTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={cartItems.length === 0}
            onClick={onSuspend}
            className="h-11 md:h-12 px-3 border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0"
            title="Suspender Venta"
          >
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pausar</span>
          </Button>

          <Button
            type="button"
            disabled={cartItems.length === 0}
            onClick={onProceedToPayment}
            className="flex-1 h-11 md:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            <span>Cobrar</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-800/90 rounded font-mono font-black text-emerald-100 border border-emerald-400/30">
              F8
            </span>
            <span className="px-2 py-0.5 bg-emerald-700 dark:bg-emerald-900 rounded-lg text-xs font-black">
              ${currentTotal.toFixed(2)}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
