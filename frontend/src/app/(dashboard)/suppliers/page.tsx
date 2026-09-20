'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useInventory } from '../inventory/hooks/useInventory';
import { ModulePageHeader } from '../inventory/components/ModulePageHeader';
import { SuppliersTab } from '../inventory/components/SuppliersTab';
import { SupplierFormDialog } from '../inventory/components/SupplierFormDialog';
import { RegisterPendingTicketModal } from '../inventory/components/RegisterPendingTicketModal';
import { PayPendingTicketModal } from '../inventory/components/PayPendingTicketModal';
import { FloatingSupplierWidget } from '../inventory/components/FloatingSupplierWidget';

const PurchaseDialog = dynamic(() => import('../inventory/components/PurchaseDialog').then((mod) => mod.PurchaseDialog), {
  ssr: false,
});

const PurchaseDetailsDialog = dynamic(
  () => import('../inventory/components/PurchaseDetailsDialog').then((mod) => mod.PurchaseDetailsDialog),
  { ssr: false }
);

export default function SuppliersPage() {
  const {
    products,
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
    paymentSource,
    setPaymentSource,
    addedPurchaseItems,
    newPurchaseItem,
    setNewPurchaseItem,
    isDetailOpen,
    setIsDetailOpen,
    activePurchaseDetail,
    setActivePurchaseDetail,
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
  } = useInventory();

  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => new Date().toISOString().substring(0, 7));

  const uniqueMonths = React.useMemo(() => {
    const months = Array.from(new Set(purchases.map((p) => p.createdAt.substring(0, 7))));
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    if (!months.includes(currentMonthStr)) {
      months.unshift(currentMonthStr);
    }
    return months.sort().reverse();
  }, [purchases]);

  const filteredPurchases = React.useMemo(
    () => purchases.filter((p) => p.createdAt.startsWith(selectedMonth)),
    [purchases, selectedMonth]
  );

  const totalSpent = React.useMemo(() => filteredPurchases.reduce((sum, p) => sum + p.total, 0), [filteredPurchases]);

  const openPayTicket = (ticket: NonNullable<typeof selectedTicketToPay>) => {
    setSelectedTicketToPay(ticket);
    setIsPayTicketOpen(true);
  };

  return (
    <div className="space-y-4 w-full pb-20 relative">
      <ModulePageHeader title="Proveedores y Compras" />

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
        onOpenPayTicket={openPayTicket}
        onCancelPendingTicket={handleCancelPendingTicket}
      />

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
        paymentSource={paymentSource}
        setPaymentSource={setPaymentSource}
        purchaseNotes={purchaseNotes}
        setPurchaseNotes={setPurchaseNotes}
        onAddPurchaseItem={handleAddPurchaseItem}
        onRemovePurchaseItemIndex={handleRemovePurchaseItemIndex}
        onPurchaseSubmit={handlePurchaseSubmit}
        isSubmitting={isSubmittingPurchase}
        totalInvoiceSum={totalInvoiceSum}
        onSavePendingTicket={handleSavePendingTicket}
      />

      <PurchaseDetailsDialog open={isDetailOpen} onOpenChange={setIsDetailOpen} activePurchaseDetail={activePurchaseDetail} />

      {/* Botón flotante de visitas de hoy y tickets por pagar */}
      <FloatingSupplierWidget onOpenPayTicket={openPayTicket} onCancelTicket={handleCancelPendingTicket} />
    </div>
  );
}
