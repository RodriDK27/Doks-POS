'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Search, 
  Printer, 
  FileText, 
  Calendar, 
  User, 
  CreditCard,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import Link from 'next/link';

interface SaleItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

interface Sale {
  id: number;
  total: number;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  cashRegisterId: string;
  createdAt: string;
  customer: { name: string } | null;
  items: SaleItem[];
}

export default function TicketsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'>('ALL');
  
  // Modal de previsualización de ticket
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('No se pudo cargar el historial de ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Filtrado lógico de tickets
  const filteredSales = sales.filter(s => {
    // 1. Filtro por buscador (ID, Cliente o Método de Pago)
    const folioStr = `#${s.id}`;
    const customerName = s.customer?.name.toLowerCase() || 'público general';
    const matchesSearch = 
      folioStr.includes(searchQuery) ||
      s.id.toString().includes(searchQuery) ||
      customerName.includes(searchQuery.toLowerCase()) ||
      s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filtro por fecha
    const saleDate = new Date(s.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    let matchesDate = true;
    if (selectedDateFilter === 'TODAY') {
      matchesDate = saleDate >= today;
    } else if (selectedDateFilter === 'YESTERDAY') {
      matchesDate = saleDate >= yesterday && saleDate < today;
    } else if (selectedDateFilter === 'WEEK') {
      matchesDate = saleDate >= weekAgo;
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      
      {/* ESTILOS CSS INYECTADOS EXCLUSIVOS PARA IMPRESIÓN (OCULTA LA APP Y AISLA EL TICKET) */}
      <style jsx global>{`
        @media print {
          /* Ocultar toda la estructura de la aplicación */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Mostrar únicamente el contenedor del ticket */
          #thermal-ticket-print, #thermal-ticket-print * {
            visibility: visible;
          }
          /* Colocar el ticket arriba a la izquierda ocupando ancho térmico estándar */
          #thermal-ticket-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 4mm;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Regresar al Inicio
        </Link>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
            Bitácora de Transacciones
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Historial de Tickets</h1>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por Folio, Cliente o método..."
            className="pl-9 h-11 border-slate-200 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="h-11 border border-slate-200 rounded-xl px-3 bg-white text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value as any)}
        >
          <option value="ALL">Todas las Ventas</option>
          <option value="TODAY">Solo Hoy</option>
          <option value="YESTERDAY">Ayer</option>
          <option value="WEEK">Últimos 7 Días</option>
        </select>
      </div>

      {/* TABLA DE HISTORIAL (RESPONSIVA) */}
      <div className="border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Cargando bitácora de tickets...</div>
        ) : filteredSales.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b">
                <TableHead className="text-xs font-bold text-slate-500 w-24">Folio</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Fecha y Hora</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Cliente</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 w-28">Método</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Monto Cobrado</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold text-slate-500">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-slate-50/20 border-b">
                  <TableCell className="font-bold text-slate-800 text-xs">
                    #{sale.id}
                  </TableCell>
                  <TableCell className="text-slate-450 text-xs">
                    {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-600">
                    {sale.customer?.name || 'Público General'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 border-slate-200">
                      {sale.paymentMethod === 'FIADO' ? 'Fiado (Crédito)' : sale.paymentMethod.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-800 text-xs">
                    ${sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-extrabold text-indigo-650 hover:bg-indigo-50 px-2.5 rounded-lg flex items-center gap-1 mx-auto"
                      onClick={() => {
                        setSelectedSale(sale);
                        setIsTicketOpen(true);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Ticket
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-20 text-center text-slate-400 text-xs">
            No se encontraron tickets en el historial.
          </div>
        )}
      </div>

      {/* DIÁLOGO VISUAL DEL RECIBO TÉRMICO (58mm/80mm) */}
      <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl max-h-[85vh] overflow-y-auto">
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
                  <h3 className="font-bold text-sm tracking-wide">DOK'S POS CENTRAL</h3>
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
                  <p className="mt-0.5">Visite Dok's POS pronto</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsTicketOpen(false)}>
              Cerrar
            </Button>
            <Button 
              className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10 flex items-center gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
