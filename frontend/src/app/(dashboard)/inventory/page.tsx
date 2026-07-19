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
  Eye
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
    handleOpenRegisterPurchase,
    handleAddPurchaseItem,
    handleRemovePurchaseItemIndex,
    handlePurchaseSubmit,
    totalInvoiceSum,
  } = useInventory();

  return (
    <PinLockGuard>
      <div className="space-y-6 max-w-5xl mx-auto pb-6">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Control de Stock
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inventario de Tienda</h1>
        </div>

        {/* SECTOR DE PESTAÑAS (TABS RESPONSIVOS TÁCTILES) */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full max-w-md shrink-0">
          <Button
            variant={activeTab === 'CATALOG' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-10 font-extrabold text-xs rounded-xl transition-all",
              activeTab === 'CATALOG' ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"
            )}
            onClick={() => setActiveTab('CATALOG')}
          >
            <Package className="h-4 w-4 mr-1.5" /> Catálogo de Productos
          </Button>
          <Button
            variant={activeTab === 'SUPPLIERS' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-10 font-extrabold text-xs rounded-xl transition-all",
              activeTab === 'SUPPLIERS' ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400"
            )}
            onClick={() => setActiveTab('SUPPLIERS')}
          >
            <Truck className="h-4 w-4 mr-1.5" /> Proveedores y Compras
          </Button>
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

            {/* FILTROS */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar producto o código..."
                    className="pl-9 h-11 border-slate-200 rounded-xl text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <CustomSelect
                    className="w-40"
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="-- Categorías --"
                    options={[
                      { value: '', label: '-- Categorías --' },
                      ...categories.map((c) => ({ value: c, label: c })),
                    ]}
                  />

                  <CustomSelect
                    className="w-40"
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

              <Button 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all w-full md:w-auto justify-center"
                onClick={handleOpenAdd}
              >
                <Plus className="h-4 w-4" /> Nuevo Producto
              </Button>
            </div>

            {/* TABLA CATÁLOGO */}
            <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
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
                      <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Stock</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Venta</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-24 hidden sm:table-cell">Compra</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-500 w-20 hidden sm:table-cell">Margen</TableHead>
                      <TableHead className="w-20 text-center text-xs font-bold text-slate-500">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredProducts.map((p) => {
                      const isCritical = p.stock <= p.minStock;
                      const isOut = p.stock === 0;
                      
                      const margin = p.sellPrice > 0 
                        ? ((p.sellPrice - p.purchasePrice) / p.sellPrice) * 100 
                        : 0;

                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                          <TableCell className="py-3">
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">{p.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                {p.barcode && (
                                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                                    <Barcode className="h-3 w-3" /> {p.barcode}
                                  </span>
                                )}
                                {p.category && (
                                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-slate-100 text-slate-500 font-bold border-none">
                                    {p.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right font-bold text-xs">
                            <span className={isOut ? 'text-rose-500' : isCritical ? 'text-amber-500' : 'text-slate-700'}>
                              {p.stock}
                            </span>
                            {isCritical && (
                              <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-50 px-1 py-0.5 rounded ml-1 block sm:inline-block">
                                Mín {p.minStock}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right text-slate-805 font-black text-xs">
                            ${p.sellPrice.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-slate-400 text-xs hidden sm:table-cell">
                            ${p.purchasePrice.toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-emerald-500 font-bold text-xs hidden sm:table-cell">
                            {margin.toFixed(0)}%
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-slate-500 hover:bg-slate-100"
                                onClick={() => handleOpenEdit(p)}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                                onClick={() => handleOpenDelete(p)}
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
        ) : (
          <>
            {/* B. VISTA DE PROVEEDORES Y COMPRAS FACTURADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LISTA DE PROVEEDORES (1/3 ANCHO) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Truck className="h-4 w-4 text-indigo-650" /> Proveedores Activos
                  </h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg"
                    onClick={() => setIsSupplierOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-0.5" /> Registrar
                  </Button>
                </div>

                {suppliersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                        <Skeleton className="h-4.5 w-32" />
                        <div className="space-y-1.5 pt-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : suppliers.length > 0 ? (
                  <div className="space-y-3">
                    {suppliers.map((supplier) => (
                      <div 
                        key={supplier.id} 
                        className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">{supplier.name}</span>
                          <div className="flex flex-col gap-1.5 mt-2 text-[10px] text-slate-455 dark:text-slate-400 font-semibold">
                            {supplier.phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {supplier.phone}</span>
                            )}
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-slate-400" /> {supplier._count?.purchases || 0} Facturas</span>
                          </div>
                        </div>
                        
                        <div className="pt-2.5 border-t border-slate-50 dark:border-slate-800/60 flex gap-2">
                          <Button 
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] h-8 rounded-lg active:scale-95 transition-all"
                            onClick={() => handleOpenRegisterPurchase(supplier)}
                          >
                            Registrar Compra
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4">
                    No hay proveedores registrados.
                  </div>
                )}
              </div>

              {/* BITÁCORA DE COMPRAS A PROVEEDORES (2/3 ANCHO) */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText className="h-4 w-4 text-indigo-650" /> Bitácora de Compras Realizadas
                </h3>

                <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
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
                  ) : purchases.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b">
                          <TableHead className="text-xs font-bold text-slate-500">Proveedor</TableHead>
                          <TableHead className="text-xs font-bold text-slate-500">Fecha y Hora</TableHead>
                          <TableHead className="text-xs font-bold text-slate-500 w-24 text-center">Caja Chica</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Total Compra</TableHead>
                          <TableHead className="w-20 text-center text-xs font-bold text-slate-500">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y">
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id} className="hover:bg-slate-50/20 border-b">
                            <TableCell className="font-bold text-xs text-slate-700">{purchase.supplier.name}</TableCell>
                            <TableCell className="text-slate-455 text-xs">
                              {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={purchase.payFromRegister ? 'bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] px-1.5' : 'bg-slate-50 text-slate-500 border-none font-bold text-[8px] px-1.5'}>
                                {purchase.payFromRegister ? 'SÍ' : 'NO'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-808 text-xs">
                              ${purchase.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg flex items-center gap-1.5 mx-auto"
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
                      No se han registrado compras.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL REGISTRAR PROVEEDOR */}
        <SupplierFormDialog
          open={isSupplierOpen}
          onOpenChange={setIsSupplierOpen}
          supplierForm={supplierForm}
          setSupplierForm={setSupplierForm}
          onSubmit={handleSupplierSubmit}
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

        {/* DIÁLOGO: NUEVO PRODUCTO CATÁLOGO */}
        <ProductFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          editingProduct={editingProduct}
          onSubmit={handleFormSubmit}
          categories={categories}
          barcodeInputRef={barcodeInputRef}
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
              <div className="bg-slate-50 border p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-800 text-sm">{productToDelete.name}</span>
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
