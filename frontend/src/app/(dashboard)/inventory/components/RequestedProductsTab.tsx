import React from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  PackageCheck
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/CustomSelect';
import { useRequestedProducts } from '../hooks/useRequestedProducts';
import { RequestedProductFormDialog } from './RequestedProductFormDialog';

export function RequestedProductsTab() {
  const {
    products,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isFormOpen,
    setIsFormOpen,
    handleCreate,
    handleUpdateStatus,
    handleDelete,
  } = useRequestedProducts();

  return (
    <div className="space-y-6">
      
      {/* FILTROS + ACCION */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        
        {/* Lado izquierdo: buscador y selectores */}
        <div className="flex flex-col sm:flex-row gap-2 flex-grow items-stretch sm:items-center">
          <div className="relative w-full sm:w-[240px] md:w-[280px] lg:w-[320px] xl:w-[360px] shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar artículo..."
              className="pl-10 h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-semibold focus-visible:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <CustomSelect
              className="w-full h-10"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as 'ALL' | 'PENDIENTE' | 'COMPRADO' | 'CANCELADO')}
              options={[
                { value: 'ALL', label: 'Todos los Pedidos' },
                { value: 'PENDIENTE', label: 'Pendientes' },
                { value: 'COMPRADO', label: 'Comprados / Surtidos' },
                { value: 'CANCELADO', label: 'Cancelados' },
              ]}
            />
          </div>
        </div>

        {/* Lado derecho: botón de agregar pedido */}
        <div className="shrink-0">
          <Button 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow px-5 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" /> Registrar Pedido Especial
          </Button>
        </div>
      </div>

      {/* TABLA DE ARTICULOS SOLICITADOS */}
      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs animate-pulse">
            Cargando solicitudes de clientes...
          </div>
        ) : products.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b dark:border-slate-800/60">
                <TableHead className="text-xs font-bold text-slate-500">Artículo Solicitado</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500 w-28">Cantidad</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500 w-36">Estado</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500 w-44">Acciones de Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y dark:divide-slate-800/60">
              {products.map((p) => {
                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 border-b dark:border-slate-800/60 transition-all"
                  >
                    <TableCell className="py-3.5">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{p.name}</span>
                        {p.notes && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1.5 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg border border-slate-100/50 dark:border-slate-800/30 max-w-md w-fit">
                            {p.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center font-bold text-xs">
                      {p.quantity} u
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          p.status === 'COMPRADO' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] px-2 py-0.5' 
                            : p.status === 'CANCELADO'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-bold text-[9px] px-2 py-0.5'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-none font-bold text-[9px] px-2 py-0.5 animate-pulse'
                        }
                      >
                        {p.status === 'COMPRADO' ? 'COMPRADO / SURTIDO' : p.status === 'CANCELADO' ? 'CANCELADO' : 'PENDIENTE'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status === 'PENDIENTE' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg cursor-pointer"
                              onClick={() => handleUpdateStatus(p.id, p.name, 'COMPRADO')}
                              title="Marcar como Comprado"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg cursor-pointer"
                              onClick={() => handleUpdateStatus(p.id, p.name, 'CANCELADO')}
                              title="Cancelar Pedido"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-semibold text-xs flex flex-col items-center justify-center gap-2">
            <PackageCheck className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            <span>No hay artículos anotados en la lista de solicitudes.</span>
          </div>
        )}
      </div>

      <RequestedProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
