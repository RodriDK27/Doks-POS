import React from 'react';
import { Truck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/CustomSelect';
import { Product, Supplier } from '../types';

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSupplierForPurchase: Supplier | null;
  newPurchaseItem: {
    productId: string;
    costPrice: number;
    quantity: number;
  };
  setNewPurchaseItem: React.Dispatch<React.SetStateAction<{
    productId: string;
    costPrice: number;
    quantity: number;
  }>>;
  products: Product[];
  addedPurchaseItems: Array<{
    productId: string;
    productName: string;
    costPrice: number;
    quantity: number;
  }>;
  payFromRegister: boolean;
  setPayFromRegister: (val: boolean) => void;
  purchaseNotes: string;
  setPurchaseNotes: (notes: string) => void;
  onAddPurchaseItem: () => void;
  onRemovePurchaseItemIndex: (index: number) => void;
  onPurchaseSubmit: () => void;
  isSubmitting?: boolean;
  totalInvoiceSum: number;

  onSavePendingTicket?: (data: { supplierId: string; amount: number; scheduledDate?: string; notes?: string }) => Promise<void>;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  selectedSupplierForPurchase,
  newPurchaseItem,
  setNewPurchaseItem,
  products,
  addedPurchaseItems,
  payFromRegister,
  setPayFromRegister,
  purchaseNotes,
  setPurchaseNotes,
  onAddPurchaseItem,
  onRemovePurchaseItemIndex,
  onPurchaseSubmit,
  isSubmitting = false,
  totalInvoiceSum,
  onSavePendingTicket,
}: PurchaseDialogProps) {
  const [purchaseType, setPurchaseType] = React.useState<'TICKET' | 'IMMEDIATE'>('TICKET');
  const [ticketAmount, setTicketAmount] = React.useState('');
  const [isSavingTicket, setIsSavingTicket] = React.useState(false);

  const handleTicketSubmit = async () => {
    if (!selectedSupplierForPurchase || !onSavePendingTicket) return;
    const numVal = parseFloat(ticketAmount);
    if (isNaN(numVal) || numVal <= 0) return;

    const scheduledDate = selectedSupplierForPurchase.deliveryDays?.split(',')[0] || selectedSupplierForPurchase.orderDays?.split(',')[0] || 'Próximo';

    try {
      setIsSavingTicket(true);
      await onSavePendingTicket({
        supplierId: selectedSupplierForPurchase.id,
        amount: numVal,
        scheduledDate,
        notes: purchaseNotes.trim() || undefined,
      });
      setTicketAmount('');
      setPurchaseNotes('');
      onOpenChange(false);
    } finally {
      setIsSavingTicket(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[760px] max-h-[96vh] sm:max-h-[90vh] flex flex-col justify-between rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-y-auto overflow-x-hidden">
        <DialogHeader className="pb-1 sm:pb-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-sm sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Registrar Compra / Ticket</span>
            </DialogTitle>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPurchaseType('TICKET')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  purchaseType === 'TICKET'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Ticket Previo
              </button>
              <button
                type="button"
                onClick={() => setPurchaseType('IMMEDIATE')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  purchaseType === 'IMMEDIATE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Pago Directo
              </button>
            </div>
          </div>

          <DialogDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate pt-1">
            Proveedor: <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedSupplierForPurchase?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {purchaseType === 'TICKET' ? (
          <div className="py-4 space-y-4 text-xs">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Anotar Ticket Previo de Preventa</span>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Resguarda el dinero en la agenda para el día de la entrega. No se realiza ningún descuento en la Caja Chica hasta que el repartidor entregue.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Monto del Ticket ($) *</label>
              <Input
                type="number"
                step="0.50"
                placeholder="0.00"
                className="h-10 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 rounded-xl"
                value={ticketAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTicketAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Folio / Observaciones</label>
              <Input
                type="text"
                placeholder="Ej. Folio #4521 - Refrescos"
                className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-row justify-end gap-2">
              <Button type="button" variant="outline" className="h-10 rounded-xl font-bold text-xs" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isSavingTicket || !ticketAmount || parseFloat(ticketAmount) <= 0}
                onClick={handleTicketSubmit}
                className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Guardar Ticket Previo
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 py-1 sm:py-3 text-xs md:items-stretch">
          {/* LADO IZQUIERDO: FORMULARIO AGREGAR ARTÍCULO */}
          <div className="md:col-span-5 space-y-2 sm:space-y-3.5 p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl flex flex-col justify-between">
            <div className="space-y-2 sm:space-y-3.5">
              <span className="text-[9.5px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Agregar Artículo
              </span>

              <div className="space-y-0.5 sm:space-y-1">
                <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Seleccionar Producto
                </label>
                <CustomSelect
                  className="h-8.5 sm:h-10 text-xs"
                  value={newPurchaseItem.productId}
                  onChange={(val) => {
                    const prod = products.find((p) => p.id === val);
                    setNewPurchaseItem({
                      productId: val,
                      costPrice: prod ? prod.purchasePrice : 0,
                      quantity: 1,
                    });
                  }}
                  placeholder="-- Selecciona Producto --"
                  options={[
                    { value: '', label: '-- Selecciona Producto --' },
                    ...products.map((p) => ({ value: p.id, label: `${p.name} (Stock: ${p.stock.toFixed(0)})` })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <div className="space-y-0.5 sm:space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Costo ($)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    className="focus-visible:ring-indigo-500 h-8.5 sm:h-10 font-bold text-xs rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                    value={newPurchaseItem.costPrice || ''}
                    onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    step="any"
                    className="focus-visible:ring-indigo-500 h-8.5 sm:h-10 font-bold text-xs rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                    value={newPurchaseItem.quantity || ''}
                    onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight block">
                * Actualizará el precio de costo del producto.
              </span>
            </div>

            <Button
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-8.5 sm:h-10 rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer mt-1.5 sm:mt-3"
              onClick={onAddPurchaseItem}
            >
              Insertar a Factura
            </Button>
          </div>

          {/* LADO DERECHO: DETALLE Y FACTURA */}
          <div className="md:col-span-7 flex flex-col justify-between gap-2 sm:gap-3 md:min-h-[260px]">
            <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col">
              <span className="text-[9.5px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Artículos de esta factura
              </span>

              <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex-1 min-h-[85px] sm:min-h-[140px] max-h-[120px] sm:max-h-[220px] overflow-y-auto bg-white dark:bg-slate-900 flex flex-col justify-center">
                {addedPurchaseItems.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                      <TableRow className="border-b border-slate-200/60 dark:border-slate-800">
                        <TableHead className="text-[8.5px] sm:text-[9px] font-extrabold py-1.5 sm:py-2 text-slate-500">Nombre</TableHead>
                        <TableHead className="text-right text-[8.5px] sm:text-[9px] font-extrabold py-1.5 sm:py-2 w-14 sm:w-16 text-slate-500">Costo</TableHead>
                        <TableHead className="text-center text-[8.5px] sm:text-[9px] font-extrabold py-1.5 sm:py-2 w-10 sm:w-12 text-slate-500">Cant</TableHead>
                        <TableHead className="text-right text-[8.5px] sm:text-[9px] font-extrabold py-1.5 sm:py-2 w-16 sm:w-20 text-slate-500">Subtotal</TableHead>
                        <TableHead className="w-7 sm:w-8 py-1.5 sm:py-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {addedPurchaseItems.map((item, idx) => (
                        <TableRow key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="py-1.5 sm:py-2 font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                            {item.productName}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 text-right text-xs text-slate-500 dark:text-slate-400">${item.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="py-1.5 sm:py-2 text-center text-xs font-black text-slate-700 dark:text-slate-300">{item.quantity}</TableCell>
                          <TableCell className="py-1.5 sm:py-2 text-right font-black text-xs text-slate-800 dark:text-slate-100">
                            ${(item.costPrice * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 text-center">
                            <button className="text-rose-500 hover:text-rose-600 p-0.5 sm:p-1 cursor-pointer" onClick={() => onRemovePurchaseItemIndex(idx)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-5 sm:py-8 text-slate-400 dark:text-slate-500 text-xs">
                    Agrega productos del panel izquierdo.
                  </div>
                )}
              </div>
            </div>

            {/* CAJA CHICA Y TOTAL */}
            <div className="space-y-1.5 sm:space-y-2 pt-1">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 border border-slate-200/60 dark:border-slate-800 rounded-2xl gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="payFromRegister-chk"
                    className="accent-indigo-600 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 rounded cursor-pointer"
                    checked={payFromRegister}
                    onChange={(e) => setPayFromRegister(e.target.checked)}
                  />
                  <label htmlFor="payFromRegister-chk" className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-none cursor-pointer">
                    Pagar con dinero de caja chica
                  </label>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Total Factura</span>
                  <span className="font-black text-sm sm:text-base text-indigo-600 dark:text-indigo-400">${totalInvoiceSum.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Notas / Factura Ref.
                </label>
                <Input
                  type="text"
                  placeholder="Ej. Factura #88219..."
                  className="focus-visible:ring-indigo-500 h-8.5 sm:h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 flex-row justify-end shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 sm:flex-none text-xs font-extrabold rounded-xl h-9.5 sm:h-11 px-4 sm:px-5 border-slate-200 dark:border-slate-800 cursor-pointer" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 sm:px-6 rounded-xl h-9.5 sm:h-11 shadow-sm cursor-pointer active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={addedPurchaseItems.length === 0 || isSubmitting}
            onClick={onPurchaseSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando Compra...
              </span>
            ) : (
              'Registrar Compra y Recibir Stock'
            )}
          </Button>
        </DialogFooter>
      </>
    )}

      </DialogContent>
    </Dialog>

  );
}
