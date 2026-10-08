import { getProductImageSrc } from '@/lib/productImages';
import { roundMoney } from '@/lib/utils';
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

export const ALL_CATEGORIES = 'TODOS';

/** Categorías de una familia (sus variantes pueden estar en más de una) */
export function familyCategories(family: SimpleFamily): string[] {
  return [...new Set(family.products.map((p) => p.category?.trim() || 'General'))];
}

/** Cuadro de categoría de la pantalla de inicio */
export interface SimpleCategory {
  name: string;
  count: number;
  imageSrc: string | null;
}

/** Llave para empatar el nombre de categoría del producto con la categoría oficial */
export function categoryKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Categorías con cuántos cuadros tiene cada una, en orden alfabético estable.
 * La imagen es la que el administrador le puso a la categoría; si no tiene, la foto de su primer producto.
 */
export function buildCategories(families: SimpleFamily[], categoryImages: Map<string, string>): SimpleCategory[] {
  const categories = new Map<string, SimpleCategory>();
  for (const family of families) {
    for (const name of familyCategories(family)) {
      const category = categories.get(name);
      if (category) {
        category.count += 1;
      } else {
        categories.set(name, { name, count: 1, imageSrc: categoryImages.get(categoryKey(name)) ?? family.imageSrc });
      }
    }
  }
  return [...categories.values()].sort((a, b) => collator.compare(a.name, b.name));
}

/** Minúsculas y sin acentos, para comparar lo que se dice por voz con los nombres del catálogo */
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Palabras que se dicen al hablar pero no ayudan a encontrar ("un boing de mango")
const STOP_WORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'con', 'por', 'favor']);

/**
 * Filtra la cuadrícula. La búsqueda por voz ignora la categoría elegida y busca en el nombre de la
 * familia y en el de cada variante ("mango" encuentra el cuadro de Boing). Singular o plural da igual.
 */
export function filterFamilies(families: SimpleFamily[], category: string, query: string): SimpleFamily[] {
  const words = normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w));

  if (words.length > 0) {
    return families.filter((family) => {
      const haystack = normalizeText([family.name, ...family.products.map((p) => p.name)].join(' '));
      return words.every((w) => haystack.includes(w) || (w.length > 3 && w.endsWith('s') && haystack.includes(w.slice(0, -1))));
    });
  }

  if (category === ALL_CATEGORIES) return families;
  return families.filter((family) => familyCategories(family).includes(category));
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

export function itemTotal(item: SimpleItem): number {
  return roundMoney(item.price * item.quantity);
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
