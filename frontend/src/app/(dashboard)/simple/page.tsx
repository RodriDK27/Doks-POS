'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Store, Truck, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSimpleModeStore } from '@/store/useSimpleModeStore';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../pos/types';
import { useVoiceSearch } from '../pos/hooks/useVoiceSearch';
import {
  ALL_CATEGORIES,
  SimpleFamily,
  buildFamilies,
  categoryCounts,
  filterFamilies,
  findProductByBarcode,
  formatMoney,
  playBeep,
  roundUpToCents,
} from './helpers';
import { useSimpleSale } from './hooks/useSimpleSale';
import { CatalogToolbar } from './components/CatalogToolbar';
import { useSupplierPayment } from './hooks/useSupplierPayment';
import {
  ReceiptPhotoStep,
  SimpleSupplier,
  SupplierAmountStep,
  SupplierConfirmStep,
  SupplierDoneStep,
  SupplierPaymentDraft,
  SupplierPickStep,
} from './components/SupplierPayment';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { BigKeypad } from './components/SimpleOverlay';
import { FamilyGrid, UnsurePriceStep, VariantPicker } from './components/CatalogGrid';
import { SimpleTicket } from './components/SimpleTicket';
import { ChangeStep, PaymentStep } from './components/Checkout';
import { ScanFlash, ScanFlashState, UndoBar } from './components/Feedback';
import { ExitSimpleModeDialog } from './components/ExitSimpleModeDialog';

/** Un solo paso a la vez: cada uno ocupa toda la pantalla */
type Step =
  | { kind: 'HOME' }
  | { kind: 'VARIANT'; family: SimpleFamily }
  | { kind: 'UNSURE'; family: SimpleFamily }
  | { kind: 'UNSURE_OTHER'; family: SimpleFamily }
  | { kind: 'WEIGHT'; product: Product }
  | { kind: 'GENERIC'; name: string; needsReview: boolean }
  | { kind: 'PAY' }
  | { kind: 'PAY_OTHER' }
  | { kind: 'CHANGE'; amountPaid: number }
  // "Llegó el proveedor": el pago sale de la caja grande
  | { kind: 'SUPPLIER_PICK' }
  | { kind: 'SUPPLIER_AMOUNT'; supplier: SimpleSupplier }
  | { kind: 'SUPPLIER_OTHER_AMOUNT'; supplier: SimpleSupplier }
  | { kind: 'SUPPLIER_PHOTO'; draft: SupplierPaymentDraft }
  | { kind: 'SUPPLIER_CONFIRM'; draft: SupplierPaymentDraft }
  | { kind: 'SUPPLIER_DONE'; draft: SupplierPaymentDraft; photoFailed: boolean };

const HOME: Step = { kind: 'HOME' };

