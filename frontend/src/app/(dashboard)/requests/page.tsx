'use client';

import React from 'react';
import { useInventory } from '../inventory/hooks/useInventory';
import { ModulePageHeader } from '../inventory/components/ModulePageHeader';
import { RequestedProductsTab } from '../inventory/components/RequestedProductsTab';
import { ProductFormDialog } from '../inventory/components/ProductFormDialog';
import { CategoryManagementModal } from '../inventory/components/CategoryManagementModal';
import { MobileInventoryScannerView } from '../inventory/components/MobileInventoryScannerView';

/**
 * Solicitudes de productos. "Agregar al catálogo" dispara el evento `open-add-product-from-requested`,
 * que escuchan `useInventory` (formulario en pantallas grandes) y `MobileInventoryScannerView` (móvil):
 * por eso esta página los aloja, igual que lo hacía la pestaña dentro de Inventario.
 */
export default function RequestsPage() {
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);
  const [isMobileScannerOpen, setIsMobileScannerOpen] = React.useState(false);

  const {
    products,
    categories,
    suppliers,
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    handleFormSubmit,
    barcodeInputRef,
    mutateProducts,
  } = useInventory();

  return (
    <div className="space-y-4 w-full pb-20 relative">
      <ModulePageHeader title="Solicitudes" />

      <RequestedProductsTab />

      <MobileInventoryScannerView
        open={isMobileScannerOpen}
        onOpenChange={setIsMobileScannerOpen}
        products={products}
        categories={categories}
        suppliers={suppliers}
        onRefresh={mutateProducts}
      />

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
    </div>
  );
}
