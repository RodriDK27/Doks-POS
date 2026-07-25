'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Search, Mic, ShoppingCart, Trash2, Plus, Minus, ArrowRight, RefreshCw, Package, Check, X, Tag, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
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
  activeCategory,
  onCategoryChange,
  categories,
  cartItems,
  cartItemsCount,
  getTotal,
  discount,
  setDiscount,
  updateQuantity,
  removeFromCart,
  onClearCart,
  onProceedToPayment,
  onSuspend,
  filteredCatalog,
  onAddProduct,
}: ExpressScannerMobileViewProps) {
  const currentTotal = getTotal();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expressTab, setExpressTab] = useState<'TICKET' | 'CATALOG'>('TICKET');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const viewportId = 'express-inline-viewport';
  const effectiveTab = searchQuery.trim().length > 0 ? 'CATALOG' : expressTab;

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
          fps: 25,
          aspectRatio: 1.7777778,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.floor(viewfinderWidth * 0.9);
            const height = Math.floor(Math.min(viewfinderHeight * 0.8, 140));
            return { width, height };
          },
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [
              { focusMode: 'continuous' } as MediaTrackConstraintSet,
              { zoom: 1.2 } as MediaTrackConstraintSet,
            ],
          },
        },
        (decodedText) => {
          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.time < 1200
          ) {
            return;
          }

          lastScannedRef.current = { code: decodedText, time: now };
          playBeep();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(80);
          }
          onBarcodeScanned(decodedText);
        },
        () => {}
      );

      setIsCameraActive(true);

      // Chrome acelerado por hardware BarcodeDetector
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });

          const videoEl = document.querySelector(`#${viewportId} video`) as HTMLVideoElement | null;
          if (videoEl) {
            const detectInterval = setInterval(async () => {
              if (!html5QrcodeRef.current?.isScanning || videoEl.paused || videoEl.ended) {
                clearInterval(detectInterval);
                return;
              }
              try {
                const barcodes = await barcodeDetector.detect(videoEl);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  const code = barcodes[0].rawValue;
                  const now = Date.now();
                  if (
                    !lastScannedRef.current ||
                    lastScannedRef.current.code !== code ||
                    now - lastScannedRef.current.time >= 1200
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
    const timer = setTimeout(() => {
      if (isMounted) startCamera();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleSelectSearchResult = (prod: Product) => {
    onAddProduct(prod);
    onSearchQueryChange('');
    setExpressTab('TICKET');
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-3 gap-2">
      
      {/* CÁMARA EN VIVO INTEGRADA (PERFECTAMENTE CENTRADA) */}
      <div className="relative shrink-0 w-full bg-slate-950 dark:bg-black rounded-2xl overflow-hidden shadow-md border border-slate-900 aspect-video max-h-40 flex items-center justify-center">
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

            {/* Guía visual del lector con línea roja láser */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[85%] h-[80px] border-2 border-red-500/70 rounded-xl overflow-hidden">
                <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-3 border-l-3 border-red-500 rounded-tl-sm shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-3 border-r-3 border-red-500 rounded-tr-sm shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-3 border-l-3 border-red-500 rounded-bl-sm shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-3 border-r-3 border-red-500 rounded-br-sm shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <div className="w-full h-1 bg-red-600 absolute left-0 shadow-[0_0_12px_#ef4444,0_0_24px_#ef4444] animate-[scan_1.5s_infinite_linear]" />
              </div>
            </div>
          </>
        )}

        {(!isCameraActive || cameraError) && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-20">
            <Camera className="h-7 w-7 text-indigo-400 mb-1 animate-pulse" />
            <p className="text-xs font-black text-white">{cameraError || 'Cámara en Pausa'}</p>
            <Button
              type="button"
              onClick={startCamera}
              className="h-7 mt-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-3 rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Activar Cámara
            </Button>
          </div>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA TECLADO / VOZ CON RESULTADOS FLOTANTES */}
      <div className="relative shrink-0 flex gap-1.5 items-center z-30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar producto sin código por nombre..."
            className="pl-8 pr-7 h-9 border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl text-xs font-bold focus-visible:ring-indigo-500 w-full"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit();
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          type="button"
          onClick={onToggleVoice}
          className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs bg-indigo-50 dark:bg-indigo-955/40 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-100/50 dark:border-indigo-900/30 cursor-pointer shrink-0"
          title="Buscar por Voz"
        >
          <Mic className={`h-4 w-4 ${isListening ? 'text-rose-500 animate-pulse' : ''}`} />
        </Button>

        {/* LISTA DESPLEGABLE FLOTANTE DE RESULTADOS DE BÚSQUEDA */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-10 top-10 z-50 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-150">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onAddProduct(prod);
                    onSearchQueryChange('');
                  }}
                  className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center rounded-xl transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block truncate">{prod.name}</span>
                    <span className="text-[9.5px] text-slate-400 font-bold block">${prod.sellPrice.toFixed(2)} | Stock: {prod.stock}</span>
                  </div>
                  <Button type="button" size="sm" className="h-7 px-2.5 bg-indigo-600 text-white font-black text-xs rounded-lg">
                    + Añadir
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 font-bold">
                No se encontraron productos con &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENEDOR PRINCIPAL: TICKET EN VIVO DE ARTÍCULOS REGISTRADOS */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-none p-1 space-y-1 min-h-0 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-2xs gap-2"
            >
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block truncate">
                  {item.name}
                </span>

                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 h-6.5 w-fit mt-1 select-none overflow-hidden">
                  <button
                    type="button"
                    className="h-full px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="h-full px-2 font-black text-xs flex items-center justify-center text-slate-800 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="h-full px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  ${(item.sellPrice * item.quantity).toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <ShoppingCart className="h-7 w-7 text-slate-300 dark:text-slate-700 mb-1 animate-bounce" />
            <p className="text-xs font-bold text-center">Escribe el nombre de un producto o apunta la cámara al código.</p>
          </div>
        )}
      </div>

      {/* FOOTER TOTAL Y BOTÓN DE COBRO */}
      <div className="shrink-0 pt-0.5 space-y-1.5">
        {cartItems.length > 0 && (
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl text-xs gap-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-amber-500" /> Descuento ($)
            </span>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              className="w-28 h-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-right text-xs focus-visible:ring-indigo-500"
              value={discount > 0 ? discount : ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400">Total Ticket</span>
            <span className="text-[9px] bg-slate-800 text-indigo-300 font-black px-2 py-0.5 rounded-md">
              {cartItemsCount} uds
            </span>
          </div>
          <div className="text-right">
            {discount > 0 && (
              <span className="text-[10px] text-amber-400 font-bold block">
                Desc. -${discount.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-black text-emerald-400">${currentTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={cartItems.length === 0}
            onClick={onSuspend}
            className="h-11 px-3.5 border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-955/10 font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0"
            title="Suspender Venta en Espera"
          >
            <Pause className="h-4 w-4" />
            <span>Pausar</span>
          </Button>

          <Button
            type="button"
            disabled={cartItems.length === 0}
            onClick={onProceedToPayment}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Cobrar ${currentTotal.toFixed(2)}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
