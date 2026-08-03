'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Plus, Trash2, Truck, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, Supplier } from '../types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '@/lib/api';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';

import { MobileCameraViewport } from './mobile/MobileCameraViewport';
import { AuditTab } from './mobile/AuditTab';
import { EditTab } from './mobile/EditTab';
import { WasteTab } from './mobile/WasteTab';
import { SupplierTab } from './mobile/SupplierTab';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface MobileInventoryScannerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories: string[];
  suppliers: Supplier[];
  onRefresh: () => void;
  initialTab?: 'AUDIT' | 'EDIT' | 'WASTE' | 'SUPPLIER';
}

export function MobileInventoryScannerView({
  open,
  onOpenChange,
  products,
  categories,
  suppliers,
  onRefresh,
  initialTab = 'AUDIT',
}: MobileInventoryScannerViewProps) {
  const [mobileTab, setMobileTab] = useState<'AUDIT' | 'EDIT' | 'WASTE' | 'SUPPLIER'>(initialTab);

  useEffect(() => {
    if (open && initialTab && initialTab !== 'AUDIT') {
      Promise.resolve().then(() => {
        setMobileTab(initialTab);
      });
    }
  }, [open, initialTab]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [auditStock, setAuditStock] = useState<number>(0);
  const [prodForm, setProdForm] = useState<{
    name: string;
    barcode: string;
    sellPrice: string;
    purchasePrice: string;
    stock: string;
    minStock: string;
    category: string;
    unitType: 'PIECE' | 'WEIGHT';
  }>({
    name: '',
    barcode: '',
    sellPrice: '',
    purchasePrice: '',
    stock: '',
    minStock: '1',
    category: '',
    unitType: 'PIECE',
  });

  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState<string>('CADUCADO');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [receivedItems, setReceivedItems] = useState<Array<{ product: Product; quantity: number; costPrice: number }>>([]);
  const [pendingRequestedId, setPendingRequestedId] = useState<string | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const viewportId = 'inventory-mobile-inline-viewport';

  const handleClearSelection = useCallback(() => {
    setSelectedProduct(null);
    setScannedBarcode('');
    setSearchQuery('');
    setAuditStock(0);
    setProdForm({
      name: '',
      barcode: '',
      sellPrice: '',
      purchasePrice: '',
      stock: '',
      minStock: '1',
      category: '',
      unitType: 'PIECE',
    });
  }, []);

  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => {
        handleClearSelection();
      });
    }
  }, [open, handleClearSelection]);

  useEffect(() => {
    const handleOpenMobileAddFromRequested = (e: Event) => {
      const customEv = e as CustomEvent<{ id: string; name: string; sellPrice?: number }>;
      if (customEv.detail) {
        const detail = customEv.detail;
        if (detail.id && !detail.id.startsWith('quick-')) {
          setPendingRequestedId(detail.id);
        } else {
          setPendingRequestedId(null);
        }
        setSelectedProduct(null);
        setAuditStock(1);
        setProdForm({
          name: detail.name,
          barcode: '',
          sellPrice: detail.sellPrice ? String(detail.sellPrice) : '',
          purchasePrice: '',
          stock: '1',
          minStock: '1',
          category: 'VARIOS',
          unitType: 'PIECE',
        });
        setMobileTab('EDIT');
        onOpenChange(true);
      }
    };

    const handleOpenMobileEditProduct = (e: Event) => {
      const customEv = e as CustomEvent<{ product: Product; isDuplicate?: boolean }>;
      if (customEv.detail && customEv.detail.product) {
        const { product, isDuplicate } = customEv.detail;
        if (isDuplicate) {
          setSelectedProduct(null);
          setProdForm({
            name: `${product.name} (Copia)`,
            barcode: '',
            sellPrice: String(product.sellPrice),
            purchasePrice: String(product.purchasePrice),
            stock: String(product.stock),
            minStock: String(product.minStock || 1),
            category: product.category || '',
            unitType: (product.unitType as 'PIECE' | 'WEIGHT') || 'PIECE',
          });
        } else {
          setSelectedProduct(product);
          setProdForm({
            name: product.name,
            barcode: product.barcode || '',
            sellPrice: String(product.sellPrice),
            purchasePrice: String(product.purchasePrice),
            stock: String(product.stock),
            minStock: String(product.minStock || 1),
            category: product.category || '',
            unitType: (product.unitType as 'PIECE' | 'WEIGHT') || 'PIECE',
          });
        }
        setMobileTab('EDIT');
        onOpenChange(true);
      }
    };

    window.addEventListener('open-add-product-from-requested', handleOpenMobileAddFromRequested);
    window.addEventListener('open-mobile-edit-product', handleOpenMobileEditProduct);
    return () => {
      window.removeEventListener('open-add-product-from-requested', handleOpenMobileAddFromRequested);
      window.removeEventListener('open-mobile-edit-product', handleOpenMobileEditProduct);
    };
  }, [onOpenChange]);

  const playBeep = useCallback(() => {
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
    } catch { }
  }, []);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const code = barcode.trim();
    if (!code) return;

    setScannedBarcode(code);

    // Si estamos expresamente en la pestaña EDIT y ya tenemos un producto seleccionado para Editar o Duplicar,
    // simplemente asignamos el nuevo código de barras al producto que se está editando sin reemplazar los datos.
    if (mobileTab === 'EDIT' && selectedProduct) {
      setProdForm((prev) => ({
        ...prev,
        barcode: code,
      }));
      toast.success(`Código asignado a "${selectedProduct.name}": ${code}`);
      return;
    }

    const found = products.find((p) => p.barcode === code || p.id === code);

    if (found) {
      setSelectedProduct(found);
      setAuditStock(found.stock);
      setProdForm({
        name: found.name,
        barcode: found.barcode || code,
        sellPrice: String(found.sellPrice),
        purchasePrice: String(found.purchasePrice),
        stock: String(found.stock),
        minStock: String(found.minStock || 1),
        category: found.category || '',
        unitType: (found.unitType as 'PIECE' | 'WEIGHT') || 'PIECE',
      });

      if (mobileTab === 'SUPPLIER') {
        setReceivedItems((prev) => {
          const idx = prev.findIndex((item) => item.product.id === found.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx].quantity += 1;
            return updated;
          }
          return [...prev, { product: found, quantity: 1, costPrice: found.purchasePrice }];
        });
        toast.success(`+1 ${found.name} a recepción`);
      } else {
        toast.success(`Producto encontrado: "${found.name}"`);
      }
    } else {
      setSelectedProduct(null);
      setAuditStock(0);
      setProdForm((prev) => ({
        ...prev,
        barcode: code,
        stock: prev.stock || '1',
        minStock: prev.minStock || '1',
        unitType: prev.unitType || 'PIECE',
      }));
      toast.info(`Código asignado: ${code}`);
    }
  }, [products, mobileTab, selectedProduct]);

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
          aspectRatio: 1.7777778,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.floor(viewfinderWidth * 0.85);
            const height = Math.floor(Math.min(viewfinderHeight * 0.75, 120));
            return { width, height };
          },
        },
        (decodedText) => {
          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.time < 1500
          ) {
            return;
          }
          lastScannedRef.current = { code: decodedText, time: now };
          playBeep();
          handleBarcodeScanned(decodedText);
        },
        () => { }
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error('Error al iniciar cámara de inventario:', err);
      setCameraError('Toca para encender cámara.');
      setIsCameraActive(false);
    }
  }, [handleBarcodeScanned, playBeep]);

  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch {
        // Ignorar excepciones silenciosamente durante la limpieza de la cámara
      } finally {
        html5QrcodeRef.current = null;
      }
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => {
        void stopCamera();
      });
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void startCamera();
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      void stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleSaveAuditStock = async () => {
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await api.patch(`/products/${selectedProduct.id}`, { stock: auditStock });
      toast.success(`Stock de "${selectedProduct.name}" actualizado a ${auditStock}.`);
      onRefresh();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar stock.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.sellPrice) {
      toast.error('Nombre y precio de venta son obligatorios.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: prodForm.name.trim(),
        barcode: prodForm.barcode.trim() || null,
        sellPrice: parseFloat(prodForm.sellPrice) || 0,
        purchasePrice: parseFloat(prodForm.purchasePrice) || 0,
        stock: parseFloat(prodForm.stock) || 0,
        minStock: parseFloat(prodForm.minStock) || 1,
        category: prodForm.category.trim() || null,
        unitType: prodForm.unitType || 'PIECE',
      };

      if (selectedProduct) {
        await api.patch(`/products/${selectedProduct.id}`, payload);
        toast.success(`Producto "${prodForm.name}" actualizado.`);
      } else {
        await api.post('/products', payload);
        toast.success(`Nuevo producto "${prodForm.name}" creado en inventario.`);

        // Si provenía de una solicitud pendiente existente, actualizar el estado a COMPRADO
        if (pendingRequestedId && !pendingRequestedId.startsWith('quick-')) {
          try {
            await api.put(`/requested-products/${pendingRequestedId}`, { status: 'COMPRADO' });
            mutate('/requested-products');
          } catch {
            // Ignorar en silencio si el registro no existía en base de datos
          } finally {
            setPendingRequestedId(null);
          }
        }
      }

      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar producto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWaste = async () => {
    if (!selectedProduct || wasteQty <= 0) return;
    try {
      setIsSubmitting(true);
      await api.post('/products/waste', {
        productId: selectedProduct.id,
        quantity: wasteQty,
        reason: wasteReason,
        notes: 'Merma registrada desde escáner móvil',
      });
      toast.success(`Merma de ${wasteQty} unidad(es) registrada.`);
      setWasteQty(1);
      onRefresh();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al registrar merma.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSupplierReceipt = async () => {
    if (!selectedSupplierId) {
      toast.error('Selecciona un proveedor.');
      return;
    }
    if (receivedItems.length === 0) {
      toast.error('Escanea al menos un producto recibido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/purchases', {
        supplierId: selectedSupplierId,
        items: receivedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
        notes: 'Recepción express desde escáner móvil',
        payFromRegister: true,
      });

      toast.success('Entrada de mercancía registrada correctamente.');
      setReceivedItems([]);
      onRefresh();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar recepción.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSearch = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery)))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] h-[92vh] max-h-[92vh] flex flex-col p-3.5 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl gap-2.5">

        {/* HEADER MÓVIL EN DIALOG */}
        <DialogHeader className="shrink-0 pb-1.5">
          <DialogTitle className="font-black text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
            Escáner Móvil de Inventario
          </DialogTitle>
          <DialogDescription className="sr-only">
            Herramientas rápidas para auditar, editar y gestionar mermas o mercancía de inventario desde celular.
          </DialogDescription>
        </DialogHeader>

        {/* CÁMARA EN VIVO */}
        <MobileCameraViewport
          viewportId={viewportId}
          isCameraActive={isCameraActive}
          cameraError={cameraError}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
        />

        {/* TABS NAVEGACIÓN */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            type="button"
            className={`py-1.5 px-1 rounded-lg text-[9.5px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${mobileTab === 'AUDIT' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            onClick={() => setMobileTab('AUDIT')}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Conteo</span>
          </button>

          <button
            type="button"
            className={`py-1.5 px-1 rounded-lg text-[9.5px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${mobileTab === 'EDIT' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            onClick={() => setMobileTab('EDIT')}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Alta/Editar</span>
          </button>

          <button
            type="button"
            className={`py-1.5 px-1 rounded-lg text-[9.5px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${mobileTab === 'WASTE' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-2xs' : 'text-slate-500'
              }`}
            onClick={() => setMobileTab('WASTE')}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Mermas</span>
          </button>

          <button
            type="button"
            className={`py-1.5 px-1 rounded-lg text-[9.5px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${mobileTab === 'SUPPLIER' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            onClick={() => setMobileTab('SUPPLIER')}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Recepción</span>
          </button>
        </div>

        {/* BÚSQUEDA MANUAL */}
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="O busca producto por nombre..."
            className="pl-7 pr-6 h-8 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {filteredSearch.length > 0 && (
            <div className="absolute left-0 right-0 top-9 z-30 max-h-36 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSearch.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    handleBarcodeScanned(prod.barcode || prod.id);
                    setSearchQuery('');
                  }}
                  className="p-1.5 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs block text-slate-800 dark:text-slate-100">{prod.name}</span>
                    <span className="text-[9px] text-slate-400 block">${prod.sellPrice} | Stock: {prod.stock}</span>
                  </div>
                  <Plus className="h-4 w-4 text-indigo-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONTENIDO DINÁMICO REFACTORIZADO EN SUB-COMPONENTES */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800 space-y-2">
          {mobileTab === 'AUDIT' && (
            <AuditTab
              selectedProduct={selectedProduct}
              auditStock={auditStock}
              setAuditStock={setAuditStock}
              isSubmitting={isSubmitting}
              onSaveAuditStock={handleSaveAuditStock}
            />
          )}

          {mobileTab === 'EDIT' && (
            <EditTab
              selectedProduct={selectedProduct}
              prodForm={prodForm}
              setProdForm={setProdForm}
              isSubmitting={isSubmitting}
              onSaveProductForm={handleSaveProductForm}
              categories={categories}
            />
          )}

          {mobileTab === 'WASTE' && (
            <WasteTab
              selectedProduct={selectedProduct}
              wasteQty={wasteQty}
              setWasteQty={setWasteQty}
              wasteReason={wasteReason}
              setWasteReason={setWasteReason}
              isSubmitting={isSubmitting}
              onSaveWaste={handleSaveWaste}
            />
          )}

          {mobileTab === 'SUPPLIER' && (
            <SupplierTab
              suppliers={suppliers}
              selectedSupplierId={selectedSupplierId}
              setSelectedSupplierId={setSelectedSupplierId}
              receivedItems={receivedItems}
              isSubmitting={isSubmitting}
              onConfirmSupplierReceipt={handleConfirmSupplierReceipt}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
