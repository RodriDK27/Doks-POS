'use client';

import React from 'react';
import { Search, Plus, Edit3, Trash2, Barcode, Upload, Download, History, UtensilsCrossed, Copy, AlertTriangle, Layers, Check, Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Product } from '../types';
import { InventoryMetrics } from './InventoryMetrics';
import api from '@/lib/api';
import { mutate } from 'swr';
import { toast } from 'sonner';

interface CatalogTabProps {

  totalProductsCount: number;
  totalInvestment: number;
  expectedProfit: number;
  lowStockCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  stockFilter: 'ALL' | 'CRITICAL' | 'OUT_OF_STOCK';
  setStockFilter: (filter: 'ALL' | 'CRITICAL' | 'OUT_OF_STOCK') => void;
  categories: string[];
  filteredProducts: Product[];
  loading: boolean;
  selectedProductIds: string[];
  areAllFilteredSelected: boolean;
  toggleSelectProduct: (id: string) => void;
  toggleSelectAllProducts: (products: Product[]) => void;
  handleOpenAdd: () => void;
  setIsImportOpen: (open: boolean) => void;
  handleExportCSV: () => void;
  handleOpenMovements: (product: Product) => void;
  handleOpenWaste: (product: Product) => void;
  handleOpenDuplicate: (product: Product) => void;
  handleOpenEdit: (product: Product) => void;
  handleOpenDelete: (product: Product) => void;
  onOpenCategoryManager?: () => void;
}

