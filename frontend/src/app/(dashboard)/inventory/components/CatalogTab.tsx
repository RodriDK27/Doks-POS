'use client';

import React from 'react';
import { Search, Plus, Upload, Download, AlertTriangle, Check, Zap, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Product, UNCATEGORIZED } from '../types';
import { formatQty, getStockStatus, matchesCategory, STATUS_RANK, StockStatus } from '../utils/stockStatus';
import { BARCODE_INPUT_ATTR, useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { InventoryMetrics } from './InventoryMetrics';
import { CategoryPicker } from './CategoryPicker';
import { ProductRow } from './ProductRow';
import { QuickAddProductBar } from './QuickAddProductBar';
import { ActionMenu } from './ActionMenu';

type StockFilter = 'ALL' | 'CRITICAL' | 'OUT_OF_STOCK';

interface CatalogTabProps {
  /** Catálogo completo (sin filtros): base de los contadores por categoría. */
  products: Product[];
  totalProductsCount: number;
  totalInvestment: number;
  expectedProfit: number;
  lowStockCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  categories: string[];
  filteredProducts: Product[];
  loading: boolean;
  selectedProductIds: string[];
  areAllFilteredSelected: boolean;
  toggleSelectProduct: (id: string) => void;
  toggleSelectAllProducts: (products: Product[]) => void;
  handleOpenAdd: (category?: string) => void;
  setIsImportOpen: (open: boolean) => void;
  handleExportCSV: () => void;
  handleOpenMovements: (product: Product) => void;
  handleOpenWaste: (product: Product) => void;
  handleOpenDuplicate: (product: Product) => void;
  handleOpenEdit: (product: Product) => void;
  handleOpenDelete: (product: Product) => void;
  onOpenCategoryManager?: () => void;
  /** Controlado por la página para poder ocultar el botón flotante mientras se captura */
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

const SECTION_META: Record<StockStatus, { label: string; dot: string; text: string }> = {
  OUT: { label: 'Agotados', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  LOW: { label: 'Stock bajo', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  OK: { label: 'Con existencias', dot: 'bg-emerald-500', text: 'text-slate-500 dark:text-slate-400' },
};

const LIST = 'grid grid-cols-1 gap-1.5 items-start';

/** El botón ⚡ Agregar (alta rápida) está oculto por ahora; poner en true para volver a mostrarlo. */
const SHOW_QUICK_ADD_BUTTON = false;

export function CatalogTab({
  products,
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
  quickAddOpen,
  setQuickAddOpen,
}: CatalogTabProps) {
  const { role } = useAuthStore();
  const canManage = role === 'ADMIN' || role === 'GERENTE';

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  // Solo una fila desplegada a la vez: mantiene la lista corta y fácil de recorrer
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Volver a la página 1 cuando cambia cualquier filtro (patrón de "estado derivado" en render)
  const filterKey = `${searchQuery}|${selectedCategory}|${stockFilter}|${perPage}`;
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
    setExpandedId(null);
  }

  const isAllCategories = selectedCategory === '';
  const scopeTitle = isAllCategories
    ? 'Todos los productos'
    : selectedCategory === UNCATEGORIZED
      ? 'Sin categoría'
      : selectedCategory;
  const realCategory = isAllCategories || selectedCategory === UNCATEGORIZED ? undefined : selectedCategory;

  // Resumen de la categoría activa, sin importar búsqueda ni filtro de stock
  const scope = React.useMemo(() => {
    let out = 0;
    let low = 0;
    let total = 0;
    for (const p of products) {
      if (!matchesCategory(p, selectedCategory)) continue;
      total += 1;
      const status = getStockStatus(p);
      if (status === 'OUT') out += 1;
      else if (status === 'LOW') low += 1;
    }
    return { total, out, low };
  }, [products, selectedCategory]);

  // Lo urgente primero: agotados, luego stock bajo, luego el resto; alfabético dentro de cada grupo
  const sortedProducts = React.useMemo(
    () =>
      [...filteredProducts].sort(
        (a, b) =>
          STATUS_RANK[getStockStatus(a)] - STATUS_RANK[getStockStatus(b)] ||
          a.name.localeCompare(b.name, 'es')
      ),
    [filteredProducts]
  );

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = React.useMemo(
    () => sortedProducts.slice((currentPage - 1) * perPage, currentPage * perPage),
    [sortedProducts, currentPage, perPage]
  );

  const sections = React.useMemo(() => {
    const order: StockStatus[] = ['OUT', 'LOW', 'OK'];
    return order
      .map((status) => ({
        status,
        items: pageProducts.filter((p) => getStockStatus(p) === status),
        total: sortedProducts.filter((p) => getStockStatus(p) === status).length,
      }))
      .filter((section) => section.items.length > 0);
  }, [pageProducts, sortedProducts]);

  // Los encabezados solo aportan si la lista mezcla estados
  const showSectionHeaders =
    stockFilter === 'ALL' &&
    sortedProducts.length > 0 &&
    sortedProducts.some((p) => getStockStatus(p) !== getStockStatus(sortedProducts[0]));

  const selectedSet = React.useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  const stockChips: Array<{ key: StockFilter; label: string; count: number; active: string; idle: string }> = [
    {
      key: 'ALL',
      label: 'Todos',
      count: scope.total,
      active: 'bg-slate-500/15 dark:bg-slate-400/15 text-slate-800 dark:text-slate-100 border-slate-500/50 dark:border-slate-400/50',
      idle: 'bg-slate-500/5 dark:bg-slate-400/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-500/10 dark:hover:bg-slate-400/10',
    },
    {
      key: 'CRITICAL',
      label: 'Bajo',
      count: scope.low,
      active: 'bg-amber-500 text-white border-amber-500',
      idle: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-950/40',
    },
    {
      key: 'OUT_OF_STOCK',
      label: 'Agotados',
      count: scope.out,
      active: 'bg-rose-600 text-white border-rose-600',
      idle: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/40',
    },
  ];

  const hasActiveFilters = searchQuery.trim() !== '' || stockFilter !== 'ALL';

  // Lector de código de barras: busca el producto sin importar dónde esté el foco ni qué filtro haya
  useBarcodeScanner((code) => {
    setSelectedCategory('');
    setStockFilter('ALL');
    setSearchQuery(code);
    setExpandedId(null);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });

    const match = products.find((p) => p.barcode === code || p.barcodes?.some((b) => b.barcode === code));
    if (match) {
      toast.success(`${match.name} · ${formatQty(match.stock, match.unitType === 'WEIGHT')} en existencia`, { id: 'barcode-scan' });
    } else {
      toast.error(`El código ${code} no está registrado.`, { id: 'barcode-scan' });
    }
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="space-y-3 min-w-0">
        {/* UN SOLO CARD: categoría, búsqueda y acciones, filtros de stock y resumen plegable */}
        <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
          <CategoryPicker
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            onManage={canManage ? onOpenCategoryManager : undefined}
          />

          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={isAllCategories ? 'Buscar o escanear código...' : `Buscar en ${scopeTitle}...`}
                {...{ [BARCODE_INPUT_ATTR]: '' }}
                className="pl-10 pr-10 h-12 border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 rounded-xl text-xs font-semibold focus-visible:ring-indigo-500 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {canManage && SHOW_QUICK_ADD_BUTTON && (
              <Button
                type="button"
                aria-label={quickAddOpen ? 'Cerrar alta rápida' : 'Agregar productos'}
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className={cn(
                  'h-12 w-12 p-0 sm:w-auto sm:px-4 shrink-0 rounded-xl font-black text-xs gap-1.5 active:scale-95 transition-all cursor-pointer',
                  quickAddOpen
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-950'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                )}
              >
                {quickAddOpen ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                <span className="hidden sm:inline">{quickAddOpen ? 'Cerrar' : 'Agregar'}</span>
              </Button>
            )}
            <ActionMenu
              items={[
                {
                  label: 'Formulario completo',
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => handleOpenAdd(realCategory),
                  hidden: !canManage,
                },
                {
                  label: 'Importar CSV',
                  icon: <Upload className="h-4 w-4" />,
                  onClick: () => setIsImportOpen(true),
                  hidden: !canManage,
                },
                {
                  label: 'Exportar CSV',
                  icon: <Download className="h-4 w-4" />,
                  onClick: handleExportCSV,
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {stockChips.map((chip) => {
              const isActive = stockFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setStockFilter(chip.key)}
                  className={cn(
                    'h-10 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95',
                    isActive ? cn(chip.active, 'shadow-xs') : chip.idle
                  )}
                >
                  {chip.key === 'CRITICAL' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {chip.label}
                  <span
                    className={cn(
                      'text-[10px] px-1.5 rounded-full font-extrabold tabular-nums',
                      isActive ? 'bg-white/25' : 'bg-black/5 dark:bg-white/10'
                    )}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          <InventoryMetrics
            totalProductsCount={totalProductsCount}
            totalInvestment={totalInvestment}
            expectedProfit={expectedProfit}
            lowStockCount={lowStockCount}
          />
        </div>

        {/* ALTA RÁPIDA */}
        {canManage && quickAddOpen && (
          <QuickAddProductBar
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onClose={() => setQuickAddOpen(false)}
          />
        )}

        {/* LISTA */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 px-1 text-[11px] font-bold text-slate-500 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              className="accent-indigo-650 h-4 w-4 rounded cursor-pointer"
              checked={areAllFilteredSelected}
              disabled={filteredProducts.length === 0}
              onChange={() => toggleSelectAllProducts(filteredProducts)}
            />
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            {selectedProductIds.length > 0 && (
              <span className="text-indigo-600 dark:text-indigo-400">· {selectedProductIds.length} con etiqueta</span>
            )}
          </label>

          {loading ? (
            <div className={LIST}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-14 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 flex items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              {sections.map((section) => {
                const meta = SECTION_META[section.status];
                return (
                  <section key={section.status} className="space-y-1.5">
                    {showSectionHeaders && (
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                        <h3 className={cn('text-[11px] font-black uppercase tracking-wider', meta.text)}>{meta.label}</h3>
                        <span className="text-[10px] font-extrabold text-slate-400 tabular-nums">{section.total}</span>
                        <span className="flex-1 h-px bg-slate-200/70 dark:bg-slate-800" />
                      </div>
                    )}
                    <div className={LIST}>
                      {section.items.map((p) => (
                        <ProductRow
                          key={p.id}
                          product={p}
                          expanded={expandedId === p.id}
                          selected={selectedSet.has(p.id)}
                          canManage={canManage}
                          showCategory={isAllCategories}
                          onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
                          onToggleSelect={toggleSelectProduct}
                          onOpenMovements={handleOpenMovements}
                          onOpenWaste={handleOpenWaste}
                          onOpenDuplicate={handleOpenDuplicate}
                          onOpenEdit={handleOpenEdit}
                          onOpenDelete={handleOpenDelete}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* PAGINACIÓN */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 text-xs">
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-500 font-bold">Mostrar:</span>
                    <CustomSelect
                      className="w-20 h-9 text-xs font-bold"
                      menuPlacement="top"
                      value={String(perPage)}
                      onChange={(val) => setPerPage(Number(val))}
                      options={[
                        { value: '25', label: '25' },
                        { value: '50', label: '50' },
                        { value: '100', label: '100' },
                      ]}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap text-right">
                    {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, sortedProducts.length)} de {sortedProducts.length}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-xs font-bold rounded-xl cursor-pointer"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setPage(currentPage - 1);
                      setExpandedId(null);
                    }}
                  >
                    Anterior
                  </Button>
                  <span className="px-1 font-black text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-xs font-bold rounded-xl cursor-pointer"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setPage(currentPage + 1);
                      setExpandedId(null);
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 px-4 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              {stockFilter === 'OUT_OF_STOCK' && !searchQuery.trim() && scope.total > 0 ? (
                <>
                  <span className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">Sin agotados en {scopeTitle}</p>
                  <p className="text-xs text-slate-400">Todo lo de esta vista tiene existencias.</p>
                </>
              ) : scope.total === 0 ? (
                <>
                  <span className="h-11 w-11 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                    <Package className="h-5 w-5 text-indigo-500" />
                  </span>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                    {isAllCategories ? 'Aún no hay productos en el inventario' : `${scopeTitle} todavía no tiene productos`}
                  </p>
                  {canManage && (
                    <Button
                      type="button"
                      onClick={() => setQuickAddOpen(true)}
                      className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs gap-1.5 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5" /> Agregar el primero
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">Sin resultados</p>
                  <p className="text-xs text-slate-400">Ningún producto coincide con los filtros actuales.</p>
                </>
              )}
              {hasActiveFilters && scope.total > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4 text-xs font-bold rounded-xl cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setStockFilter('ALL');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
