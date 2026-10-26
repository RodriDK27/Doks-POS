import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { uploadProductImage } from '@/lib/productImages';
import { Category, Product } from '../types';
import { FAVORITES_KEY_PREFIX } from '../../pos/hooks/useFavoriteToggle';

/** Columnas editables, en el orden en que se pegan desde Excel (los otros códigos al final para no mover las demás) */
export const EDITABLE_COLUMNS = ['name', 'unitType', 'barcode', 'purchasePrice', 'sellPrice', 'stock', 'category', 'extraBarcodes'] as const;
export type EditableColumn = (typeof EDITABLE_COLUMNS)[number];

export interface EditorRow {
  /** Llave estable en la tabla (el id del producto, o una temporal para filas nuevas) */
  key: string;
  id?: string;
  name: string;
  unitType: 'PIECE' | 'WEIGHT';
  barcode: string;
  purchasePrice: string;
  sellPrice: string;
  stock: string;
  category: string;
  /** Códigos de barras secundarios, separados por coma */
  extraBarcodes: string;
  imageUrl?: string | null;
  /** Corazón de favoritos: se guarda al momento, no con el botón Guardar */
  isFavorite?: boolean;
  /** Foto elegida en el editor; se sube al guardar */
  imageFile?: File;
  /** Producto marcado para borrarse; se borra al guardar */
  toDelete?: boolean;
  /** Valores con los que se cargó la fila (para saber si cambió) */
  original?: Omit<EditorRow, 'key' | 'original' | 'imageFile' | 'serverError' | 'isFavorite' | 'toDelete'>;
  /** Error que devolvió el servidor al guardar */
  serverError?: string;
}

export type RowStatus = 'clean' | 'new' | 'dirty' | 'deleted';

/** Filas por petición: el servidor acepta hasta 250 y así cada tanda responde rápido */
const SAVE_BATCH = 200;
/** Fotos que se suben a la vez */
const IMAGE_CONCURRENCY = 4;

/** "123, 456 789" → ['123', '456', '789'] (sin repetidos) */
export function parseCodes(value: string): string[] {
  return [...new Set(value.split(/[,;\s]+/).map((c) => c.trim()).filter(Boolean))];
}

const formatCodes = (codes: string[]) => codes.join(', ');

let tempCounter = 0;
const newKey = () => `nuevo-${Date.now()}-${tempCounter++}`;

function toRow(p: Product): EditorRow {
  const base = {
    id: p.id,
    name: p.name,
    unitType: (p.unitType === 'WEIGHT' ? 'WEIGHT' : 'PIECE') as EditorRow['unitType'],
    barcode: p.barcode ?? '',
    purchasePrice: String(p.purchasePrice ?? 0),
    sellPrice: String(p.sellPrice ?? 0),
    stock: String(p.stock ?? 0),
    category: p.category ?? '',
    extraBarcodes: formatCodes((p.barcodes ?? []).map((b) => b.barcode)),
    imageUrl: p.imageUrl ?? null,
  };
  return { key: p.id, ...base, isFavorite: !!p.isFavorite, original: base };
}

export function emptyRow(): EditorRow {
  return { key: newKey(), name: '', unitType: 'PIECE', barcode: '', purchasePrice: '', sellPrice: '', stock: '0', category: '', extraBarcodes: '' };
}

export function rowStatus(row: EditorRow): RowStatus {
  if (!row.id) return 'new';
  if (row.toDelete) return 'deleted';
  const o = row.original!;
  const changed =
    !!row.imageFile ||
    EDITABLE_COLUMNS.some((col) =>
      col === 'extraBarcodes'
        ? parseCodes(row[col]).join(',') !== parseCodes(o[col]).join(',')
        : String(row[col]).trim() !== String(o[col]).trim()
    );
  return changed ? 'dirty' : 'clean';
}

/** Una fila nueva que nadie ha tocado no cuenta como cambio */
function isBlankNewRow(row: EditorRow): boolean {
  return !row.id && !row.name.trim() && !row.barcode.trim() && !row.purchasePrice.trim() && !row.sellPrice.trim() && !row.extraBarcodes.trim() && !row.imageFile;
}

