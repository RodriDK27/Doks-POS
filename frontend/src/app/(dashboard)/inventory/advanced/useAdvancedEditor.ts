import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { uploadProductImage } from '@/lib/productImages';
import { Category, Product } from '../types';

/** Columnas editables, en el orden en que se pegan desde Excel */
export const EDITABLE_COLUMNS = ['name', 'unitType', 'barcode', 'purchasePrice', 'sellPrice', 'stock', 'category'] as const;
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
  imageUrl?: string | null;
  /** Foto elegida en el editor; se sube al guardar */
  imageFile?: File;
  /** Valores con los que se cargó la fila (para saber si cambió) */
  original?: Omit<EditorRow, 'key' | 'original' | 'imageFile' | 'serverError'>;
  /** Error que devolvió el servidor al guardar */
  serverError?: string;
}

export type RowStatus = 'clean' | 'new' | 'dirty';

/** Filas por petición: el servidor acepta hasta 250 y así cada tanda responde rápido */
const SAVE_BATCH = 200;
/** Fotos que se suben a la vez */
const IMAGE_CONCURRENCY = 4;

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
    imageUrl: p.imageUrl ?? null,
  };
  return { key: p.id, ...base, original: base };
}

export function emptyRow(): EditorRow {
  return { key: newKey(), name: '', unitType: 'PIECE', barcode: '', purchasePrice: '', sellPrice: '', stock: '0', category: '' };
}

export function rowStatus(row: EditorRow): RowStatus {
  if (!row.id) return 'new';
  const o = row.original!;
  const changed =
    !!row.imageFile ||
    EDITABLE_COLUMNS.some((col) => String(row[col]).trim() !== String(o[col]).trim());
  return changed ? 'dirty' : 'clean';
}

/** Una fila nueva que nadie ha tocado no cuenta como cambio */
function isBlankNewRow(row: EditorRow): boolean {
  return !row.id && !row.name.trim() && !row.barcode.trim() && !row.purchasePrice.trim() && !row.sellPrice.trim() && !row.imageFile;
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
    for (const row of rows) {
      if (isBlankNewRow(row)) continue;
      const e: Partial<Record<EditableColumn, string>> = {};
      if (!row.name.trim()) e.name = 'El nombre es obligatorio';
      for (const col of ['purchasePrice', 'sellPrice', 'stock'] as const) {
        const n = parseNumber(row[col]);
        if (n === null) e[col] = 'Debe ser un número';
        else if (n < 0) e[col] = 'No puede ser negativo';
      }
      const code = row.barcode.trim();
      if (code) {
        if (barcodeOwner.has(code)) e.barcode = 'Código repetido en otra fila';
        else barcodeOwner.set(code, row.key);
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

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key || !!r.id));
  }, []);

  const discardChanges = useCallback(() => {
    setRows((products ?? []).map(toRow));
  }, [products]);

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
  const [progress, setProgress] = useState<{ done: number; total: number; stage: 'datos' | 'fotos' } | null>(null);

  const save = useCallback(async (): Promise<{ ok: number; failed: number; error?: string }> => {
    const toSave = rows.filter((r) => !isBlankNewRow(r) && rowStatus(r) !== 'clean' && !errorsByKey.has(r.key));
    if (toSave.length === 0) return { ok: 0, failed: 0 };

    const savedIds = new Map<string, string>(); // key → id
    const serverErrors = new Map<string, string>();
    let fatal: string | undefined;

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
      prev.map((r) => {
        const id = savedIds.get(r.key);
        const error = serverErrors.get(r.key);
        if (!id) return error ? { ...r, serverError: error } : r;
        const imageUrl = uploadedUrls.has(r.key) ? uploadedUrls.get(r.key) : r.imageUrl;
        const saved: EditorRow = { ...r, id, imageUrl, imageFile: error ? r.imageFile : undefined, serverError: error };
        const { key: _k, original: _o, imageFile: _f, serverError: _e, ...base } = saved;
        void _k; void _o; void _f; void _e;
        return { ...saved, original: base };
      })
    );
    setProgress(null);
    void mutate('/products');
    void mutate('/products/categories');

    return { ok: savedIds.size, failed: serverErrors.size, error: fatal };
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
    removeRow,
    discardChanges,
    pasteBlock,
    save,
  };
}
