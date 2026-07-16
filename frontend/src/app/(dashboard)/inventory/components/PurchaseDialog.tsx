import React from 'react';
import { Truck, Trash2 } from 'lucide-react';
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
  totalInvoiceSum: number;
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
  totalInvoiceSum,
}: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800 flex items-center gap-1.5">
            <Truck className="h-5 w-5 text-indigo-650" />
            Ingresar Compra de Mercancía
          </DialogTitle>
          <DialogDescription className="text-xs">
            Proveedor: <strong className="text-slate-800">{selectedSupplierForPurchase?.name}</strong>. Agrega artículos para surtir stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2 text-xs">
          {/* LADO IZQUIERDO: AGREGAR PRODUCTO (5/12 ANCHO) */}
          <div className="md:col-span-5 space-y-4 p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Agregar Artículo</span>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Seleccionar Producto</label>
              <CustomSelect
                value={newPurchaseItem.productId}
                onChange={(val) => {
                  const prod = products.find((p) => p.id === val);
                  setNewPurchaseItem({
                    productId: val,
                    costPrice: prod ? prod.purchasePrice : 0,
                    quantity: 1,
                  });
                }}
                placeholder="-- Producto --"
                options={[
                  { value: '', label: '-- Producto --' },
                  ...products.map((p) => ({ value: p.id, label: `${p.name} (Stock: ${p.stock.toFixed(0)})` })),
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Costo Adquisición ($)</label>
                <Input
                  type="number"
                  step="any"
                  className="focus-visible:ring-indigo-500 h-9 font-bold text-xs"
                  value={newPurchaseItem.costPrice || ''}
                  onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Cantidad</label>
                <Input
                  type="number"
                  step="any"
                  className="focus-visible:ring-indigo-500 h-9 font-bold text-xs"
                  value={newPurchaseItem.quantity || ''}
                  onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-9 rounded-lg"
              onClick={onAddPurchaseItem}
            >
              Insertar a Factura
            </Button>
          </div>

          {/* LADO DERECHO: DESGLOSE ORDEN DE COMPRA (7/12 ANCHO) */}
          <div className="md:col-span-7 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Artículos de esta factura</span>

              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {addedPurchaseItems.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b">
                        <TableHead className="text-[9px] font-bold py-1">Nombre</TableHead>
                        <TableHead className="text-right text-[9px] font-bold py-1 w-16">Costo</TableHead>
                        <TableHead className="text-center text-[9px] font-bold py-1 w-16">Cant</TableHead>
                        <TableHead className="text-right text-[9px] font-bold py-1 w-20">Subtotal</TableHead>
                        <TableHead className="w-10 py-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {addedPurchaseItems.map((item, idx) => (
                        <TableRow key={item.productId} className="border-b py-0 hover:bg-slate-50/20">
                          <TableCell className="py-1.5 font-bold text-[10px] text-slate-700 truncate max-w-[100px]">
                            {item.productName}
                          </TableCell>
                          <TableCell className="py-1.5 text-right text-[10px] text-slate-450">${item.costPrice.toFixed(1)}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-1.5 text-right font-bold text-[10px] text-slate-800">
                            ${(item.costPrice * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            <button className="text-rose-500 hover:text-rose-600" onClick={() => onRemovePurchaseItemIndex(idx)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-[10px]">Agrega productos del panel izquierdo.</div>
                )}
              </div>
            </div>

            {/* CONTROLES TOTALES Y PAGO DE CAJA CHICA */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 p-2.5 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="payFromRegister-chk"
                    className="accent-indigo-600 h-4 w-4 shrink-0 rounded"
                    checked={payFromRegister}
                    onChange={(e) => setPayFromRegister(e.target.checked)}
                  />
                  <label htmlFor="payFromRegister-chk" className="text-[10px] font-bold text-slate-600 leading-none">
                    Pagar con dinero de caja chica
                  </label>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Factura</span>
                  <span className="font-black text-sm text-indigo-650">${totalInvoiceSum.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Notas / Factura Ref.</label>
                <Input
                  type="text"
                  placeholder="Ej. Factura #88219..."
                  className="focus-visible:ring-indigo-500 h-8 text-[11px] font-semibold"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 rounded-xl h-10"
            disabled={addedPurchaseItems.length === 0}
            onClick={onPurchaseSubmit}
          >
            Registrar Compra y Recibir Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