function parseNumber(value: string): number | null {
  const clean = value.replace(/[$,\s]/g, '');
  if (clean === '') return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

/** "Granel", "kg", "peso" → WEIGHT; cualquier otra cosa → PIECE (para pegar desde Excel) */
function parseUnitType(value: string): EditorRow['unitType'] {
  const v = value.trim().toLowerCase();
  return v === 'weight' || v.startsWith('granel') || v === 'kg' || v.startsWith('peso') ? 'WEIGHT' : 'PIECE';
}

export function useAdvancedEditor() {
  const { data: products, isLoading } = useSWR<Product[]>('/products');
  const { data: categoryList } = useSWR<Category[]>('/categories');

  const [rows, setRows] = useState<EditorRow[]>([]);
  const loadedRef = useRef(false);
  // Para leer la fila actual desde callbacks estables (las filas memorizadas no se vuelven a dibujar)
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Se carga una sola vez; después el editor es la fuente de verdad hasta guardar o descartar
  useEffect(() => {
    if (products && !loadedRef.current) {
      loadedRef.current = true;
      setRows(products.map(toRow));
    }
  }, [products]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    categoryList?.forEach((c) => names.add(c.name));
    rows.forEach((r) => r.category.trim() && names.add(r.category.trim()));
    return [...names].sort((a, b) => a.localeCompare(b, 'es'));
  }, [categoryList, rows]);

  // ─── Validación ───
  const errorsByKey = useMemo(() => {
    const errors = new Map<string, Partial<Record<EditableColumn, string>>>();
    const barcodeOwner = new Map<string, string>();
    // Cuántas filas usan cada nombre: una fila nueva (ej. duplicada) con el nombre de otra casi siempre es un olvido
    const nameCount = new Map<string, number>();
    for (const row of rows) {
      const name = row.name.trim().toLowerCase();
      if (name) nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
    }
    for (const row of rows) {
      if (isBlankNewRow(row) || row.toDelete) continue;
      const e: Partial<Record<EditableColumn, string>> = {};
      if (!row.name.trim()) e.name = 'El nombre es obligatorio';
      else if (!row.id && (nameCount.get(row.name.trim().toLowerCase()) ?? 0) > 1) {
        e.name = 'Ya hay un producto con este nombre: cambia lo que varía (tamaño, sabor...)';
      }
      // Precio de compra y stock vacíos cuentan como 0; el precio de venta sí es obligatorio
      for (const col of ['purchasePrice', 'sellPrice', 'stock'] as const) {
        const raw = row[col].trim();
        if (!raw) {
          if (col === 'sellPrice') e[col] = 'Pon el precio de venta';
          continue;
        }
        const n = parseNumber(raw);
        if (n === null) e[col] = 'Debe ser un número';
        else if (n < 0) e[col] = 'No puede ser negativo';
      }
      const code = row.barcode.trim();
      if (code) {
        if (barcodeOwner.has(code)) e.barcode = 'Código repetido en otra fila';
        else barcodeOwner.set(code, row.key);
      }
      for (const extra of parseCodes(row.extraBarcodes)) {
        if (extra === code) continue; // Repetir el principal no estorba: al guardar se ignora
        if (barcodeOwner.has(extra)) {
          e.extraBarcodes = `El código ${extra} ya está en otra fila`;
          break;
        }
        barcodeOwner.set(extra, row.key);
      }
      if (Object.keys(e).length) errors.set(row.key, e);
    }
    return errors;
  }, [rows]);

  const pendingRows = useMemo(() => rows.filter((r) => !isBlankNewRow(r) && rowStatus(r) !== 'clean'), [rows]);

  // ─── Edición ───
  const updateCell = useCallback((key: string, column: EditableColumn, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, [column]: column === 'unitType' ? parseUnitType(value) : value, serverError: undefined } : r
      )
    );
  }, []);

  const setRowImage = useCallback((key: string, file: File) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, imageFile: file } : r)));
  }, []);

  const addRows = useCallback((count: number) => {
    const fresh = Array.from({ length: count }, emptyRow);
    setRows((prev) => [...fresh, ...prev]);
    return fresh[0].key;
  }, []);

  /**
   * Copia una fila como producto nuevo justo debajo, para variantes que cambian poco (otro tamaño o sabor).
   * El código de barras va vacío (es único por producto), el stock en 0 y la foto no se copia.
   */
  const duplicateRow = useCallback((key: string) => {
    const source = rowsRef.current.find((r) => r.key === key);
    if (!source) return null;
    const copy: EditorRow = {
      ...emptyRow(),
      name: source.name,
      unitType: source.unitType,
      purchasePrice: source.purchasePrice,
      sellPrice: source.sellPrice,
      category: source.category,
    };
    setRows((prev) => {
      const index = prev.findIndex((r) => r.key === key);
      return index === -1 ? [copy, ...prev] : [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
    return copy.key;
  }, []);

  /** Una fila nueva se quita al momento; un producto guardado se marca (o desmarca) para borrarse al guardar */
  const removeRow = useCallback((key: string) => {
    setRows((prev) =>
      prev.flatMap((r) => (r.key !== key ? [r] : r.id ? [{ ...r, toDelete: !r.toDelete, serverError: undefined }] : []))
    );
  }, []);

  const discardChanges = useCallback(() => {
    setRows((products ?? []).map(toRow));
  }, [products]);

  /**
   * Refleja en la tabla el stock que devolvió el servidor (agregado rápido). Si el stock de la fila
   * se estaba editando sin guardar, se respeta lo capturado y solo se mueve el valor de referencia.
   */
  const applyStock = useCallback((updates: Array<{ id: string; stock: number }>) => {
    const stockById = new Map(updates.map((u) => [u.id, String(u.stock)]));
    setRows((prev) =>
      prev.map((r) => {
        const stock = r.id ? stockById.get(r.id) : undefined;
        if (stock === undefined || !r.original) return r;
        const editing = r.stock.trim() !== r.original.stock.trim();
        return { ...r, stock: editing ? r.stock : stock, original: { ...r.original, stock } };
      })
    );
  }, []);

  /** Marca o quita el corazón al instante; si el servidor falla, la fila regresa como estaba */
  const toggleFavorite = useCallback(async (key: string) => {
    const row = rowsRef.current.find((r) => r.key === key);
    if (!row?.id) return;
    const next = !row.isFavorite;
    const setFavorite = (value: boolean) =>
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, isFavorite: value } : r)));
    setFavorite(next);
    try {
      await api.patch(`/products/${row.id}/favorite`, { isFavorite: next });
      void mutate('/products');
      void mutate((k) => typeof k === 'string' && k.startsWith(FAVORITES_KEY_PREFIX));
    } catch (error) {
      setFavorite(!next);
      toast.error(parseAxiosError(error, 'No se pudo actualizar el favorito.'));
    }
  }, []);

  /** Agrega a la tabla un producto que se registró fuera del editor */
  const addProduct = useCallback((product: Product) => {
    setRows((prev) => (prev.some((r) => r.id === product.id) ? prev : [toRow(product), ...prev]));
  }, []);

  /**
   * Pega un bloque copiado de Excel (columnas separadas por tabulador) desde la celda indicada.
   * Rellena hacia la derecha y hacia abajo; si faltan filas, agrega filas nuevas al final.
   */
  const pasteBlock = useCallback((startKey: string, startColumn: EditableColumn, text: string, visibleKeys: string[]) => {
    const lines = text.replace(/\r/g, '').split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    const grid = lines.map((line) => line.split('\t'));
    const startCol = EDITABLE_COLUMNS.indexOf(startColumn);
    const startIndex = visibleKeys.indexOf(startKey);

    setRows((prev) => {
      const next = [...prev];
      const indexByKey = new Map(next.map((r, i) => [r.key, i]));
      grid.forEach((cells, rowOffset) => {
        let targetKey = visibleKeys[startIndex + rowOffset];
        if (!targetKey) {
          const fresh = emptyRow();
          next.push(fresh);
          indexByKey.set(fresh.key, next.length - 1);
          targetKey = fresh.key;
        }
        const i = indexByKey.get(targetKey)!;
        const updated = { ...next[i], serverError: undefined };
        cells.forEach((value, colOffset) => {
          const column = EDITABLE_COLUMNS[startCol + colOffset];
          if (!column) return;
          (updated as Record<string, unknown>)[column] = column === 'unitType' ? parseUnitType(value) : value.trim();
        });
        next[i] = updated;
      });
      return next;
    });
  }, []);

  // ─── Guardado ───
  const [progress, setProgress] = useState<{ done: number; total: number; stage: 'borrando' | 'datos' | 'fotos' } | null>(null);

  const save = useCallback(async (): Promise<{ ok: number; deleted: number; failed: number; error?: string }> => {
    const toDelete = rows.filter((r) => r.id && r.toDelete);
    const toSave = rows.filter(
      (r) => !isBlankNewRow(r) && !r.toDelete && rowStatus(r) !== 'clean' && !errorsByKey.has(r.key)
    );
    if (toSave.length === 0 && toDelete.length === 0) return { ok: 0, deleted: 0, failed: 0 };

    const savedIds = new Map<string, string>(); // key → id
    const serverErrors = new Map<string, string>();
    let fatal: string | undefined;

    // Primero los borrados: así el código de barras de un producto borrado ya lo puede usar otro
    const deletedKeys = new Set<string>();
    if (toDelete.length) {
      let done = 0;
      setProgress({ done: 0, total: toDelete.length, stage: 'borrando' });
      const queue = [...toDelete];
      await Promise.all(
        Array.from({ length: Math.min(IMAGE_CONCURRENCY, queue.length) }, async () => {
          for (let r = queue.shift(); r; r = queue.shift()) {
            try {
              await api.delete(`/products/${r.id}`);
              deletedKeys.add(r.key);
            } catch (error) {
              serverErrors.set(r.key, parseAxiosError(error, 'No se pudo borrar el producto.'));
            }
            setProgress({ done: ++done, total: toDelete.length, stage: 'borrando' });
          }
        })
      );
    }

    setProgress({ done: 0, total: toSave.length, stage: 'datos' });
    for (let start = 0; start < toSave.length; start += SAVE_BATCH) {
      const batch = toSave.slice(start, start + SAVE_BATCH);
      try {
        const res = await api.post<{
          created: Array<{ index: number; id: string }>;
          updated: Array<{ index: number; id: string }>;
          errors: Array<{ index: number; message: string }>;
        }>('/products/bulk', {
          rows: batch.map((r) => ({
            ...(r.id ? { id: r.id } : {}),
            name: r.name.trim(),
            unitType: r.unitType,
            barcode: r.barcode.trim() || undefined,
            purchasePrice: parseNumber(r.purchasePrice) ?? 0,
            sellPrice: parseNumber(r.sellPrice) ?? 0,
            stock: parseNumber(r.stock) ?? 0,
            category: r.category.trim() || undefined,
            // Los otros códigos solo se mandan si cambiaron, para no pisar los que se agregaron desde otro lado
            ...(!r.original || parseCodes(r.extraBarcodes).join(',') !== parseCodes(r.original.extraBarcodes).join(',')
              ? { barcodes: parseCodes(r.extraBarcodes) }
              : {}),
          })),
        });
        for (const { index, id } of [...res.data.created, ...res.data.updated]) savedIds.set(batch[index].key, id);
        for (const { index, message } of res.data.errors) serverErrors.set(batch[index].key, message);
      } catch (error) {
        fatal = parseAxiosError(error, 'No se pudo guardar.');
        for (const r of batch) serverErrors.set(r.key, fatal);
      }
      setProgress({ done: Math.min(start + SAVE_BATCH, toSave.length), total: toSave.length, stage: 'datos' });
    }

    // Fotos elegidas en el editor: se suben ya con el id del producto (varias a la vez)
    const withImage = toSave.filter((r) => r.imageFile && savedIds.has(r.key));
    const uploadedUrls = new Map<string, string | null>();
    if (withImage.length) {
      let done = 0;
      setProgress({ done: 0, total: withImage.length, stage: 'fotos' });
      const queue = [...withImage];
      await Promise.all(
        Array.from({ length: Math.min(IMAGE_CONCURRENCY, queue.length) }, async () => {
          for (let r = queue.shift(); r; r = queue.shift()) {
            try {
              const updated = await uploadProductImage<Product>(savedIds.get(r.key)!, r.imageFile!);
              uploadedUrls.set(r.key, updated.imageUrl ?? null);
            } catch {
              serverErrors.set(r.key, 'Se guardaron los datos pero la foto no se pudo subir.');
            }
            setProgress({ done: ++done, total: withImage.length, stage: 'fotos' });
          }
        })
      );
    }

    // Las filas guardadas quedan "limpias" con su id; las que fallaron conservan su error para corregirlas
    setRows((prev) =>
      prev.flatMap((r) => {
        if (deletedKeys.has(r.key)) return [];
        const id = savedIds.get(r.key);
        const error = serverErrors.get(r.key);
        if (!id) return [error ? { ...r, serverError: error } : r];
        const imageUrl = uploadedUrls.has(r.key) ? uploadedUrls.get(r.key) : r.imageUrl;
        // Igual que en el servidor: sin repetidos y sin el código principal
        const extraBarcodes = formatCodes(parseCodes(r.extraBarcodes).filter((c) => c !== r.barcode.trim()));
        const saved: EditorRow = { ...r, id, extraBarcodes, imageUrl, imageFile: error ? r.imageFile : undefined, serverError: error };
        const { key: _k, original: _o, imageFile: _f, serverError: _e, isFavorite: _h, toDelete: _d, ...base } = saved;
        void _k; void _o; void _f; void _e; void _h; void _d;
        return [{ ...saved, original: base }];
      })
    );
    setProgress(null);
    void mutate('/products');
    void mutate('/products/categories');

    return { ok: savedIds.size, deleted: deletedKeys.size, failed: serverErrors.size, error: fatal };
  }, [rows, errorsByKey]);

  return {
    isLoading: isLoading && rows.length === 0,
    rows,
    categories,
    errorsByKey,
    pendingRows,
    progress,
    updateCell,
    setRowImage,
    addRows,
    duplicateRow,
    removeRow,
    discardChanges,
    applyStock,
    addProduct,
    toggleFavorite,
    pasteBlock,
    save,
  };
}
