import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sale } from '../types';

interface TicketDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSale: Sale | null;
  onPrint: () => void;
}

export function TicketDetailsDialog({
  open,
  onOpenChange,
  selectedSale,
  onPrint,
}: TicketDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl max-h-[85vh] overflow-y-auto animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="font-bold text-slate-800">Recibo de Ticket</DialogTitle>
        </DialogHeader>

        {selectedSale && (
          <div className="space-y-4 py-2">
            {/* TICKET MOCK (SIMULADOR DE PAPEL TÉRMICO) */}
            <div 
              id="thermal-ticket-print" 
              className="bg-white border-2 border-slate-200 border-dashed rounded-xl p-4 font-mono text-[11px] text-slate-800 shadow-inner space-y-4 leading-normal w-full"
            >
              {/* Cabecera del ticket */}
              <div className="text-center space-y-1">
                <h3 className="font-bold text-sm tracking-wide">DOK&apos;S POS CENTRAL</h3>
                <p className="text-[10px] text-slate-450 uppercase font-semibold">Abarrotes & Miscelánea</p>
                <p className="text-[9px] text-slate-400">Tel: 55-1234-5678</p>
              </div>

              <div className="border-t border-slate-200 border-dashed pt-2 space-y-1">
                <p><strong>FOLIO TICKET:</strong> #{selectedSale.id}</p>
                <p><strong>FECHA:</strong> {new Date(selectedSale.createdAt).toLocaleString()}</p>
                <p><strong>CAJA REF:</strong> {selectedSale.cashRegisterId.substring(0, 8)}...</p>
                <p><strong>CLIENTE:</strong> {selectedSale.customer?.name || 'PÚBLICO GENERAL'}</p>
              </div>

              {/* Desglose de productos */}
              <div className="border-t border-slate-200 border-dashed pt-2">
                <div className="grid grid-cols-12 gap-1 font-bold text-slate-500 mb-1">
                  <span className="col-span-2">CANT</span>
                  <span className="col-span-7">ARTÍCULO</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-1 py-1">
                      <span className="col-span-2 text-slate-500">{item.quantity.toFixed(0)}</span>
                      <div className="col-span-7 pr-1">
                        <span className="block truncate">{item.productName}</span>
                        <span className="text-[9px] text-slate-400">{item.quantity} x ${item.price.toFixed(2)}</span>
                      </div>
                      <span className="col-span-3 text-right font-semibold">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-slate-200 border-dashed pt-2 space-y-1">
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>DESCUENTO:</span>
                    <span>-${selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-100">
                  <span>TOTAL NETO:</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pago y Cambio */}
              <div className="border-t border-slate-200 border-dashed pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>MÉTODO DE PAGO:</span>
                  <span>{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.paymentMethod === 'EFECTIVO' && (
                  <>
                    <div className="flex justify-between">
                      <span>EFECTIVO RECIBIDO:</span>
                      <span>${selectedSale.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>SU CAMBIO:</span>
                      <span>${selectedSale.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed text-[9px] text-slate-400">
                <p>¡Gracias por su preferencia!</p>
                <p className="mt-0.5">Visite Dok&apos;s POS pronto</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="text-xs rounded-xl" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button 
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 flex items-center gap-1.5 cursor-pointer"
            onClick={onPrint}
          >
            <Printer className="h-4 w-4" /> Imprimir Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
