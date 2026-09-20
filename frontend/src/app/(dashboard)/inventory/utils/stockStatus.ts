import { Product, UNCATEGORIZED } from '../types';

export type StockStatus = 'OUT' | 'LOW' | 'OK';

/** Orden de urgencia: primero lo que hay que reponer. */
export const STATUS_RANK: Record<StockStatus, number> = { OUT: 0, LOW: 1, OK: 2 };

/**
 * Agotado = sin existencias (incluye negativos, posibles al "vender sin ajustar" en el POS).
 * Bajo = con existencias pero en o por debajo del mínimo.
 */
export function getStockStatus(product: Pick<Product, 'stock' | 'minStock'>): StockStatus {
  if (product.stock <= 0) return 'OUT';
  if (product.stock <= product.minStock) return 'LOW';
  return 'OK';
}

/** '' = todas, UNCATEGORIZED = sin categoría, cualquier otro valor = nombre exacto. */
export function matchesCategory(product: Pick<Product, 'category'>, selectedCategory: string): boolean {
  if (selectedCategory === '') return true;
  if (selectedCategory === UNCATEGORIZED) return !product.category;
  return product.category === selectedCategory;
}

/** Cantidad legible sin ruido de flotantes (12.5 kg, 24). */
export function formatQty(value: number, isWeight: boolean): string {
  const rounded = Number(value.toFixed(3));
  return isWeight ? `${rounded} kg` : String(rounded);
}
