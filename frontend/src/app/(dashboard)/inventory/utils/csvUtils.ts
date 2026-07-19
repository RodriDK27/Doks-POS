import { Product } from '../types';

// ─── EXPORTAR CSV ──────────────────────────────────────────────────────────

/** Genera y descarga un archivo CSV con el catálogo de productos recibido */
export function exportToCSV(products: Product[], filename = 'inventario.csv') {
  const headers = [
    'Nombre',
    'Codigo Barras',
    'Categoria',
    'Precio Compra',
    'Precio Venta',
    'Precio Mayoreo',
    'Stock',
    'Stock Minimo',
  ];

  const rows = products.map((p) => [
    escapeCSV(p.name),
    escapeCSV(p.barcode ?? ''),
    escapeCSV(p.category ?? ''),
    p.purchasePrice.toString(),
    p.sellPrice.toString(),
    (p.wholesalePrice ?? '').toString(),
    p.stock.toString(),
    p.minStock.toString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n');

  const bom = '\uFEFF'; // BOM para que Excel reconozca UTF-8
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── PLANTILLA CSV ─────────────────────────────────────────────────────────

/** Descarga una plantilla CSV de ejemplo para importar productos */
export function downloadCSVTemplate() {
  const template = [
    'Nombre,Codigo Barras,Categoria,Precio Compra,Precio Venta,Precio Mayoreo,Stock,Stock Minimo',
    'Refresco Cola 600ml,7501234567890,Bebidas,12.50,18.00,15.00,24,5',
    'Pan de Caja Blanco,,Panaderia,28.00,38.00,,12,3',
    'Detergente 1kg,7509876543210,Limpieza,45.00,65.00,55.00,8,2',
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_importacion.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ─── IMPORTAR / PARSEAR CSV ────────────────────────────────────────────────

export interface ParsedProductRow {
  name: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellPrice: number;
  wholesalePrice?: number;
  stock: number;
  minStock: number;
  _errors: string[];
}

/** Parsea un archivo CSV y devuelve un array de filas validadas */
export async function parseCSV(file: File): Promise<ParsedProductRow[]> {
  const text = await file.text();
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim() !== '');

  if (lines.length < 2) {
    throw new Error('El archivo CSV está vacío o no tiene filas de datos.');
  }

  // Saltar la cabecera
  const dataLines = lines.slice(1);

  return dataLines.map((line, index) => {
    const cols = splitCSVLine(line);
    const errors: string[] = [];

    const name = cols[0]?.trim() ?? '';
    const barcode = cols[1]?.trim() || undefined;
    const category = cols[2]?.trim() || undefined;
    const purchasePrice = parseFloat(cols[3] ?? '0');
    const sellPrice = parseFloat(cols[4] ?? '0');
    const wholesalePrice = cols[5]?.trim() ? parseFloat(cols[5]) : undefined;
    const stock = parseFloat(cols[6] ?? '0');
    const minStock = parseFloat(cols[7] ?? '0');

    if (!name) errors.push('Nombre requerido');
    if (isNaN(purchasePrice) || purchasePrice < 0) errors.push('Precio Compra inválido');
    if (isNaN(sellPrice) || sellPrice < 0) errors.push('Precio Venta inválido');
    if (isNaN(stock) || stock < 0) errors.push('Stock inválido');
    if (isNaN(minStock) || minStock < 0) errors.push('Stock Mínimo inválido');

    if (errors.length > 0 && !name) {
      errors[0] = `Fila ${index + 2}: ${errors.join(', ')}`;
    }

    return {
      name,
      barcode,
      category,
      purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
      sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
      wholesalePrice: wholesalePrice && !isNaN(wholesalePrice) ? wholesalePrice : undefined,
      stock: isNaN(stock) ? 0 : stock,
      minStock: isNaN(minStock) ? 0 : minStock,
      _errors: errors,
    };
  });
}

/** Divide una línea CSV respetando valores entre comillas */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
