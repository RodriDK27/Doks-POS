'use client';

import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { parseCSV, downloadCSVTemplate, ParsedProductRow } from '../utils/csvUtils';

interface ImportResult {
  created: string[];
  skipped: { name: string; reason: string }[];
}

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ParsedProductRow[]) => Promise<ImportResult>;
}

export function ImportCSVModal({ open, onOpenChange, onImport }: ImportCSVModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsedRows([]);
    setParseError(null);
    setResult(null);

    try {
      const rows = await parseCSV(file);
      setParsedRows(rows);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Error al leer el archivo.');
    }

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const validRows = parsedRows.filter((r) => r._errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r._errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await onImport(validRows);
      setResult(res);
      setParsedRows([]);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (importing) return;
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Importar Productos desde CSV
          </DialogTitle>
          <DialogDescription className="text-xs">
            Sube un archivo CSV con los productos que deseas agregar al catálogo de forma masiva.
          </DialogDescription>
        </DialogHeader>

        {/* Resultado de importación */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                {result.created.length} producto(s) importado(s) exitosamente
              </div>
              {result.created.length > 0 && (
                <ul className="text-xs text-emerald-600 dark:text-emerald-500 space-y-0.5 pl-6 list-disc">
                  {result.created.slice(0, 5).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                  {result.created.length > 5 && (
                    <li>... y {result.created.length - 5} más</li>
                  )}
                </ul>
              )}
            </div>

            {result.skipped.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {result.skipped.length} producto(s) omitido(s)
                </div>
                <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-0.5 pl-6 list-disc">
                  {result.skipped.map((s, i) => (
                    <li key={i}><strong>{s.name}</strong>: {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-6 text-xs"
                onClick={handleClose}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Instrucciones y plantilla */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Formato del archivo CSV
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                El archivo debe tener las columnas en este orden: <strong>Nombre, Codigo Barras, Categoría, Precio Compra, Precio Venta, Precio Mayoreo, Stock, Stock Mínimo</strong>.
                La primera fila es el encabezado y se ignora.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5 rounded-lg"
                onClick={downloadCSVTemplate}
              >
                <Download className="h-3.5 w-3.5" />
                Descargar Plantilla de Ejemplo
              </Button>
            </div>

            {/* Zona de carga */}
            <div
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Haz clic para seleccionar un archivo .csv
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Solo se aceptan archivos CSV</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Error de parseo */}
            {parseError && (
              <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}

            {/* Previsualización de filas */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Previsualización — {parsedRows.length} fila(s) detectada(s)
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-none text-[10px] font-bold">
                      {validRows.length} válidas
                    </Badge>
                    {invalidRows.length > 0 && (
                      <Badge className="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 border-none text-[10px] font-bold">
                        {invalidRows.length} con errores
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-bold text-slate-500">Estado</th>
                        <th className="text-left p-2 font-bold text-slate-500">Nombre</th>
                        <th className="text-right p-2 font-bold text-slate-500">Precio Venta</th>
                        <th className="text-right p-2 font-bold text-slate-500">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className={row._errors.length > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                          <td className="p-2">
                            {row._errors.length === 0 ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span className="text-rose-500 text-[9px]">{row._errors[0]}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-2 font-medium text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                            {row.name || <span className="italic text-slate-400">Sin nombre</span>}
                          </td>
                          <td className="p-2 text-right text-slate-600 dark:text-slate-400">
                            ${row.sellPrice.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-300">
                            {row.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button
                variant="outline"
                className="text-xs rounded-xl"
                onClick={handleClose}
                disabled={importing}
              >
                Cancelar
              </Button>
              <Button
                disabled={validRows.length === 0 || importing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-5 active:scale-95 transition-all gap-1.5"
                onClick={handleImport}
              >
                {importing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importando...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Importar {validRows.length} Producto(s)</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
