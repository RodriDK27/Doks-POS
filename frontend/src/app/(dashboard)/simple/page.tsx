'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Store, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSimpleModeStore } from '@/store/useSimpleModeStore';
import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../pos/types';
import { SimpleFamily, buildFamilies, findProductByBarcode, formatMoney, playBeep, roundUpToCents } from './helpers';
import { useSimpleSale } from './hooks/useSimpleSale';
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
  | { kind: 'CHANGE'; amountPaid: number };

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

  const goHome = useCallback(() => setStep(HOME), []);

  const pickProduct = useCallback((product: Product) => {
    if (product.unitType === 'WEIGHT') {
      setStep({ kind: 'WEIGHT', product });
      return;
    }
    sale.addPiece(product);
    playBeep('ok');
    setStep(HOME);
  }, [sale]);

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
    setStep(HOME);
  }, [sale]);

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
    setStep(HOME);
    setFlash({ kind: 'added', name: product.name, price: product.sellPrice, imageSrc: getProductImageSrc(product.imageUrl) });
  }, [sale]);

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
              setStep(HOME);
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
              setStep(HOME);
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
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-100 text-stone-900 select-none">
      <header className="flex items-center justify-between gap-4 px-5 py-3 bg-white border-b-2 border-stone-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Store className="h-9 w-9 text-emerald-600 shrink-0" />
          <h1 className="text-3xl font-black truncate">Ventas</h1>
          {!sale.isOnline && (
            <span className="flex items-center gap-2 rounded-xl bg-amber-100 text-amber-900 px-3 py-1.5 text-lg font-bold">
              <WifiOff className="h-5 w-5" /> Sin internet
            </span>
          )}
        </div>
        {/* Discreto a propósito: es para el administrador, no para quien vende */}
        <button
          type="button"
          onClick={() => setIsExitOpen(true)}
          aria-label="Salir de la pantalla sencilla"
          className="h-12 w-12 rounded-xl flex items-center justify-center text-stone-400 active:bg-stone-100 cursor-pointer"
        >
          <Lock className="h-6 w-6" />
        </button>
      </header>

      {isRegisterClosed ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <Lock className="h-24 w-24 text-stone-400" />
          <p className="text-5xl font-black">La caja está cerrada</p>
          <p className="text-3xl font-bold text-stone-500">Pida que abran la caja para poder vender.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex">
          <main className="flex-1 min-w-0 overflow-y-auto p-5">
            {sale.isLoadingProducts ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-stone-400" />
              </div>
            ) : (
              <>
                {families.length === 0 && (
                  <p className="mb-4 rounded-2xl bg-white border-2 border-stone-200 p-4 text-xl font-bold text-stone-500">
                    Todavía no hay productos con foto. Se pueden cobrar con el lector o con &quot;Otro producto&quot;.
                  </p>
                )}
                <FamilyGrid
                  families={families}
                  onSelectFamily={selectFamily}
                  onOtherProduct={() => setStep({ kind: 'GENERIC', name: 'Otro producto', needsReview: true })}
                />
              </>
            )}
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
