import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import dbHelper from '@/lib/indexedDb';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc } from '@/lib/productImages';
import { roundMoney, weightQuantityForAmount } from '@/lib/utils';
import { useOfflineStore } from '@/store/useOfflineStore';
import { Product } from '../../pos/types';
import { SimpleFamily, SimpleItem, itemTotal } from '../helpers';

/** Segundos que se ofrece "Deshacer" después de quitar algo del ticket */
const UNDO_SECONDS = 10;

export interface UndoState {
  message: string;
  previousItems: SimpleItem[];
}

export function useSimpleSale() {
  const { isOnline, updateSyncQueueCount } = useOfflineStore();

  // ─── Catálogo (en línea desde SWR; sin internet, desde la copia de IndexedDB) ───
  const { data: swrProducts } = useSWR<Product[]>(isOnline ? '/products' : null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOnline && swrProducts && dbHelper) {
      void dbHelper.saveProducts(swrProducts);
    }
  }, [isOnline, swrProducts]);

  useEffect(() => {
    if (!isOnline && dbHelper) {
      dbHelper.getProducts<Product>().then(setLocalProducts).catch(() => setLocalProducts([]));
    }
  }, [isOnline]);

  const products = useMemo(() => (isOnline ? swrProducts ?? [] : localProducts), [isOnline, swrProducts, localProducts]);
  const isLoadingProducts = isOnline && !swrProducts;

  // ─── Ticket ───
  // Sin tope por existencia: el inventario puede estar desfasado y la abuela nunca debe quedarse sin poder cobrar
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const offerUndo = useCallback((message: string, previousItems: SimpleItem[]) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndo({ message, previousItems });
    undoTimerRef.current = setTimeout(() => setUndo(null), UNDO_SECONDS * 1000);
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndo(null);
  }, []);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const applyUndo = useCallback(() => {
    if (!undo) return;
    setItems(undo.previousItems);
    dismissUndo();
  }, [undo, dismissUndo]);

  /** Agrega una pieza; si ya estaba en el ticket, suma una más */
  const addPiece = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === product.id);
      if (existing) {
        return prev.map((i) => (i.key === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key: product.id,
          productId: product.id,
          name: product.name,
          price: product.sellPrice,
          quantity: 1,
          imageSrc: getProductImageSrc(product.imageUrl),
          isWeight: false,
        },
      ];
    });
  }, []);

  /** Agrega un producto a granel por monto en pesos ("$20 de jamón") */
  const addWeightByAmount = useCallback((product: Product, amount: number) => {
    const quantity = weightQuantityForAmount(amount, product.sellPrice);
    if (quantity <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        key: `weight-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.sellPrice,
        quantity,
        imageSrc: getProductImageSrc(product.imageUrl),
        isWeight: true,
      },
    ]);
  }, []);

  /**
   * Artículo sin registrar: se cobra con el precio que diga la abuela.
   * Con `needsReview` queda "por aclarar" para que el administrador diga qué producto era.
   */
  const addGeneric = useCallback((name: string, price: number, needsReview = false) => {
    setItems((prev) => [
      ...prev,
      {
        key: `generic-${Date.now()}`,
        name,
        price,
        quantity: 1,
        imageSrc: null,
        isWeight: false,
        review: needsReview ? { family: null } : undefined,
      },
    ]);
  }, []);

  /** "No sé cuál": sabe que fue un Boing y cuánto costó, pero no el sabor. Se aclara después. */
  const addUnsure = useCallback((family: SimpleFamily, price: number) => {
    const key = `unsure-${family.key}-${price}`;
    setItems((prev) => {
      if (prev.some((i) => i.key === key)) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          name: `${family.name} (no sé cuál)`,
          price,
          quantity: 1,
          imageSrc: family.imageSrc,
          isWeight: false,
          review: { family: family.name },
        },
      ];
    });
  }, []);

  const increment = useCallback((key: string) => {
    setItems((prev) => prev.map((i) => (i.key === key && !i.isWeight ? { ...i, quantity: i.quantity + 1 } : i)));
  }, []);

  /** Resta una pieza; si era la última (o es granel / libre), quita el renglón y ofrece deshacer */
  const decrement = useCallback((key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    if (!item.isWeight && item.quantity > 1) {
      setItems(items.map((i) => (i.key === key ? { ...i, quantity: i.quantity - 1 } : i)));
      return;
    }
    setItems(items.filter((i) => i.key !== key));
    offerUndo(`Se quitó ${item.name}`, items);
  }, [items, offerUndo]);

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    setItems([]);
    offerUndo('Se borró la venta', items);
  }, [items, offerUndo]);

  const total = useMemo(() => roundMoney(items.reduce((sum, i) => sum + itemTotal(i), 0)), [items]);
  const pieceCount = useMemo(() => items.reduce((sum, i) => sum + (i.isWeight ? 1 : i.quantity), 0), [items]);

  // ─── Cobro ───
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Registra la venta en efectivo. Devuelve null si salió bien o el mensaje de error. */
  const submitSale = useCallback(async (amountPaid: number): Promise<string | null> => {
    const payload = {
      discount: 0,
      paymentMethod: 'EFECTIVO',
      amountPaid,
      items: items.map((i) =>
        i.productId
          ? { productId: i.productId, quantity: i.quantity }
          : {
              quantity: i.quantity,
              genericName: i.name,
              genericPrice: i.price,
              ...(i.review && { needsReview: true, pendingFamily: i.review.family ?? undefined }),
            }
      ),
    };

    setIsSubmitting(true);
    try {
      if (!isOnline) {
        if (!dbHelper) return 'No se pudo guardar la venta en la tableta.';
        await dbHelper.queueSale(payload);
        await updateSyncQueueCount();
      } else {
        await api.post('/sales', payload);
        void mutate('/products');
        void mutate('/register/active');
      }
      setItems([]);
      dismissUndo();
      return null;
    } catch (error) {
      return parseAxiosError(error, 'No se pudo guardar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  }, [items, isOnline, updateSyncQueueCount, dismissUndo]);

  return {
    isOnline,
    products,
    isLoadingProducts,
    items,
    total,
    pieceCount,
    addPiece,
    addWeightByAmount,
    addGeneric,
    addUnsure,
    increment,
    decrement,
    clearAll,
    undo,
    applyUndo,
    dismissUndo,
    isSubmitting,
    submitSale,
  };
}
