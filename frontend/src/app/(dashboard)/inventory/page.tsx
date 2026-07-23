'use client';

import React from 'react';
import useSWR from 'swr';
import PinLockGuard from '@/components/PinLockGuard';
import {
  Package,
  Truck,
  FileText,
  Star,
  CheckSquare,
  Printer,
  AlertTriangle,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/CustomSelect';
import { useAuthStore } from '@/store/useAuthStore';


import { useInventory } from './hooks/useInventory';

import { ProductFormDialog } from './components/ProductFormDialog';
import { SupplierFormDialog } from './components/SupplierFormDialog';
import { ImportCSVModal } from './components/ImportCSVModal';
import { StockMovementsDrawer } from './components/StockMovementsDrawer';
import { BarcodeLabelsModal } from './components/BarcodeLabelsModal';
import { RequestedProductsTab } from './components/RequestedProductsTab';
import { WasteModal } from './components/WasteModal';
import { WasteReportTab } from './components/WasteReportTab';
import { CatalogTab } from './components/CatalogTab';
import { SuppliersTab } from './components/SuppliersTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SupplierCalendarCard } from './components/SupplierCalendarCard';
import { MobileInventoryScannerView } from './components/MobileInventoryScannerView';
import { RegisterPendingTicketModal } from './components/RegisterPendingTicketModal';
import { PayPendingTicketModal } from './components/PayPendingTicketModal';
import { Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

const PurchaseDialog = dynamic(() => import('./components/PurchaseDialog').then(mod => mod.PurchaseDialog), {
  ssr: false,
});

const PurchaseDetailsDialog = dynamic(() => import('./components/PurchaseDetailsDialog').then(mod => mod.PurchaseDetailsDialog), {
  ssr: false,
});

export default function InventoryPage() {
  const { role } = useAuthStore();
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
    isSubmittingPurchase,
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
    // Tickets pendientes
    pendingTickets,
    ticketsHistory,
    isRegisterTicketOpen,
    setIsRegisterTicketOpen,
    isPayTicketOpen,
    setIsPayTicketOpen,
    selectedTicketToPay,
    setSelectedTicketToPay,
    handleSavePendingTicket,
    handlePayPendingTicket,
    handleCancelPendingTicket,

    // Mermas y Consumos
    isWasteOpen,
    setIsWasteOpen,
    selectedProductForWaste,
    handleOpenWaste,
    mutateProducts,
  } = useInventory();

  const { data: swrRequestedProducts } = useSWR<Array<{ id: string; status: string }>>('/requested-products');
  const pendingRequestedCount = React.useMemo(() => {
    return swrRequestedProducts?.filter((p) => p.status === 'PENDIENTE').length || 0;
  }, [swrRequestedProducts]);

  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => new Date().toISOString().substring(0, 7));
  const [isMobileScannerOpen, setIsMobileScannerOpen] = React.useState(false);

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

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const areAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-6 w-full pb-20 relative">

      {/* HEADER PRINCIPAL Y TABS SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
              Módulo Administrativo
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inventario de Tienda</h1>
          </div>

          {/* BOTÓN MÓVIL SÓLO EN CELULARES (`sm:hidden`) */}
          <Button
            type="button"
            onClick={() => setIsMobileScannerOpen(true)}
            className="sm:hidden h-8 px-2.5 rounded-xl font-black text-[11px] flex items-center gap-1 cursor-pointer transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
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

        {/* MÓVIL: SELECT DESPLEGABLE LIMPIO */}
        <div className="w-full sm:hidden shrink-0">
          <CustomSelect
            value={activeTab}
            onChange={(val: string) => setActiveTab(val as typeof activeTab)}
            options={[
              { value: 'CATALOG', label: 'Catálogo de Productos' },
              { value: 'SUPPLIERS', label: 'Proveedores y Compras' },
              { value: 'REQUESTED', label: `Solicitudes ${pendingRequestedCount > 0 ? `(${pendingRequestedCount} pendientes)` : ''}` },
              ...(role === 'ADMIN' ? [{ value: 'ANALYTICS', label: 'Rendimiento y Reportes' }] : []),
              { value: 'WASTE', label: 'Mermas y Consumos Internos' },
            ]}
          />
        </div>

        {/* ESCRITORIO / TABLET: BOTONES CONTINUOS */}
        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl shrink-0 border border-slate-200/40 dark:border-slate-800/40 gap-1">
          <Button
            variant="ghost"
            className={cn(
              "h-8 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-none",
              activeTab === 'CATALOG'
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab('CATALOG')}
          >
            <Package className="h-4 w-4" /> Catálogo
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-8 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-none",
              activeTab === 'SUPPLIERS'
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab('SUPPLIERS')}
          >
            <Truck className="h-4 w-4" /> Proveedores y Compras
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-8 px-3 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none relative",
              activeTab === 'REQUESTED'
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab('REQUESTED')}
          >
            <FileText className="h-4 w-4" />
            <span>Solicitudes</span>
            {pendingRequestedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white font-black text-[10px] rounded-full animate-bounce shadow-xs">
                {pendingRequestedCount}
              </span>
            )}
          </Button>
          {role === 'ADMIN' && (
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-none",
                activeTab === 'ANALYTICS'
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('ANALYTICS')}
            >
              <Star className="h-4 w-4" /> Rendimiento
            </Button>
          )}
          <Button
            variant="ghost"
            className={cn(
              "h-8 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-none",
              activeTab === 'WASTE'
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab('WASTE')}
          >
            <UtensilsCrossed className="h-4 w-4" /> Mermas y Consumos
          </Button>
        </div>

      </div>

      {/* TARJETA DE CALENDARIO DE PROVEEDORES */}
      <SupplierCalendarCard />

      {/* CONTENIDO SEGÚN PESTAÑA */}

      {activeTab === 'CATALOG' ? (
        <CatalogTab
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
        />
      ) : activeTab === 'REQUESTED' ? (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <RequestedProductsTab />
        </div>
      ) : activeTab === 'SUPPLIERS' ? (
        <SuppliersTab
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          purchases={purchases}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          uniqueMonths={uniqueMonths}
          filteredPurchases={filteredPurchases}
          totalSpent={totalSpent}
          setIsSupplierOpen={setIsSupplierOpen}
          handleOpenRegisterPurchase={handleOpenRegisterPurchase}
          handleOpenEditSupplier={handleOpenEditSupplier}
          handleToggleActiveSupplier={handleToggleActiveSupplier}
          setActivePurchaseDetail={setActivePurchaseDetail}
          setIsDetailOpen={setIsDetailOpen}
          pendingTickets={pendingTickets}
          ticketsHistory={ticketsHistory}
          onOpenRegisterTicket={() => setIsRegisterTicketOpen(true)}
          onOpenPayTicket={(ticket) => {
            setSelectedTicketToPay(ticket);
            setIsPayTicketOpen(true);
          }}
          onCancelPendingTicket={handleCancelPendingTicket}
        />
      ) : activeTab === 'ANALYTICS' ? (
        <AnalyticsTab
          analytics={analytics}
          analyticsLoading={analyticsLoading}
        />
      ) : (
        <WasteReportTab />
      )}

      {/* MODALES Y DIÁLOGOS ADICIONALES */}
      <RegisterPendingTicketModal
        open={isRegisterTicketOpen}
        onOpenChange={setIsRegisterTicketOpen}
        suppliers={suppliers}
        onSavePendingTicket={handleSavePendingTicket}
      />

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

      <SupplierFormDialog
        open={isSupplierOpen}
        onOpenChange={(open) => {
          setIsSupplierOpen(open);
          if (!open) {
            setEditingSupplierId(null);
            setSupplierForm({ name: '', phone: '', address: '', orderDays: '', deliveryDays: '', visitFrequency: 'WEEKLY', expectedPayment: '0' });
          }
        }}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        onSubmit={handleSupplierSubmit}
        editingSupplierId={editingSupplierId}
      />

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
        isSubmitting={isSubmittingPurchase}
        totalInvoiceSum={totalInvoiceSum}
        onSavePendingTicket={handleSavePendingTicket}
      />


      <PurchaseDetailsDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        activePurchaseDetail={activePurchaseDetail}
      />

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingProduct={editingProduct}
        onSubmit={handleFormSubmit}
        categories={categories}
        barcodeInputRef={barcodeInputRef}
      />

      <ImportCSVModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportCSV}
      />

      <StockMovementsDrawer
        open={isMovementsOpen}
        onOpenChange={setIsMovementsOpen}
        product={activeMovementsProduct}
        movements={movements}
        loading={movementsLoading}
      />

      <BarcodeLabelsModal
        open={isLabelsOpen}
        onOpenChange={setIsLabelsOpen}
        selectedProducts={selectedProducts}
      />

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
    </div>
  );
}

