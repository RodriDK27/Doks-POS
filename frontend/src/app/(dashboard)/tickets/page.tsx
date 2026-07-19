'use client';

import React from 'react';
import { 
  ArrowLeft, 
  Search, 
  Eye
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';

import { useTickets } from './hooks/useTickets';
import { TicketDetailsDialog } from './components/TicketDetailsDialog';

export default function TicketsPage() {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    selectedDateFilter,
    setSelectedDateFilter,
    selectedSale,
    setSelectedSale,
    isTicketOpen,
    setIsTicketOpen,
    handlePrint,
    filteredSales
  } = useTickets();

  return (
    <div className="space-y-6 w-full pb-8 animate-in fade-in duration-200">
      
      {/* ESTILOS CSS INYECTADOS EXCLUSIVOS PARA IMPRESIÓN */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          #thermal-ticket-print, #thermal-ticket-print * {
            visibility: visible;
          }
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
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Historial de Tickets</h1>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por Folio, Cliente o método..."
            className="pl-9 h-11 border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <CustomSelect
          className="w-44"
          value={selectedDateFilter}
          onChange={(val) => setSelectedDateFilter(val as 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK')}
          options={[
            { value: 'ALL', label: 'Todas las Ventas' },
            { value: 'TODAY', label: 'Solo Hoy' },
            { value: 'YESTERDAY', label: 'Ayer' },
            { value: 'WEEK', label: 'Últimos 7 Días' },
          ]}
        />
      </div>

      {/* TABLA DE HISTORIAL (RESPONSIVA) */}
      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b last:border-0">
                <Skeleton className="h-4.5 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4.5 w-24" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
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
                  <TableCell className="text-slate-455 text-xs">
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
                      className="h-8 text-[10px] font-extrabold text-indigo-650 hover:bg-indigo-50 px-2.5 rounded-lg flex items-center gap-1 mx-auto cursor-pointer"
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

      {/* DIÁLOGO VISUAL DEL RECIBO TÉRMICO */}
      <TicketDetailsDialog
        open={isTicketOpen}
        onOpenChange={setIsTicketOpen}
        selectedSale={selectedSale}
        onPrint={handlePrint}
      />
    </div>
  );
}
