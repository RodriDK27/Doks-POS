'use client';

import React from 'react';
import PinLockGuard from '@/components/PinLockGuard';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Barcode, 
  Truck, 
  Phone, 
  FileText, 
  Eye,
  Download,
  Upload,
  History,
  Copy,
  Printer,
  CheckSquare,
  Star,
  TrendingDown,
  Inbox,
  Calendar,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';

import { useInventory } from './hooks/useInventory';
import { InventoryMetrics } from './components/InventoryMetrics';
import { ProductFormDialog } from './components/ProductFormDialog';
import { SupplierFormDialog } from './components/SupplierFormDialog';
import { ImportCSVModal } from './components/ImportCSVModal';
import { StockMovementsDrawer } from './components/StockMovementsDrawer';
import { BarcodeLabelsModal } from './components/BarcodeLabelsModal';
import { RequestedProductsTab } from './components/RequestedProductsTab';
import dynamic from 'next/dynamic';

const PurchaseDialog = dynamic(() => import('./components/PurchaseDialog').then(mod => mod.PurchaseDialog), {
  ssr: false,
});

const PurchaseDetailsDialog = dynamic(() => import('./components/PurchaseDetailsDialog').then(mod => mod.PurchaseDetailsDialog), {
  ssr: false,
});

export default function InventoryPage() {
  const {
    activeTab,
    setActiveTab,
    products,
    categories,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    isDeleteOpen,
    setIsDeleteOpen,
    productToDelete,
    barcodeInputRef,
    suppliers,
    purchases,
    suppliersLoading,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierForm,
    setSupplierForm,
    isPurchaseOpen,
    setIsPurchaseOpen,
    selectedSupplierForPurchase,
    purchaseNotes,
    setPurchaseNotes,
    payFromRegister,
    setPayFromRegister,
    addedPurchaseItems,
    newPurchaseItem,
    setNewPurchaseItem,
    isDetailOpen,
    setIsDetailOpen,
    activePurchaseDetail,
    setActivePurchaseDetail,
    totalProductsCount,
    totalInvestment,
    expectedProfit,
    lowStockCount,
    filteredProducts,
    handleOpenAdd,
    handleOpenEdit,
    handleFormSubmit,
    handleOpenDelete,
    handleDeleteSubmit,
    handleSupplierSubmit,
    handleOpenEditSupplier,
    handleToggleActiveSupplier,
    editingSupplierId,
    setEditingSupplierId,
    handleOpenRegisterPurchase,
    handleAddPurchaseItem,
    handleRemovePurchaseItemIndex,
    handlePurchaseSubmit,
    totalInvoiceSum,
    // Import / Export
    isImportOpen,
    setIsImportOpen,
    handleImportCSV,
    handleExportCSV,
    // Bitácora
    isMovementsOpen,
    setIsMovementsOpen,
    activeMovementsProduct,
    movements,
    movementsLoading,
    handleOpenMovements,
    // Duplicar producto
    handleOpenDuplicate,
    // Selección e impresión de etiquetas
    selectedProductIds,
    setSelectedProductIds,
    toggleSelectProduct,
    toggleSelectAllProducts,
    isLabelsOpen,
    setIsLabelsOpen,
    // Analíticas
    analytics,
    analyticsLoading,
  } = useInventory();

  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => new Date().toISOString().substring(0, 7));

  const uniqueMonths = React.useMemo(() => {
    const months = Array.from(
      new Set(purchases.map((p) => p.createdAt.substring(0, 7)))
    );
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    if (!months.includes(currentMonthStr)) {
      months.unshift(currentMonthStr);
    }
    return months.sort().reverse();
  }, [purchases]);

  const filteredPurchases = React.useMemo(() => {
    return purchases.filter((p) => p.createdAt.startsWith(selectedMonth));
  }, [purchases, selectedMonth]);

  const totalSpent = React.useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  }, [filteredPurchases]);

  // Filtrar productos seleccionados
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const areAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id));

  return (
    <PinLockGuard>
      <div className="space-y-6 w-full pb-20 relative">
        
        {/* HEADER PRINCIPAL Y TABS SELECTOR INLINE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
              Módulo Administrativo
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inventario de Tienda</h1>
          </div>

          {/* Selector de Pestañas Tipo SaaS */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0 border border-slate-200/40 dark:border-slate-800/40 self-start sm:self-center">
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-4 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none",
                activeTab === 'CATALOG' 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('CATALOG')}
            >
              <Package className="h-4 w-4" /> Catálogo
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-4 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none",
                activeTab === 'SUPPLIERS' 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('SUPPLIERS')}
            >
              <Truck className="h-4 w-4" /> Proveedores y Compras
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-4 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none",
                activeTab === 'REQUESTED' 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('REQUESTED')}
            >
              <FileText className="h-4 w-4" /> Solicitudes Especiales
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-4 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none",
                activeTab === 'ANALYTICS' 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('ANALYTICS')}
            >
              <Star className="h-4 w-4" /> Rendimiento
            </Button>
          </div>
        </div>

        {activeTab === 'CATALOG' ? (
          <>
            {/* METRICAS */}
            <InventoryMetrics
              totalProductsCount={totalProductsCount}
              totalInvestment={totalInvestment}
              expectedProfit={expectedProfit}
              lowStockCount={lowStockCount}
            />

            {/* FILTROS + ACCIONES */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              
              {/* Lado izquierdo: buscador y selectores */}
              <div className="flex flex-col sm:flex-row gap-2 flex-grow items-stretch sm:items-center">
                <div className="relative w-full sm:w-[240px] md:w-[280px] lg:w-[320px] xl:w-[360px] shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar producto o código..."
                    className="pl-10 h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-semibold focus-visible:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex shrink-0">
                  <CustomSelect
                    className="w-full sm:w-36 h-10"
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="Categorías"
                    options={[
                      { value: '', label: 'Categorías' },
                      ...categories.map((c) => ({ value: c, label: c })),
                    ]}
                  />

                  <CustomSelect
                    className="w-full sm:w-36 h-10"
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

              {/* Lado derecho: botón de agregar producto */}
              <div className="shrink-0">
                <Button 
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow px-5 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  onClick={handleOpenAdd}
                >
                  <Plus className="h-4 w-4" /> Nuevo Producto
                </Button>
              </div>
            </div>

            {/* TABLA CATÁLOGO */}
            <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
              {/* Barra de utilidades de tabla */}
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-500">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    className="h-8 text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs px-3"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Importar CSV
                  </Button>
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
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b">
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          className="accent-indigo-650 h-4.5 w-4.5 rounded cursor-pointer"
                          checked={areAllFilteredSelected}
                          onChange={() => toggleSelectAllProducts(filteredProducts)}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-28">
                        Stock
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-28">
                        Venta
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-24 hidden sm:table-cell">Compra</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-20 hidden sm:table-cell">Margen</TableHead>
                      <TableHead className="w-36 text-center text-xs font-bold text-slate-500">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredProducts.map((p) => {
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
                                  <span className="text-[9px] text-slate-450 dark:text-slate-400 font-mono flex items-center gap-0.5">
                                    <Barcode className="h-3 w-3" /> {p.barcode}
                                  </span>
                                )}
                                {p.category && (
                                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-none">
                                    {p.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                           {/* STOCK */}
                           <TableCell className="text-right font-bold text-xs">
                             <span className={cn(
                               isOut ? 'text-rose-600 dark:text-rose-400 font-black' 
                               : isCritical ? 'text-amber-600 dark:text-amber-400 font-black' 
                               : 'text-slate-700 dark:text-slate-200'
                             )}>
                               {p.stock}
                             </span>
                           </TableCell>
 
                           {/* PRECIO VENTA */}
                           <TableCell className="text-right text-slate-805 dark:text-slate-100 font-black text-xs">
                             <span className="px-1 py-0.5 text-slate-800 dark:text-slate-100">
                               ${p.sellPrice.toFixed(2)}
                             </span>
                           </TableCell>

                          <TableCell className="text-right text-slate-400 text-xs hidden sm:table-cell">
                            ${p.purchasePrice.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-emerald-500 font-bold text-xs hidden sm:table-cell">
                            {margin.toFixed(0)}%
                          </TableCell>

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
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No se encontraron productos en el inventario.
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'REQUESTED' ? (
          <div className="space-y-6 animate-in fade-in duration-300 w-full">
            <RequestedProductsTab />
          </div>
        ) : activeTab === 'SUPPLIERS' ? (
          <div className="space-y-8 animate-in fade-in duration-300 w-full">
            {/* 1. SECCIÓN DE PROVEEDORES */}
            <div className="space-y-3 w-full">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-indigo-650" /> Directorio de Proveedores
                </h3>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setIsSupplierOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Registrar Proveedor
                </Button>
              </div>

              <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden w-full">
                {suppliersLoading ? (
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-7 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : suppliers.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[220px]">Nombre / Marca</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs w-[140px]">Teléfono</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs">Dirección / Notas</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center w-[100px]">Compras</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right w-[180px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {suppliers.map((supplier) => (
                        <TableRow 
                          key={supplier.id} 
                            className={cn(
                              "hover:bg-slate-50/20 border-b transition-all",
                              supplier.isActive === false && "opacity-60 bg-slate-50/30 dark:bg-slate-950/20"
                            )}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{supplier.name}</span>
                                {supplier.isActive === false && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded uppercase tracking-wider">Inactivo</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                              {supplier.phone || <span className="text-slate-350 dark:text-slate-600 italic">Sin teléfono</span>}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-slate-500 dark:text-slate-400">
                              {supplier.address || <span className="text-slate-300 dark:text-slate-700 italic">-</span>}
                            </TableCell>
                            <TableCell className="py-3 text-center text-xs text-slate-600 dark:text-slate-300 font-black">
                              {supplier._count?.purchases || 0}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {supplier.isActive !== false && (
                                  <Button 
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-7 px-3.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                                    onClick={() => handleOpenRegisterPurchase(supplier)}
                                  >
                                    Comprar
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                  onClick={() => handleOpenEditSupplier(supplier)}
                                  title="Editar"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-7 w-7 rounded-lg cursor-pointer",
                                    supplier.isActive === false
                                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                                      : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                                  )}
                                  onClick={() => handleToggleActiveSupplier(supplier)}
                                  title={supplier.isActive === false ? 'Activar' : 'Desactivar'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 w-full">
                    No hay proveedores registrados.
                  </div>
                )}
              </div>
            </div>

            {/* 2. AGENDA SEMANAL DE PROVEEDORES */}
            <div className="space-y-3 w-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-650" /> Agenda Semanal de Visitas y Entregas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                  const activeSuppliers = suppliers.filter(s => s.isActive !== false);
                  const orderSuppliers = activeSuppliers.filter(s => (s.orderDays || '').split(',').includes(day));
                  const deliverySuppliers = activeSuppliers.filter(s => (s.deliveryDays || '').split(',').includes(day));
                  const hasVisits = orderSuppliers.length > 0 || deliverySuppliers.length > 0;

                  return (
                    <div 
                      key={day} 
                      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between min-h-[160px] max-h-[160px]"
                    >
                      <div className="flex flex-col h-full overflow-hidden">
                        {/* Cabecera del Día */}
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 shrink-0">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">{day}</span>
                          {hasVisits && (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                        </div>

                        {/* Listado de visitas */}
                        <div className="flex-grow overflow-y-auto scrollbar-thin max-h-[105px] pr-0.5 space-y-1.5">
                          {hasVisits ? (
                            <>
                              {/* Pedidos */}
                              {orderSuppliers.map(s => (
                                <div key={`order-${s.id}`} className="flex items-center justify-between gap-1 p-1 bg-indigo-50/50 dark:bg-indigo-950/20 rounded border border-indigo-100/40 dark:border-indigo-900/40">
                                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                                  <span className="text-[8px] font-extrabold uppercase px-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded shrink-0">Pedido</span>
                                </div>
                              ))}

                              {/* Entregas */}
                              {deliverySuppliers.map(s => (
                                <div key={`delivery-${s.id}`} className="flex items-center justify-between gap-1 p-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-100/40 dark:border-emerald-900/40">
                                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                                  <span className="text-[8px] font-extrabold uppercase px-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded shrink-0">Entrega</span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 italic py-4 text-center">
                              Sin visitas
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SECCIÓN DE BITÁCORA DE COMPRAS (TABLA A ANCHO COMPLETO) */}
            <div className="space-y-3 w-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-650" /> Bitácora de Compras Realizadas
              </h3>
              <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden w-full">
                
                {/* Cabecera con Filtro de Mes y Gasto Total */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/40 p-4 bg-slate-50/30 dark:bg-slate-900/20">
                  <div className="flex items-center gap-3">
                    <CustomSelect
                      className="w-44 h-8 text-[11px] font-bold"
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      options={uniqueMonths.map((m) => {
                        const [year, month] = m.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                        const monthName = date.toLocaleString('es-ES', { month: 'long' });
                        return {
                          value: m,
                          label: monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year,
                        };
                      })}
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Total gastado en el mes</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {suppliersLoading ? (
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <Skeleton className="h-4.5 w-32" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-10 rounded-md" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : filteredPurchases.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                      <TableRow className="border-none">
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pl-5">Proveedor</TableHead>
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5">Fecha y Hora</TableHead>
                        <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 w-32 text-center">Caja Chica</TableHead>
                        <TableHead className="text-right text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 w-36">Total Compra</TableHead>
                        <TableHead className="w-28 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3.5 pr-5">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id} className="hover:bg-slate-50/20 border-b border-slate-100 dark:border-slate-800">
                          <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-200 pl-5">{purchase.supplier.name}</TableCell>
                          <TableCell className="text-slate-455 dark:text-slate-400 text-xs">
                            {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={purchase.payFromRegister ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[8px] px-1.5' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-none font-bold text-[8px] px-1.5'}>
                              {purchase.payFromRegister ? 'SÍ' : 'NO'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-808 dark:text-slate-100 text-xs">
                            ${purchase.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center pr-5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 px-2 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer"
                              onClick={() => {
                                setActivePurchaseDetail(purchase);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" /> Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    No se han registrado compras en este mes.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* C. VISTA DE ANALÍTICAS / RENDIMIENTO DE PRODUCTOS */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PRODUCTOS DE MAYOR VENTA (MÁS VENDIDOS) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-905/30 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-100/50 dark:border-slate-900/30">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Productos de Mayor Venta</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Top 10 Artículos con mayores ventas registradas</p>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <Skeleton className="h-4.5 w-40" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : analytics?.topSelling && analytics.topSelling.length > 0 ? (
                  <div className="overflow-x-auto w-full">
                    <Table>
                      <TableHeader className="bg-slate-50/20">
                        <TableRow className="border-b">
                          <TableHead className="text-xs font-bold text-slate-500 py-3">Producto</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Vendidos</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-500 w-32">Ingresos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y">
                        {analytics.topSelling.map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                            <TableCell className="py-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                              <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">{p.category || 'Sin Categoría'}</span>
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-800 dark:text-slate-200 text-xs">
                              {p.quantitySold} unidades
                            </TableCell>
                            <TableCell className="text-right font-extrabold text-emerald-500 text-xs">
                              ${p.totalRevenue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-slate-350" />
                    <span>Aún no hay ventas registradas para computar estadísticas.</span>
                  </div>
                )}
              </div>

              {/* PRODUCTOS DE LENTO MOVIMIENTO (MENOS VENDIDOS) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-905/30 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-100/50 dark:border-slate-900/30">
                    <TrendingDown className="h-5 w-5 text-slate-550 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Productos de Lento Movimiento</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Artículos con bajas o nulas ventas que tienen stock retenido</p>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <Skeleton className="h-4.5 w-40" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : analytics?.slowMoving && analytics.slowMoving.length > 0 ? (
                  <div className="overflow-x-auto w-full">
                    <Table>
                      <TableHeader className="bg-slate-50/20">
                        <TableRow className="border-b">
                          <TableHead className="text-xs font-bold text-slate-500 py-3">Producto</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Vendidos</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Stock Actual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y">
                        {analytics.slowMoving.map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                            <TableCell className="py-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                              <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">{p.category || 'Sin Categoría'}</span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-550 dark:text-slate-400 text-xs">
                              {p.quantitySold} uds.
                            </TableCell>
                            <TableCell className={`text-right font-black text-xs ${p.stock === 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {p.stock} unidades
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-slate-350" />
                    <span>No hay productos registrados en el inventario.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* BARRA DE ACCIÓN FLOTANTE AL SELECCIONAR PRODUCTOS */}
        {selectedProductIds.length > 0 && activeTab === 'CATALOG' && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-indigo-950 border border-slate-800 dark:border-indigo-900 rounded-2xl py-3 px-6 shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
              <span className="text-xs font-black text-slate-100">
                {selectedProductIds.length} producto(s) seleccionado(s)
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800 dark:bg-indigo-900" />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-indigo-900 rounded-lg px-2"
                onClick={() => setSelectedProductIds([])}
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-8 rounded-lg px-4 gap-1.5 active:scale-95 transition-all shadow-md"
                onClick={() => setIsLabelsOpen(true)}
              >
                <Printer className="h-3.5 w-3.5" /> Generar Etiquetas
              </Button>
            </div>
          </div>
        )}

        {/* MODAL REGISTRAR PROVEEDOR */}
        <SupplierFormDialog
          open={isSupplierOpen}
          onOpenChange={(open) => {
            setIsSupplierOpen(open);
            if (!open) {
              setEditingSupplierId(null);
              setSupplierForm({ name: '', phone: '', address: '', orderDays: '', deliveryDays: '' });
            }
          }}
          supplierForm={supplierForm}
          setSupplierForm={setSupplierForm}
          onSubmit={handleSupplierSubmit}
          editingSupplierId={editingSupplierId}
        />

        {/* MODAL REGISTRAR FACTURA DE COMPRA */}
        <PurchaseDialog
          open={isPurchaseOpen}
          onOpenChange={setIsPurchaseOpen}
          selectedSupplierForPurchase={selectedSupplierForPurchase}
          newPurchaseItem={newPurchaseItem}
          setNewPurchaseItem={setNewPurchaseItem}
          products={products}
          addedPurchaseItems={addedPurchaseItems}
          payFromRegister={payFromRegister}
          setPayFromRegister={setPayFromRegister}
          purchaseNotes={purchaseNotes}
          setPurchaseNotes={setPurchaseNotes}
          onAddPurchaseItem={handleAddPurchaseItem}
          onRemovePurchaseItemIndex={handleRemovePurchaseItemIndex}
          onPurchaseSubmit={handlePurchaseSubmit}
          totalInvoiceSum={totalInvoiceSum}
        />

        {/* MODAL DETALLES COMPRA REALIZADA */}
        <PurchaseDetailsDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          activePurchaseDetail={activePurchaseDetail}
        />

        {/* DIÁLOGO: NUEVO/EDITAR PRODUCTO CATÁLOGO */}
        <ProductFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          editingProduct={editingProduct}
          onSubmit={handleFormSubmit}
          categories={categories}
          barcodeInputRef={barcodeInputRef}
        />

        {/* MODAL: IMPORTAR CSV */}
        <ImportCSVModal
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={handleImportCSV}
        />

        {/* DRAWER: BITÁCORA DE MOVIMIENTOS */}
        <StockMovementsDrawer
          open={isMovementsOpen}
          onOpenChange={setIsMovementsOpen}
          product={activeMovementsProduct}
          movements={movements}
          loading={movementsLoading}
        />

        {/* MODAL: CONFIGURAR E IMPRIMIR ETIQUETAS */}
        <BarcodeLabelsModal
          open={isLabelsOpen}
          onOpenChange={setIsLabelsOpen}
          selectedProducts={selectedProducts}
        />

        {/* DIÁLOGO: ELIMINACIÓN PRODUCTO */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5" /> ¿Eliminar Producto?
              </DialogTitle>
              <DialogDescription className="text-xs">
                Removerá permanentemente el artículo de tu catálogo de ventas.
              </DialogDescription>
            </DialogHeader>

            {productToDelete && (
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{productToDelete.name}</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-4 active:scale-95 transition-all" 
                onClick={handleDeleteSubmit}
              >
                Sí, Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PinLockGuard>
  );
}
