'use client';

import React from 'react';
import { Search, Plus, Edit3, Trash2, Barcode, Upload, Download, History, UtensilsCrossed, Copy, AlertTriangle, Layers } from 'lucide-react';
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

      {/* FILTROS + ACCIONES */}
      <div className="flex flex-col gap-2.5 bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] w-full">
        {/* FILA SUPERIOR: BUSCADOR + CATEGORÍAS + STOCK */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar producto o código..."
              className="pl-10 h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-semibold focus-visible:ring-indigo-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex shrink-0">
            <CustomSelect
              className="w-full sm:w-36 md:w-40 h-10"
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Categorías"
              options={[
                { value: '', label: 'Categorías' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />

            <CustomSelect
              className="w-full sm:w-36 md:w-40 h-10"
              value={stockFilter}
              onChange={(val) => setStockFilter(val as 'ALL' | 'CRITICAL' | 'OUT_OF_STOCK')}
              options={[
                { value: 'ALL', label: 'Todo el Stock' },
                { value: 'CRITICAL', label: 'Stock Bajo' },
                { value: 'OUT_OF_STOCK', label: 'Agotados' },
              ]}
            />
          </div>
        </div>

        {/* FILA INFERIOR: BOTÓN NUEVO PRODUCTO (ANCHO COMPLETO 100%) */}
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
                <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Stock</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Venta</TableHead>
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
                        <div className="flex items-center gap-2 mt-1">
                          {p.barcode && (
                            <span className="text-[9px] text-slate-450 dark:text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                              <Barcode className="h-3 w-3" /> {p.barcode}
                            </span>
                          )}
                          {p.category && (
                            <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-300 font-bold border border-indigo-100/50 dark:border-indigo-900/30">
                              {p.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-bold text-xs">
                      <span className={cn(
                        isOut ? 'text-rose-600 dark:text-rose-400 font-black' 
                        : isCritical ? 'text-amber-600 dark:text-amber-400 font-black' 
                        : 'text-slate-700 dark:text-slate-200'
                      )}>
                        {p.stock}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-slate-805 dark:text-slate-100 font-black text-xs">
                      <span className="px-1 py-0.5 text-slate-800 dark:text-slate-100">
                        ${p.sellPrice.toFixed(2)}
                      </span>
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
