import { getProductImageSrc } from '@/lib/productImages';
import { Product } from '../pos/types';

/** Renglón del ticket en el modo sencillo */
export interface SimpleItem {
  /** Llave del renglón: el id del producto para piezas; única para granel y artículos libres */
  key: string;
  productId?: string;
  name: string;
  /** Precio unitario (por pieza o por kilo) */
  price: number;
  quantity: number;
  imageSrc: string | null;
  isWeight: boolean;
  /**
   * Cobrado sin saber el producto exacto: queda en la bandeja "Por aclarar" del administrador.
   * `family` es la familia que eligió ("Boing"); nulo si fue "Otro producto".
   */
  review?: { family: string | null };
}

/** Cuadro de la pantalla de inicio: una familia (Boing) o un producto suelto con foto */
export interface SimpleFamily {
  key: string;
  name: string;
  imageSrc: string | null;
  /** Variantes ordenadas por precio */
  products: Product[];
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

/**
 * Arma la cuadrícula de inicio. Aparece todo lo que tenga foto:
 * - Productos con familia se juntan en un solo cuadro (basta con que una variante tenga foto).
 * - Productos sin familia aparecen solos si tienen foto.
 * El orden es alfabético y estable, para que la abuela se aprenda dónde está cada cosa.
 */
export function buildFamilies(products: Product[]): SimpleFamily[] {
  const groups = new Map<string, { name: string; products: Product[] }>();

  for (const product of products) {
    const familyName = product.family?.trim();
    const key = familyName ? `family:${familyName.toLowerCase()}` : `product:${product.id}`;
    const group = groups.get(key);
    if (group) {
      group.products.push(product);
    } else {
      groups.set(key, { name: familyName || product.name, products: [product] });
    }
  }

  const families: SimpleFamily[] = [];
  for (const [key, group] of groups) {
    const withImage = group.products.find((p) => p.imageUrl);
    if (!withImage) continue;
    families.push({
      key,
      name: group.name,
      imageSrc: getProductImageSrc(withImage.imageUrl),
      products: [...group.products].sort((a, b) => a.sellPrice - b.sellPrice || collator.compare(a.name, b.name)),
    });
  }

  return families.sort((a, b) => collator.compare(a.name, b.name));
}

/** Precios distintos de las piezas de una familia, de menor a mayor (botones de "No sé cuál") */
export function familyPiecePrices(family: SimpleFamily): number[] {
  const prices = family.products.filter((p) => p.unitType !== 'WEIGHT').map((p) => p.sellPrice);
  return [...new Set(prices)].sort((a, b) => a - b);
}

/** Busca un producto por código de barras principal o secundario */
export function findProductByBarcode(products: Product[], code: string): Product | undefined {
  const clean = code.trim().toLowerCase();
  if (!clean) return undefined;
  return products.find(
    (p) =>
      (p.barcode && p.barcode.toLowerCase() === clean) ||
      p.barcodes?.some((b) => (b.barcode || '').toLowerCase() === clean)
  );
}

/** $15 o $15.50: sin centavos cuando no hacen falta, para leerse más fácil */
export function formatMoney(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded)
    ? `$${rounded.toLocaleString('es-MX')}`
    : `$${rounded.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Cantidad en kilos para cobrar un monto a granel ("$20 de jamón").
 * Se redondea hacia abajo con 6 decimales para que el total del servidor nunca pase del monto cobrado.
 */
export function weightQuantityForAmount(amount: number, pricePerKg: number): number {
  if (pricePerKg <= 0) return 0;
  return Math.floor((amount / pricePerKg) * 1_000_000) / 1_000_000;
}

export function itemTotal(item: SimpleItem): number {
  return item.price * item.quantity;
}

/** Monto mínimo que cubre el total, en centavos completos (para "Pagó justo") */
export function roundUpToCents(amount: number): number {
  return Math.ceil(Math.round(amount * 10000) / 100) / 100;
}

let audioCtx: AudioContext | null = null;

/** Pitido corto: agudo cuando todo va bien, grave cuando algo falló */
export function playBeep(kind: 'ok' | 'error' = 'ok') {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = kind === 'ok' ? 1200 : 300;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + (kind === 'ok' ? 0.12 : 0.4));
  } catch {
    // Sin audio disponible: se sigue sin sonido
  }
}
