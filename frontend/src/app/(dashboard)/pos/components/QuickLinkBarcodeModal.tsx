import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Barcode, Search, Link2, Plus, Check, AlertCircle, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../types';
import { cn } from '@/lib/utils';

interface QuickLinkBarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unrecognizedBarcode: string;
  catalogProducts: Product[];
  onLinkBarcode: (productId: string, barcode: string) => Promise<void>;
  onOpenNewProduct?: () => void;
}

function QuickLinkBarcodeContent({
  onOpenChange,
  unrecognizedBarcode,
  catalogProducts,
  onLinkBarcode,
  onOpenNewProduct,
}: Omit<QuickLinkBarcodeModalProps, 'open'>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return catalogProducts.slice(0, 15);
    }
    return catalogProducts
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(term);
        const catMatch = p.category ? p.category.toLowerCase().includes(term) : false;
        const mainBarcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(term) : false;
        const secBarcodeMatch = p.barcodes ? p.barcodes.some((b) => (b.barcode || '').toLowerCase().includes(term)) : false;
        return nameMatch || catMatch || mainBarcodeMatch || secBarcodeMatch;
      })
      .slice(0, 20);
  }, [catalogProducts, searchTerm]);

  const handleConfirmLink = async () => {
    if (!selectedProductId || !unrecognizedBarcode) return;
    setIsLinking(true);
    try {
      await onLinkBarcode(selectedProductId, unrecognizedBarcode);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <DialogContent className="w-[94vw] sm:max-w-lg md:max-w-xl rounded-3xl p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
      <DialogHeader className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertCircle className="h-5 w-5" />
          <DialogTitle className="font-black text-lg md:text-xl text-slate-800 dark:text-slate-100">
            Código No Reconocido
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
          El código escaneado no coincide con ningún producto. Puedes vincularlo como código alternativo a un producto existente o registrar uno nuevo.
        </DialogDescription>

        {/* Badge del código escaneado */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Código Escaneado
              </span>
              <span className="text-base font-black font-mono text-slate-800 dark:text-slate-100 tracking-wider">
                {unrecognizedBarcode}
              </span>
            </div>
          </div>
          {onOpenNewProduct && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1 rounded-xl bg-white dark:bg-slate-800 border-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 shadow-xs"
              onClick={() => {
                onOpenChange(false);
                onOpenNewProduct();
              }}
            >
              <Plus className="h-3.5 w-3.5 text-indigo-500" />
              <span>Nuevo Producto</span>
            </Button>
          )}
        </div>
      </DialogHeader>

      <div className="space-y-3 py-2 text-xs">
        {/* Buscador de productos existentes */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar producto por nombre (ej. Coca-Cola, Sabritas)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Lista de productos para seleccionar */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Selecciona el producto al que pertenece este código:
          </span>

          {filteredProducts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500">
              <Package className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
              <p className="font-semibold text-xs">No se encontraron productos coincidentes</p>
              <p className="text-[11px] mt-0.5">Prueba con otro término de búsqueda</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProductId === product.id;
              const secondaryCount = product.barcodes?.length || 0;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs ring-1 ring-indigo-500"
                      : "bg-white dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {product.name}
                      </span>
                      {product.category && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>Pral: {product.barcode || 'Sin código'}</span>
                      {secondaryCount > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          +{secondaryCount} adicional{secondaryCount > 1 ? 'es' : ''}
                        </span>
                      )}
                      <span className="text-slate-500">· Stock: {product.stock}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${product.sellPrice.toFixed(2)}
                    </span>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 dark:border-slate-700 text-transparent"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-initial text-xs font-bold rounded-xl h-10 px-4 cursor-pointer"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={!selectedProductId || isLinking}
          className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 rounded-xl h-10 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
          onClick={handleConfirmLink}
        >
          <Link2 className="h-4 w-4" />
          <span>{isLinking ? 'Vinculando...' : 'Vincular y Agregar al Carrito'}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function QuickLinkBarcodeModal({
  open,
  onOpenChange,
  ...props
}: QuickLinkBarcodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <QuickLinkBarcodeContent onOpenChange={onOpenChange} {...props} />}
    </Dialog>
  );
}