export default function SimpleModePage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const { active, exit } = useSimpleModeStore();
  const sale = useSimpleSale();

  const [step, setStep] = useState<Step>(HOME);
  const [flash, setFlash] = useState<ScanFlashState | null>(null);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supplierPayment = useSupplierPayment(active && sale.isOnline);

  // Todo el modo abuela está en rem: en tabletas grandes (ej. 12" que el navegador reporta de ~1700 px)
  // la letra base crece con el lado más largo de la pantalla (igual en horizontal y vertical),
  // y con ella textos, botones y tarjetas.
  // Mínimo 18 px (lo mismo que ya usa el sistema en tabletas); al salir se restaura.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.fontSize;
    html.style.fontSize = 'clamp(18px, 1.3vmax, 26px)';
    return () => {
      html.style.fontSize = previous;
    };
  }, []);

  // Si alguien llega aquí sin haber activado el modo, regresa al punto de venta normal
  useEffect(() => {
    if (!active) router.replace('/pos');
  }, [active, router]);

  const { data: activeRegister, isLoading: isLoadingRegister } = useSWR(
    role !== 'NONE' && sale.isOnline ? '/register/active' : null
  );
  // Sin internet no se puede saber si la caja sigue abierta: se deja vender y la venta queda en cola
  const isRegisterClosed = role === 'NONE' || (sale.isOnline && !isLoadingRegister && !activeRegister);

  const families = useMemo(() => buildFamilies(sale.products), [sale.products]);

  // Con cientos de productos: pestañas de categoría y búsqueda por voz (sin teclado de letras)
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const { isListening, toggleVoiceSearch } = useVoiceSearch(setSearchQuery);
  const categories = useMemo(() => categoryCounts(families), [families]);
  const visibleFamilies = useMemo(() => filterFamilies(families, category, searchQuery), [families, category, searchQuery]);

  const goHome = useCallback(() => setStep(HOME), []);

  /** Después de agregar algo: de vuelta al catálogo. La búsqueda se borra; la categoría se queda. */
  const backToCatalog = useCallback(() => {
    setStep(HOME);
    setSearchQuery('');
  }, []);

  const pickProduct = useCallback((product: Product) => {
    if (product.unitType === 'WEIGHT') {
      setStep({ kind: 'WEIGHT', product });
      return;
    }
    sale.addPiece(product);
    playBeep('ok');
    backToCatalog();
  }, [sale, backToCatalog]);

  const selectFamily = useCallback((family: SimpleFamily) => {
    if (family.products.length === 1) {
      pickProduct(family.products[0]);
    } else {
      setStep({ kind: 'VARIANT', family });
    }
  }, [pickProduct]);

  const addUnsure = useCallback((family: SimpleFamily, price: number) => {
    sale.addUnsure(family, price);
    playBeep('ok');
    backToCatalog();
  }, [sale, backToCatalog]);

  const handleScan = useCallback((code: string) => {
    const product = findProductByBarcode(sale.products, code);
    if (!product) {
      playBeep('error');
      setFlash({ kind: 'unknown', code });
      return;
    }
    if (product.unitType === 'WEIGHT') {
      playBeep('ok');
      setStep({ kind: 'WEIGHT', product });
      return;
    }
    sale.addPiece(product);
    playBeep('ok');
    backToCatalog();
    setFlash({ kind: 'added', name: product.name, price: product.sellPrice, imageSrc: getProductImageSrc(product.imageUrl) });
  }, [sale, backToCatalog]);

  // El lector solo agrega productos mientras se está armando la venta (no a media cobranza)
  const scannerEnabled =
    !isRegisterClosed && !isExitOpen && flash?.kind !== 'unknown' && (step.kind === 'HOME' || step.kind === 'VARIANT');
  useBarcodeScanner(handleScan, scannerEnabled);

  const closeFlash = useCallback(() => setFlash(null), []);

  const handleConfirmSale = async (amountPaid: number) => {
    setSaveError(null);
    const error = await sale.submitSale(amountPaid);
    if (error) {
      playBeep('error');
      setSaveError(error);
      return;
    }
    playBeep('ok');
    setStep(HOME);
  };

  const handleConfirmSupplierPayment = async (draft: SupplierPaymentDraft) => {
    setSaveError(null);
    const result = await supplierPayment.submitPayment(draft);
    if (result.error) {
      playBeep('error');
      setSaveError(result.error);
      return;
    }
    playBeep('ok');
    setStep({ kind: 'SUPPLIER_DONE', draft, photoFailed: result.photoFailed });
  };

  const handleUnlocked = () => {
    setIsExitOpen(false);
    exit();
    router.replace('/pos');
  };

  if (!active) return null;

  const renderStep = () => {
    switch (step.kind) {
      case 'VARIANT':
        return (
          <VariantPicker
            family={step.family}
            onPick={pickProduct}
            onUnsure={() => setStep({ kind: 'UNSURE', family: step.family })}
            onBack={goHome}
          />
        );
      case 'UNSURE':
        return (
          <UnsurePriceStep
            family={step.family}
            onPickPrice={(price) => addUnsure(step.family, price)}
            onOtherPrice={() => setStep({ kind: 'UNSURE_OTHER', family: step.family })}
            onBack={() => setStep({ kind: 'VARIANT', family: step.family })}
          />
        );
      case 'UNSURE_OTHER':
        return (
          <BigKeypad
            title={`¿Cuánto costó el ${step.family.name}?`}
            hint="Ponga el precio que cobró"
            confirmLabel="Agregar"
            onBack={() => setStep({ kind: 'UNSURE', family: step.family })}
            onConfirm={(price) => addUnsure(step.family, price)}
          />
        );
      case 'WEIGHT':
        return (
          <BigKeypad
            title={`¿Cuánto de ${step.product.name}?`}
            hint={`Ponga cuánto le va a cobrar · ${formatMoney(step.product.sellPrice)} el kilo`}
            confirmLabel="Agregar"
            onBack={goHome}
            onConfirm={(amount) => {
              sale.addWeightByAmount(step.product, amount);
              playBeep('ok');
              backToCatalog();
            }}
          />
        );
      case 'GENERIC':
        return (
          <BigKeypad
            title="¿Cuánto cuesta?"
            hint="Ponga el precio del producto"
            confirmLabel="Agregar"
            onBack={goHome}
            onConfirm={(amount) => {
              sale.addGeneric(step.name, amount, step.needsReview);
              playBeep('ok');
              backToCatalog();
            }}
          />
        );
      case 'PAY':
        return (
          <PaymentStep
            total={sale.total}
            exactAmount={roundUpToCents(sale.total)}
            onBack={goHome}
            onOtherAmount={() => setStep({ kind: 'PAY_OTHER' })}
            onPaid={(amountPaid) => {
              setSaveError(null);
              setStep({ kind: 'CHANGE', amountPaid });
            }}
          />
        );
      case 'PAY_OTHER':
        return (
          <BigKeypad
            title="¿Con cuánto le pagaron?"
            hint={`Son ${formatMoney(sale.total)}`}
            confirmLabel="Siguiente"
            minAmount={roundUpToCents(sale.total)}
            onBack={() => setStep({ kind: 'PAY' })}
            onConfirm={(amountPaid) => {
              setSaveError(null);
              setStep({ kind: 'CHANGE', amountPaid });
            }}
          />
        );
      case 'CHANGE':
        return (
          <ChangeStep
            total={sale.total}
            amountPaid={step.amountPaid}
            isSubmitting={sale.isSubmitting}
            isOnline={sale.isOnline}
            error={saveError}
            onBack={() => setStep({ kind: 'PAY' })}
            onConfirm={() => void handleConfirmSale(step.amountPaid)}
          />
        );
      case 'SUPPLIER_PICK':
        return (
          <SupplierPickStep
            suppliers={supplierPayment.suppliers}
            onPick={(supplier) => setStep({ kind: 'SUPPLIER_AMOUNT', supplier })}
            onBack={goHome}
          />
        );
      case 'SUPPLIER_AMOUNT':
        return (
          <SupplierAmountStep
            supplier={step.supplier}
            onAmount={(amount, ticketId) => setStep({ kind: 'SUPPLIER_PHOTO', draft: { supplier: step.supplier, amount, ticketId } })}
            onOtherAmount={() => setStep({ kind: 'SUPPLIER_OTHER_AMOUNT', supplier: step.supplier })}
            onBack={() => setStep({ kind: 'SUPPLIER_PICK' })}
          />
        );
      case 'SUPPLIER_OTHER_AMOUNT':
        return (
          <BigKeypad
            title={`¿Cuánto le pagó a ${step.supplier.name}?`}
            hint="Sale de la caja grande"
            confirmLabel="Siguiente"
            onBack={() => setStep({ kind: 'SUPPLIER_AMOUNT', supplier: step.supplier })}
            onConfirm={(amount) => setStep({ kind: 'SUPPLIER_PHOTO', draft: { supplier: step.supplier, amount } })}
          />
        );
      case 'SUPPLIER_PHOTO':
        return (
          <ReceiptPhotoStep
            draft={step.draft}
            onContinue={(photo) => {
              setSaveError(null);
              setStep({ kind: 'SUPPLIER_CONFIRM', draft: { ...step.draft, photo } });
            }}
            onBack={() => setStep({ kind: 'SUPPLIER_AMOUNT', supplier: step.draft.supplier })}
          />
        );
      case 'SUPPLIER_CONFIRM':
        return (
          <SupplierConfirmStep
            draft={step.draft}
            isSubmitting={supplierPayment.isSubmitting}
            error={saveError}
            onConfirm={() => void handleConfirmSupplierPayment(step.draft)}
            onBack={() => setStep({ kind: 'SUPPLIER_PHOTO', draft: step.draft })}
          />
        );
      case 'SUPPLIER_DONE':
        return <SupplierDoneStep draft={step.draft} photoFailed={step.photoFailed} onDone={goHome} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Misma barra superior que el resto del sistema (TabletTopNav) */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 px-3 sm:px-5 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Store className="h-5.5 w-5.5" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-800 dark:text-slate-100">Dok&apos;s POS</span>
          <span className="text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 px-2.5 py-1 rounded-full">
            Modo Abuela
          </span>
          {!sale.isOnline && (
            <span className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 text-sm font-bold">
              <WifiOff className="h-4 w-4" /> Sin internet
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
        {/* Mismo estilo que "Pagar Proveedor" del punto de venta. Sin internet no se puede registrar el pago. */}
        <button
          type="button"
          disabled={!sale.isOnline || isRegisterClosed}
          onClick={() => {
            setSaveError(null);
            setStep({ kind: 'SUPPLIER_PICK' });
          }}
          className="h-12 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-lg font-black flex items-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Truck className="h-6 w-6" /> Llegó el proveedor
        </button>
        {/* Discreto a propósito: es para el administrador, no para quien vende */}
        <button
          type="button"
          onClick={() => setIsExitOpen(true)}
          aria-label="Salir de la pantalla sencilla"
          className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <Lock className="h-4.5 w-4.5" />
        </button>
        </div>
      </header>

      {isRegisterClosed ? (
        <div className="flex-1 p-4 flex">
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center">
              <Lock className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">La caja está cerrada</p>
            <p className="text-2xl font-bold text-slate-500">Pida que abran la caja para poder vender.</p>
          </div>
        </div>
      ) : (
        // Mismo acomodo que el punto de venta: catálogo y ticket en paneles separados
        <div className="flex-1 min-h-0 flex portrait:flex-col gap-4 p-4">
          <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
            <CatalogToolbar
              categories={categories}
              totalCount={families.length}
              activeCategory={category}
              onCategoryChange={setCategory}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              isListening={isListening}
              onToggleVoice={() => void toggleVoiceSearch()}
            />
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {sale.isLoadingProducts ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-16 w-16 animate-spin text-slate-400 dark:text-slate-500" />
                </div>
              ) : (
                <>
                  {families.length === 0 && (
                    <p className="mb-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 text-lg font-bold text-slate-500">
                      Todavía no hay productos con foto. Se pueden cobrar con el lector o con &quot;Otro producto&quot;.
                    </p>
                  )}
                  {searchQuery.trim() && visibleFamilies.length === 0 && (
                    <p className="mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 text-lg font-bold text-amber-700 dark:text-amber-400">
                      No encontré &quot;{searchQuery}&quot;. Intente otra vez, toque &quot;Ver todo&quot; o use &quot;Otro producto&quot;.
                    </p>
                  )}
                  <FamilyGrid
                    families={visibleFamilies}
                    onSelectFamily={selectFamily}
                    onOtherProduct={() => setStep({ kind: 'GENERIC', name: 'Otro producto', needsReview: true })}
                  />
                </>
              )}
            </div>
          </main>

          <SimpleTicket
            items={sale.items}
            total={sale.total}
            onIncrement={sale.increment}
            onDecrement={sale.decrement}
            onClearAll={sale.clearAll}
            onCharge={() => setStep({ kind: 'PAY' })}
          />
        </div>
      )}

      {renderStep()}

      {sale.undo && step.kind === 'HOME' && <UndoBar message={sale.undo.message} onUndo={sale.applyUndo} />}

      {flash && (
        <ScanFlash
          flash={flash}
          onClose={closeFlash}
          onChargeUnknown={(code) => {
            setFlash(null);
            setStep({ kind: 'GENERIC', name: `Sin registrar (código ${code})`, needsReview: false });
          }}
        />
      )}

      {isExitOpen && <ExitSimpleModeDialog onClose={() => setIsExitOpen(false)} onUnlocked={handleUnlocked} />}
    </div>
  );
}
