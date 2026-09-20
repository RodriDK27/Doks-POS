'use client';

import React from 'react';
import { CheckSquare, Printer, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

import { useInventory } from './hooks/useInventory';

import { ProductFormDialog } from './components/ProductFormDialog';
import { ImportCSVModal } from './components/ImportCSVModal';
import { StockMovementsDrawer } from './components/StockMovementsDrawer';
import { BarcodeLabelsModal } from './components/BarcodeLabelsModal';
import { WasteModal } from './components/WasteModal';
import { CatalogTab } from './components/CatalogTab';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { FloatingSupplierWidget } from './components/FloatingSupplierWidget';
import { MobileInventoryScannerView } from './components/MobileInventoryScannerView';
import { PayPendingTicketModal } from './components/PayPendingTicketModal';

/**
 * Catálogo de inventario. Proveedores y Compras, Solicitudes, Mermas y Consumos y Rendimiento
 * son módulos propios (rutas /suppliers, /requests, /waste y /performance) en el menú lateral.
 */
export default function InventoryPage() {
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  const [isMobileScannerOpen, setIsMobileScannerOpen] = React.useState(false);

  const {
    products,
    categories,
    suppliers,
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
    // Tickets pendientes (los liquida el botón flotante de proveedores)
    isPayTicketOpen,
    setIsPayTicketOpen,
    selectedTicketToPay,
    setSelectedTicketToPay,
    handlePayPendingTicket,
    handleCancelPendingTicket,

    // Mermas y Consumos
    isWasteOpen,
    setIsWasteOpen,
    selectedProductForWaste,
    handleOpenWaste,
    mutateProducts,
  } = useInventory();

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const areAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-4 w-full pb-20 relative">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Módulo Administrativo
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inventario de Tienda</h1>
        </div>

        {/* BOTÓN MÓVIL/TABLET VERTICAL (`lg:hidden`) */}
        <Button
          type="button"
          onClick={() => setIsMobileScannerOpen(true)}
          className="lg:hidden h-8 px-2.5 rounded-xl font-black text-[11px] flex items-center gap-1 cursor-pointer transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Escáner</span>
        </Button>
      </div>

      {/* ESCÁNER MÓVIL DE INVENTARIO EN DIALOG MODAL (A PROVECHAR EL ALTO 92vh) */}
      <MobileInventoryScannerView
        open={isMobileScannerOpen}
        onOpenChange={setIsMobileScannerOpen}
        products={products}
        categories={categories}
        suppliers={suppliers}
        onRefresh={mutateProducts}
      />

      <CatalogTab
        products={products}
        totalProductsCount={totalProductsCount}
        totalInvestment={totalInvestment}
        expectedProfit={expectedProfit}
        lowStockCount={lowStockCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        categories={categories}
        filteredProducts={filteredProducts}
        loading={loading}
        selectedProductIds={selectedProductIds}
        areAllFilteredSelected={areAllFilteredSelected}
        toggleSelectProduct={toggleSelectProduct}
        toggleSelectAllProducts={toggleSelectAllProducts}
        handleOpenAdd={handleOpenAdd}
        setIsImportOpen={setIsImportOpen}
        handleExportCSV={handleExportCSV}
        handleOpenMovements={handleOpenMovements}
        handleOpenWaste={handleOpenWaste}
        handleOpenDuplicate={handleOpenDuplicate}
        handleOpenEdit={handleOpenEdit}
        handleOpenDelete={handleOpenDelete}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        quickAddOpen={isQuickAddOpen}
        setQuickAddOpen={setIsQuickAddOpen}
      />

      {/* MODALES Y DIÁLOGOS */}
      <PayPendingTicketModal
        open={isPayTicketOpen}
        onOpenChange={setIsPayTicketOpen}
        ticket={selectedTicketToPay}
        onConfirmPay={handlePayPendingTicket}
      />

      <WasteModal
        open={isWasteOpen}
        onOpenChange={setIsWasteOpen}
        product={selectedProductForWaste}
        onSuccess={() => mutateProducts()}
      />

      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-indigo-950 border border-slate-800 dark:border-indigo-900 rounded-2xl py-3 px-6 shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-400 shrink-0" />
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

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingProduct={editingProduct}
        onSubmit={handleFormSubmit}
        categories={categories}
        barcodeInputRef={barcodeInputRef}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      <CategoryManagementModal open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen} />

      <ImportCSVModal open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImportCSV} />

      <StockMovementsDrawer
        open={isMovementsOpen}
        onOpenChange={setIsMovementsOpen}
        product={activeMovementsProduct}
        movements={movements}
        loading={movementsLoading}
      />

      <BarcodeLabelsModal open={isLabelsOpen} onOpenChange={setIsLabelsOpen} selectedProducts={selectedProducts} />

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
            <Button variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10 px-5 cursor-pointer active:scale-95 transition-all"
              onClick={handleDeleteSubmit}
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BOTÓN FLOTANTE DE PROVEEDORES Y TICKETS (oculto mientras se usa la alta rápida) */}
      <FloatingSupplierWidget
        hidden={isQuickAddOpen}
        onOpenPayTicket={(ticket) => {
          setSelectedTicketToPay(ticket);
          setIsPayTicketOpen(true);
        }}
        onCancelTicket={handleCancelPendingTicket}
      />
    </div>
  );
}
