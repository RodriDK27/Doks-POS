'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Volume2, VolumeX, AlertTriangle, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras',
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-viewport';

  // Sonido Beep usando Web Audio API
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
      // Ignorar errores de audio context
    }
  }, [soundEnabled]);

  // Detener el escáner
  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.error('Error al detener escáner:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Iniciar el escáner con la cámara seleccionada o por defecto preferida (facingMode: environment)
  const startScanner = useCallback(async (cameraIdOrConfig: string | { facingMode: string }) => {
    setErrorMsg(null);
    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.floor(viewfinderWidth * 0.85);
          const height = Math.floor(Math.min(viewfinderHeight * 0.5, 180));
          return { width, height };
        },
        aspectRatio: 1.333333,
      };

      const onScanSuccess = (decodedText: string) => {
        playBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(100);
        }
        onScan(decodedText);
        stopScanner();
        onClose();
      };

      await html5Qrcode.start(
        cameraIdOrConfig,
        config,
        onScanSuccess,
        () => {
          // Frame sin código detectado
        }
      );

      setIsScanning(true);

      // Comprobar soporte de linterna/torch
      try {
        const capabilities = html5Qrcode.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        setHasTorch(!!capabilities?.torch);
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.error('Error iniciando escáner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setErrorMsg('Permiso de cámara denegado. Permite el acceso a la cámara en tu navegador.');
      } else if (msg.includes('NotFoundError') || msg.includes('Devices')) {
        setErrorMsg('No se encontró ninguna cámara disponible.');
      } else {
        setErrorMsg('No se pudo acceder a la cámara. Asegúrate de estar en HTTPS o localhost.');
      }
      setIsScanning(false);
    }
  }, [stopScanner, playBeep, onScan, onClose]);

  // Cargar cámaras disponibles al abrir modal
  useEffect(() => {
    if (!isOpen) {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().then(() => {
          html5QrcodeRef.current?.clear();
        }).catch(() => {});
      }
      return;
    }

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          const formatted = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Cámara ${index + 1}`,
          }));
          setCameras(formatted);
          // Preferir cámara trasera si existe en la lista
          const backCam = formatted.find(
            (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('rear')
          );
          const initialCamId = backCam ? backCam.id : formatted[formatted.length - 1].id;
          setSelectedCameraId(initialCamId);
          startScanner(initialCamId);
        } else {
          // Intentar lanzar con facingMode si getCameras no devuelve lista detallada
          startScanner({ facingMode: 'environment' });
        }
      })
      .catch(() => {
        if (isMounted) {
          startScanner({ facingMode: 'environment' });
        }
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  // Cambiar cámara manualmente
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) {
      // Si no tenemos lista explícita, alternar facingMode
      const nextFacing = selectedCameraId === 'user' ? 'environment' : 'user';
      setSelectedCameraId(nextFacing);
      startScanner({ facingMode: nextFacing });
      return;
    }

    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    startScanner(nextCam.id);
  };

  // Alternar Linterna
  const toggleTorch = async () => {
    if (!html5QrcodeRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await html5QrcodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSet & { torch: boolean }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.error('Error al cambiar linterna:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">Apunta la cámara hacia el código de barras</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Visor de Cámara */}
        <div className="relative bg-black flex items-center justify-center min-h-[280px] sm:min-h-[340px] overflow-hidden">
          <div id={scannerContainerId} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

          {/* Guía visual del lector */}
          {isScanning && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[82%] h-[160px] border-2 border-indigo-500/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Esquinas destacadas */}
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                {/* Línea de escaneo animada */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#f43f5e]" />
              </div>
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20 mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-200 mb-4 max-w-xs">{errorMsg}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startScanner({ facingMode: 'environment' })}
                className="border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700 font-bold text-xs"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>

        {/* Footer Controles */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 ${
                soundEnabled ? 'text-slate-300 bg-slate-800/80' : 'text-slate-500 bg-slate-800/30'
              }`}
              title="Sonido al detectar código"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
            </Button>

            {hasTorch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleTorch}
                className={`h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 ${
                  torchOn ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30' : 'text-slate-300 bg-slate-800/80'
                }`}
                title="Alternar linterna"
              >
                <Flashlight className="h-4 w-4" />
                <span className="hidden sm:inline">{torchOn ? 'Linterna ON' : 'Linterna OFF'}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwitchCamera}
                className="h-9 px-3 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                title="Cambiar Cámara"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Cambiar Cámara</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="h-9 px-3 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
