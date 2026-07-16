import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Purchase } from '../types';

interface PurchaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePurchaseDetail: Purchase | null;
}

export function PurchaseDetailsDialog({
  open,
  onOpenChange,
  activePurchaseDetail,
}: PurchaseDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Detalles de Compra</DialogTitle>
        </DialogHeader>

        {activePurchaseDetail && (
          <div className="space-y-4 py-1 text-xs">
            <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Proveedor:</span>
                <span className="font-bold text-slate-700">{activePurchaseDetail.supplier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Fecha:</span>
                <span className="font-bold text-slate-700">{new Date(activePurchaseDetail.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Caja Chica Salida:</span>
                <span className="font-bold text-slate-750">{activePurchaseDetail.payFromRegister ? 'Sí' : 'No'}</span>
              </div>
              {activePurchaseDetail.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Referencia:</span>
                  <span className="font-bold text-slate-700">{activePurchaseDetail.notes}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span className="text-slate-500">Monto total pagado:</span>
                <span className="font-black text-indigo-650 text-sm">${activePurchaseDetail.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Productos Ingresados</span>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b">
                      <TableHead className="text-[9px] font-bold">Producto</TableHead>
                      <TableHead className="text-center text-[9px] font-bold w-14">Cant</TableHead>
                      <TableHead className="text-right text-[9px] font-bold w-20">Costo</TableHead>
                      <TableHead className="text-right text-[9px] font-bold w-20">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {activePurchaseDetail.items.map((item) => (
                      <TableRow key={item.id} className="border-b py-0">
                        <TableCell className="py-2 font-bold text-[10px] text-slate-700 truncate max-w-[120px]">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="py-2 text-center text-[10px] font-bold">{item.quantity}</TableCell>
                        <TableCell className="py-2 text-right text-[10px] text-slate-450">${item.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-right font-bold text-[10px] text-slate-800">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => onOpenChange(false)}>
            Cerrar Detalle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