export function CatalogTab({
  totalProductsCount,
  totalInvestment,
  expectedProfit,
  lowStockCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  categories,
  filteredProducts,
  loading,
  selectedProductIds,
  areAllFilteredSelected,
  toggleSelectProduct,
  toggleSelectAllProducts,
  handleOpenAdd,
  setIsImportOpen,
  handleExportCSV,
  handleOpenMovements,
  handleOpenWaste,
  handleOpenDuplicate,
  handleOpenEdit,
  handleOpenDelete,
  onOpenCategoryManager,
}: CatalogTabProps) {
  const { role } = useAuthStore();
  const [productsPage, setProductsPage] = React.useState(1);
  const [productsPerPage, setProductsPerPage] = React.useState(10);

  // Estados para edición rápida inline de existencias y precios
  const [inlineStockLoadingId, setInlineStockLoadingId] = React.useState<string | null>(null);
  const [editingStockId, setEditingStockId] = React.useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = React.useState<string>('');

  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = React.useState<string>('');

  const handleQuickStockIncrement = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    try {
      setInlineStockLoadingId(product.id);
      await api.patch(`/products/${product.id}/stock`, { stock: newStock });
      toast.success(`${product.name}: ${newStock} (${delta > 0 ? `+${delta}` : delta})`, { id: `stock-${product.id}` });
      await mutate('/products');
    } catch {
      toast.error('Error al actualizar existencias.');
    } finally {
      setInlineStockLoadingId(null);
    }
  };

  const handleSaveDirectStock = async (product: Product) => {
    const val = parseFloat(tempStockValue);
    if (isNaN(val) || val < 0) {
      setEditingStockId(null);
      return;
    }
    try {
      setInlineStockLoadingId(product.id);
      await api.patch(`/products/${product.id}/stock`, { stock: val });
      toast.success(`${product.name}: existencias actualizadas a ${val}`);
      await mutate('/products');
    } catch {
      toast.error('Error al actualizar existencias.');
    } finally {
      setInlineStockLoadingId(null);
      setEditingStockId(null);
    }
  };

  const handleSaveDirectPrice = async (product: Product) => {
    const val = parseFloat(tempPriceValue);
    if (isNaN(val) || val <= 0) {
      setEditingPriceId(null);
      return;
    }
    try {
      await api.patch(`/products/${product.id}`, { sellPrice: val });
      toast.success(`${product.name}: precio de venta fijado en $${val.toFixed(2)}`);
      await mutate('/products');
    } catch {
      toast.error('Error al actualizar precio.');
    } finally {
      setEditingPriceId(null);
    }
  };

  const [prevSearch, setPrevSearch] = React.useState({ searchQuery, selectedCategory, stockFilter });

  if (
    prevSearch.searchQuery !== searchQuery ||
    prevSearch.selectedCategory !== selectedCategory ||
    prevSearch.stockFilter !== stockFilter
  ) {
    setPrevSearch({ searchQuery, selectedCategory, stockFilter });
    setProductsPage(1);
  }

  const totalProductsPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const paginatedProducts = React.useMemo(() => {
    return filteredProducts.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);
  }, [filteredProducts, productsPage, productsPerPage]);

  return (
    <>
      {/* METRICAS */}
      <InventoryMetrics
        totalProductsCount={totalProductsCount}
        totalInvestment={totalInvestment}
        expectedProfit={expectedProfit}
        lowStockCount={lowStockCount}
      />

      {/* FILTROS + CATEGORÍAS VISUALES + ACCIONES */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] w-full">
        {/* BUSCADOR PRINCIPAL + CHIPS DE ESTADO DE STOCK */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código de barras o categoría..."
              className="pl-10 h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-semibold focus-visible:ring-indigo-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border",
                stockFilter === 'ALL'
                  ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-800 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              )}
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('CRITICAL')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5",
                stockFilter === 'CRITICAL'
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100"
              )}
            >
              <AlertTriangle className="h-3 w-3" /> Stock Bajo ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5",
                stockFilter === 'OUT_OF_STOCK'
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100"
              )}
            >
              Agotados
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN VISUAL DE CATEGORÍAS (PILLS DE 1 TOQUE) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1.5",
              selectedCategory === ''
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <span>TODAS</span>
            <span className={cn("text-[9px] px-1.5 py-0.2 rounded-full font-extrabold", selectedCategory === '' ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>
              {totalProductsCount}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = filteredProducts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1.5",
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={cn("text-[9px] px-1.5 py-0.2 rounded-full font-extrabold", isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* FILA INFERIOR: BOTÓN NUEVO PRODUCTO */}
        {(role === 'ADMIN' || role === 'GERENTE') && (
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow px-6 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            onClick={handleOpenAdd}
          >
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        )}
      </div>

      {/* TABLA CATÁLOGO */}
      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </span>
          
          <div className="flex items-center gap-2">
            {(role === 'ADMIN' || role === 'GERENTE') && onOpenCategoryManager && (
              <Button
                className="h-8 text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-indigo-650 dark:text-indigo-400 rounded-lg gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs px-3"
                onClick={onOpenCategoryManager}
              >
                <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Categorías
              </Button>
            )}
            {(role === 'ADMIN' || role === 'GERENTE') && (
              <Button
                className="h-8 text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs px-3"
                onClick={() => setIsImportOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Importar CSV
              </Button>
            )}
            <Button
              className="h-8 text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs px-3"
              onClick={handleExportCSV}
            >
              <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Exportar CSV
            </Button>
          </div>

        </div>
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-4.5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="w-full overflow-x-auto scrollbar-none">
            <Table className="min-w-[600px] sm:min-w-full">

            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b">
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    className="accent-indigo-650 h-4 w-4 rounded cursor-pointer"
                    checked={areAllFilteredSelected}
                    onChange={() => toggleSelectAllProducts(filteredProducts)}
                  />
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-500 min-w-[140px]">Producto</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 w-36">Stock</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Venta</TableHead>
                {(role === 'ADMIN' || role === 'GERENTE') && (
                  <>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24 hidden sm:table-cell">Compra</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-20 hidden sm:table-cell">Margen</TableHead>
                  </>
                )}
                <TableHead className="w-44 min-w-[170px] text-center text-xs font-bold text-slate-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {paginatedProducts.map((p) => {
                const isCritical = p.stock <= p.minStock;
                const isOut = p.stock === 0;
                
                const margin = p.sellPrice > 0 
                  ? ((p.sellPrice - p.purchasePrice) / p.sellPrice) * 100 
                  : 0;

                const isSelected = selectedProductIds.includes(p.id);

                return (
                  <TableRow
                    key={p.id}
                    className={cn(
                      "hover:bg-slate-50/20 border-b transition-all border-l-4",
                      isOut 
                        ? "bg-rose-50/40 dark:bg-rose-950/15 border-l-rose-500 text-rose-950 dark:text-rose-250" 
                        : isCritical 
                        ? "bg-amber-50/40 dark:bg-amber-950/15 border-l-amber-500 text-amber-950 dark:text-amber-250" 
                        : "border-l-transparent",
                      isSelected && "bg-indigo-50/30 dark:bg-indigo-950/10"
                    )}
                  >
                    <TableCell className="text-center py-3">
                      <input
                        type="checkbox"
                        className="accent-indigo-650 h-4 w-4 rounded cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(p.id)}
                      />
                    </TableCell>

                    <TableCell className="py-3">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.barcode && (
                            <span className="text-[9px] text-slate-450 dark:text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                              <Barcode className="h-3 w-3" /> {p.barcode}
                            </span>
                          )}
                          {p.barcodes && p.barcodes.length > 0 && (
                            <span
                              title={`Códigos adicionales: ${p.barcodes.map(b => b.barcode + (b.label ? ` (${b.label})` : '')).join(', ')}`}
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 cursor-help"
                            >
                              +{p.barcodes.length} cód.
                            </span>
                          )}
                          {p.category && (
                            <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-955/40 text-indigo-650 dark:text-indigo-300 font-bold border border-indigo-100/50 dark:border-indigo-900/30">
                              {p.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* CELDA DE STOCK CON EDICIÓN RÁPIDA E INCREMENTOS */}
                    <TableCell className="text-right py-2">
                      <div className="flex flex-col items-end gap-1">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="any"
                              autoFocus
                              className="h-7 w-16 text-xs font-black text-right p-1 rounded-lg"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDirectStock(p);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                              onClick={() => handleSaveDirectStock(p)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            title="Clic para editar existencia"
                            onClick={() => {
                              setEditingStockId(p.id);
                              setTempStockValue(String(p.stock));
                            }}
                            className={cn(
                              "font-black text-xs px-2 py-0.5 rounded-lg transition-all cursor-pointer border hover:scale-105",
                              isOut
                                ? "bg-rose-100 dark:bg-rose-955/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60"
                                : isCritical
                                ? "bg-amber-100 dark:bg-amber-955/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/60"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            {p.stock} {p.unitType === 'WEIGHT' ? 'kg' : ''}
                          </button>
                        )}

                        {/* Botones de incremento rápido (+1, +5, +10) */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={inlineStockLoadingId === p.id}
                            onClick={() => handleQuickStockIncrement(p, 1)}
                            className="h-5 px-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-[10px] font-black rounded text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-90"
                            title="Sumar 1 pieza"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            disabled={inlineStockLoadingId === p.id}
                            onClick={() => handleQuickStockIncrement(p, 5)}
                            className="h-5 px-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-[10px] font-black rounded text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-90"
                            title="Sumar 5 piezas"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            disabled={inlineStockLoadingId === p.id}
                            onClick={() => handleQuickStockIncrement(p, 10)}
                            className="h-5 px-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-[10px] font-black rounded text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-90"
                            title="Sumar 10 piezas"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </TableCell>

                    {/* CELDA DE PRECIO DE VENTA CON EDICIÓN DIRECTA */}
                    <TableCell className="text-right text-slate-805 dark:text-slate-100 font-black text-xs py-2">
                      {editingPriceId === p.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="any"
                            autoFocus
                            className="h-7 w-20 text-xs font-black text-right p-1 rounded-lg"
                            value={tempPriceValue}
                            onChange={(e) => setTempPriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveDirectPrice(p);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                            onClick={() => handleSaveDirectPrice(p)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Clic para editar precio de venta"
                          onClick={() => {
                            setEditingPriceId(p.id);
                            setTempPriceValue(String(p.sellPrice));
                          }}
                          className="px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-black transition-all cursor-pointer"
                        >
                          ${p.sellPrice.toFixed(2)}
                        </button>
                      )}
                    </TableCell>

                    {(role === 'ADMIN' || role === 'GERENTE') && (
                      <>
                        <TableCell className="text-right text-slate-400 text-xs hidden sm:table-cell">
                          ${p.purchasePrice.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-emerald-500 font-bold text-xs hidden sm:table-cell">
                          {margin.toFixed(0)}%
                        </TableCell>
                      </>
                    )}

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                          onClick={() => handleOpenMovements(p)}
                          title="Ver bitácora de stock"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"
                          onClick={() => handleOpenWaste(p)}
                          title="Registrar Merma o Consumo Interno"
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5" />
                        </Button>
                        {(role === 'ADMIN' || role === 'GERENTE') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg"
                              onClick={() => handleOpenDuplicate(p)}
                              title="Duplicar producto"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                              onClick={() => handleOpenEdit(p)}
                              title="Editar producto"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 rounded-lg"
                              onClick={() => handleOpenDelete(p)}
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* CONTROLES DE PAGINACIÓN ADAPTABLES PARA MÓVIL */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-xs">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-slate-500 font-bold">Mostrar:</span>
                <CustomSelect
                  className="w-20 h-8 text-xs font-bold"
                  value={String(productsPerPage)}
                  onChange={(val) => {
                    setProductsPerPage(Number(val));
                    setProductsPage(1);
                  }}
                  options={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                />
              </div>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap text-right">
                Mostrando {filteredProducts.length > 0 ? (productsPage - 1) * productsPerPage + 1 : 0} - {Math.min(productsPage * productsPerPage, filteredProducts.length)} de {filteredProducts.length}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                disabled={productsPage <= 1}
                onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="px-2 font-black text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                Página {productsPage} de {totalProductsPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer"
                disabled={productsPage >= totalProductsPages}
                onClick={() => setProductsPage((p) => Math.min(totalProductsPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
        ) : (

          <div className="py-20 text-center text-slate-400 text-xs">
            No se encontraron productos en el inventario.
          </div>
        )}
      </div>
    </>
  );
}
