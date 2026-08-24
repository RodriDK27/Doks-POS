'use client';

import React, { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Truck,
  Package,
  Store,
  ShoppingBag,
  Boxes,
  Utensils,
  Coffee,
  Layers,
  Zap,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Landmark,
  Coins,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/CustomSelect';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseAxiosError } from '@/lib/errorMapper';
import { DailySupplierTemplate } from '../types';
import { Product, Supplier } from '../../inventory/types';

interface DailySuppliersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplateId?: string | null;
  initialMode?: 'RESTOCK' | 'CREATE';
  activeRegisterBalance?: number;
  onSuccess?: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'Truck', label: 'Camión' },
  { id: 'Package', label: 'Paquete' },
  { id: 'Store', label: 'Tienda' },
  { id: 'ShoppingBag', label: 'Bolsa' },
  { id: 'Boxes', label: 'Cajas' },
  { id: 'Utensils', label: 'Comida' },
  { id: 'Coffee', label: 'Café' },
  { id: 'Layers', label: 'Capas' },
  { id: 'Zap', label: 'Rápido' },
];

const AVAILABLE_COLORS = [
  { value: 'amber', label: 'Ámbar (Panadería)' },
  { value: 'emerald', label: 'Esmeralda (Tortillería)' },
  { value: 'sky', label: 'Celeste (Lácteos/Bebidas)' },
  { value: 'indigo', label: 'Índigo (Abarrotes)' },
  { value: 'rose', label: 'Rosa (Carnes/Embutidos)' },
  { value: 'violet', label: 'Violeta (Dulces/Snacks)' },
];

export const renderTemplateIcon = (iconName?: string, className: string = 'h-4 w-4 shrink-0') => {
  switch (iconName) {
    case 'Store':
      return <Store className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Package':
      return <Package className={className} />;
    case 'Truck':
    default:
      return <Truck className={className} />;
  }
};

function DailySuppliersModalContent({
  onOpenChange,
  initialTemplateId = null,
  initialMode = 'RESTOCK',
  onSuccess,
}: Omit<DailySuppliersModalProps, 'open'>) {
  const { data: templates = [], mutate: mutateTemplates } = useSWR<DailySupplierTemplate[]>('/daily-templates');
  const { data: products = [] } = useSWR<Product[]>('/products');
  const { data: suppliers = [] } = useSWR<Supplier[]>('/suppliers');

  // Estado general
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => {
    return initialTemplateId || templates[0]?.id || null;
  });
  const [viewMode, setViewMode] = useState<'RESTOCK' | 'CREATE' | 'EDIT'>(() => {
    if (initialMode === 'CREATE' || templates.length === 0) return 'CREATE';
    return 'RESTOCK';
  });

  // Estado para Recepción / Pago express
  const [paymentSource, setPaymentSource] = useState<'CAJA_GRANDE' | 'CAJA_CHICA'>('CAJA_GRANDE');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const target = templates.find((t) => t.id === (initialTemplateId || templates[0]?.id));
    if (!target) return {};
    const qty: Record<string, number> = {};
    target.items.forEach((item) => {
      qty[item.productId] = item.defaultQty;
    });
    return qty;
  });
  const [unitCosts, setUnitCosts] = useState<Record<string, number>>(() => {
    const target = templates.find((t) => t.id === (initialTemplateId || templates[0]?.id));
    if (!target) return {};
    const cost: Record<string, number> = {};
    target.items.forEach((item) => {
      cost[item.productId] =
        item.defaultCost !== null && item.defaultCost !== undefined
          ? item.defaultCost
          : item.product?.purchasePrice || 0;
    });
    return cost;
  });
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Estado para Crear / Editar plantilla
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Truck');
  const [formColor, setFormColor] = useState('amber');
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formItems, setFormItems] = useState<Array<{ productId: string; defaultQty: number; defaultCost?: number }>>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleStartCreate = () => {
    setViewMode('CREATE');
    setSelectedTemplateId(null);
    setFormName('');
    setFormIcon('Truck');
    setFormColor('amber');
    setFormSupplierId('');
    setFormItems([]);
    setProductSearchQuery('');
  };

  const handleSelectTemplateForRestock = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    setSelectedTemplateId(tpl.id);
    setViewMode('RESTOCK');

    const initialQty: Record<string, number> = {};
    const initialCost: Record<string, number> = {};
    tpl.items.forEach((item) => {
      initialQty[item.productId] = item.defaultQty;
      initialCost[item.productId] =
        item.defaultCost !== null && item.defaultCost !== undefined
          ? item.defaultCost
          : item.product?.purchasePrice || 0;
    });
    setQuantities(initialQty);
    setUnitCosts(initialCost);
  };

  const handleStartEditCurrent = () => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;

    setViewMode('EDIT');
    setFormName(tpl.name);
    setFormIcon(tpl.icon || 'Truck');
    setFormColor(tpl.color || 'amber');
    setFormSupplierId(tpl.supplierId || '');
    setFormItems(
      tpl.items.map((i) => ({
        productId: i.productId,
        defaultQty: i.defaultQty,
        defaultCost: i.defaultCost ?? i.product?.purchasePrice ?? 0,
      }))
    );
    setProductSearchQuery('');
  };

  const effectiveSelectedId = selectedTemplateId || templates[0]?.id || null;
  const currentTemplate = templates.find((t) => t.id === effectiveSelectedId);

  const totalToPay = currentTemplate
    ? currentTemplate.items.reduce((sum, item) => {
        const qty = quantities[item.productId] ?? item.defaultQty;
        const cost = unitCosts[item.productId] ?? (item.defaultCost || item.product?.purchasePrice || 0);
        return sum + qty * cost;
      }, 0)
    : 0;

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate) return;

    const itemsToPurchase = currentTemplate.items
      .filter((item) => (quantities[item.productId] ?? item.defaultQty) > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: quantities[item.productId] ?? item.defaultQty,
        costPrice: unitCosts[item.productId] ?? (item.defaultCost || item.product?.purchasePrice || 0),
      }));

    if (itemsToPurchase.length === 0) {
      toast.error('Ingresa al menos una cantidad mayor a 0 para recibir mercancía.');
      return;
    }

    try {
      setIsSubmittingRestock(true);
      await api.post('/purchases', {
        supplierId: currentTemplate.supplierId || undefined,
        items: itemsToPurchase,
        paymentSource: paymentSource,
        payFromRegister: paymentSource === 'CAJA_CHICA',
        notes: `Recepción express: ${currentTemplate.name}`,
      });

      const sourceLabel = paymentSource === 'CAJA_GRANDE' ? 'Caja Grande' : 'Caja Chica';
      toast.success(
        `¡${currentTemplate.name}: Pago de $${totalToPay.toFixed(2)} (${sourceLabel}) y stock actualizado!`
      );

      mutate('/register/active');
      mutate('/register');
      mutate('/products');
      mutate('/vault');
      mutate('/reports');

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al procesar recepción de mercancía.'));
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Filtrado de productos para agregar mediante buscador
  const filteredProductsToAdd = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return products.filter((p) => {
      const alreadyInTemplate = formItems.some((fi) => fi.productId === p.id);
      if (alreadyInTemplate) return false;
      const matchName = p.name.toLowerCase().includes(query);
      const matchBarcode = p.barcode?.toLowerCase().includes(query);
      const matchSecondary = p.barcodes?.some((b) => b.barcode.toLowerCase().includes(query));
      return matchName || matchBarcode || matchSecondary;
    });
  }, [products, formItems, productSearchQuery]);

  const handleAddProductFromSearch = (prod: Product) => {
    setFormItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        defaultQty: 10,
        defaultCost: prod.purchasePrice || 0,
      },
    ]);
    setProductSearchQuery('');
    toast.success(`"${prod.name}" añadido a la plantilla.`);
  };

  const handleRemoveItemFromForm = (productId: string) => {
    setFormItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('El nombre de la plantilla es obligatorio.');
      return;
    }

    const payload = {
      name: formName.trim(),
      icon: formIcon,
      color: formColor,
      supplierId: formSupplierId || undefined,
      items: formItems.map((item) => ({
        productId: item.productId,
        defaultQty: item.defaultQty,
        defaultCost: item.defaultCost,
      })),
    };

    try {
      setIsSavingTemplate(true);
      if (viewMode === 'CREATE') {
        const res = await api.post('/daily-templates', payload);
        toast.success(`Plantilla "${formName}" creada con éxito.`);
        await mutateTemplates();
        if (res.data?.id) {
          handleSelectTemplateForRestock(res.data.id);
        }
      } else if (selectedTemplateId) {
        await api.patch(`/daily-templates/${selectedTemplateId}`, payload);
        toast.success(`Plantilla "${formName}" actualizada.`);
        await mutateTemplates();
        handleSelectTemplateForRestock(selectedTemplateId);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar plantilla.'));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la plantilla "${name}"?`)) return;
    try {
      await api.delete(`/daily-templates/${id}`);
      toast.success(`Plantilla "${name}" eliminada.`);
      const remaining = templates.filter((t) => t.id !== id);
      await mutateTemplates();
      if (remaining.length > 0) {
        handleSelectTemplateForRestock(remaining[0].id);
      } else {
        handleStartCreate();
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al eliminar plantilla.'));
    }
  };

  return (
    <DialogContent className="sm:max-w-[560px] max-h-[92vh] flex flex-col rounded-3xl animate-in fade-in duration-200 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 gap-4">
      {/* HEADER LIMPIO */}
      <DialogHeader className="shrink-0 space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="font-black text-slate-800 dark:text-slate-100 text-base">
              Proveedores Diarios
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Paga y suma stock en un solo paso.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* PESTAÑAS SUPERIORES (LISTA DE PROVEEDORES + NUEVA) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        {templates.map((tpl) => {
          const isActive = viewMode === 'RESTOCK' && effectiveSelectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplateForRestock(tpl.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {renderTemplateIcon(tpl.icon, 'h-3.5 w-3.5')}
              <span>{tpl.name}</span>
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {tpl.items.length}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleStartCreate}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 border border-dashed ${
            viewMode === 'CREATE'
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black'
              : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {/* MODO RECEPCIÓN Y PAGO EXPRESS */}
      {viewMode === 'RESTOCK' && currentTemplate ? (
        <form onSubmit={handleRestockSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* CONTROL SUPERIOR: ORIGEN DE PAGO + OPCIONES */}
          <div className="flex items-center justify-between gap-2">
            {/* SELECTOR COMPACTO DE CAJA GRANDE / CAJA CHICA (SIN PRECIOS) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentSource('CAJA_GRANDE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentSource === 'CAJA_GRANDE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>Caja Grande</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentSource('CAJA_CHICA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentSource === 'CAJA_CHICA'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Coins className="h-3.5 w-3.5" />
                <span>Caja Chica</span>
              </button>
            </div>

            {/* ACCIONES DE PLANTILLA (EDITAR / ELIMINAR) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStartEditCurrent}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Editar productos de esta plantilla"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(currentTemplate.id, currentTemplate.name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Eliminar plantilla"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* LISTADO CLARO Y SENCILLO DE PRODUCTOS */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-1 max-h-56">
            {currentTemplate.items.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                <p>Esta plantilla aún no tiene productos configurados.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStartEditCurrent}
                  className="text-xs font-bold rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Añadir productos
                </Button>
              </div>
            ) : (
              currentTemplate.items.map((item) => {
                const qty = quantities[item.productId] ?? item.defaultQty;
                const cost = unitCosts[item.productId] ?? (item.defaultCost || item.product?.purchasePrice || 0);
                const subtotal = qty * cost;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    {/* NOMBRE Y EXISTENCIA */}
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block truncate">
                        {item.product?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.product?.stock ?? 0} {item.product?.unitType === 'WEIGHT' ? 'kg' : 'uds'} en inventario
                      </span>
                    </div>

                    {/* CANTIDAD (STEPPER) */}
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantities((prev) => ({ ...prev, [item.productId]: Math.max(0, qty - 1) }))}
                        className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={qty}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [item.productId]: parseFloat(e.target.value) || 0 }))}
                        className="h-7 w-12 text-center text-xs font-black bg-transparent focus:outline-hidden p-0"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantities((prev) => ({ ...prev, [item.productId]: qty + 1 }))}
                        className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* COSTO UNITARIO */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl px-2 py-1 border border-slate-200/80 dark:border-slate-800 shrink-0">
                      <span className="text-[9.5px] text-slate-400 font-bold">$ c/u:</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={cost}
                        onChange={(e) => setUnitCosts((prev) => ({ ...prev, [item.productId]: parseFloat(e.target.value) || 0 }))}
                        className="h-5 w-12 text-right text-xs font-bold bg-transparent focus:outline-hidden p-0"
                      />
                    </div>

                    {/* SUBTOTAL */}
                    <div className="w-16 text-right shrink-0">
                      <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* BOTÓN DE ACCIÓN Y TOTAL */}
          <DialogFooter className="flex-row justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold rounded-xl h-11 px-5 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingRestock || totalToPay <= 0}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 px-6 rounded-xl cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Pagar y Sumar Stock (${totalToPay.toFixed(2)})</span>
            </Button>
          </DialogFooter>
        </form>
      ) : (
        /* MODO FORMULARIO: CREAR O EDITAR PLANTILLA CON BUSCADOR DINÁMICO E ICONOS ORDENADOS */
        <form onSubmit={handleSaveTemplate} className="flex flex-col flex-1 min-h-0 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
              {viewMode === 'CREATE' ? 'Crear Nueva Plantilla' : `Editando: ${formName || 'Plantilla'}`}
            </span>
            {templates.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectTemplateForRestock(templates[0].id)}
                className="text-[10.5px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
            {/* NOMBRE DE LA PLANTILLA (ANCHO COMPLETO Y CÓMODO) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nombre de la Plantilla *</label>
              <Input
                type="text"
                required
                placeholder="Ej. Panadería, Tortillería, Lácteos, Refrescos..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl"
                autoFocus
              />
            </div>

            {/* SELECTOR DE ICONOS ORDENADO CON ESPACIO */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Icono Representativo</label>
              <div className="grid grid-cols-9 gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                {AVAILABLE_ICONS.map((icon) => {
                  const isSelected = formIcon === icon.id;
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setFormIcon(icon.id)}
                      title={icon.label}
                      className={`h-9 w-full rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-500/30'
                          : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      {renderTemplateIcon(icon.id, 'h-4 w-4')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLOR Y PROVEEDOR */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Color Temático</label>
                <CustomSelect
                  value={formColor}
                  onChange={setFormColor}
                  options={AVAILABLE_COLORS.map((c) => ({ value: c.value, label: c.label }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proveedor (Opcional)</label>
                <CustomSelect
                  value={formSupplierId}
                  onChange={setFormSupplierId}
                  placeholder="-- Sin asignar --"
                  options={[
                    { value: '', label: '-- Sin asignar --' },
                    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>
            </div>

            {/* BÚSQUEDA DINÁMICA DE PRODUCTOS (IDÉNTICA A MODO EXPRESS / POS) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Productos incluidos en la plantilla ({formItems.length})
                </label>
              </div>

              {/* BUSCADOR CON FILTRADO EN TIEMPO REAL */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Escribe el nombre o código para buscar y añadir..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold w-full shadow-2xs"
                />
                {productSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* RESULTADOS INSTANTÁNEOS DEL BUSCADOR */}
              {productSearchQuery.trim() && (
                <div className="max-h-48 overflow-y-auto space-y-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg animate-in fade-in duration-150">
                  {filteredProductsToAdd.length > 0 ? (
                    filteredProductsToAdd.slice(0, 10).map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block truncate">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ${(prod.purchasePrice || 0).toFixed(2)} costo | Stock: {prod.stock ?? 0} {prod.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddProductFromSearch(prod)}
                          className="h-8 px-3 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Añadir
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No se encontraron productos coincidentes con &quot;{productSearchQuery}&quot;.
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE PRODUCTOS YA AGREGADOS A LA PLANTILLA */}
              {formItems.length > 0 ? (
                <div className="space-y-2 pt-1 max-h-44 overflow-y-auto pr-1">
                  {formItems.map((fi) => {
                    const prod = products.find((p) => p.id === fi.productId);
                    if (!prod) return null;

                    return (
                      <div
                        key={fi.productId}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {prod.name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 block">
                            Stock: {prod.stock ?? 0} {prod.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[9px] text-slate-400 uppercase font-black">CANT:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={fi.defaultQty}
                              onChange={(e) =>
                                setFormItems((prev) =>
                                  prev.map((i) =>
                                    i.productId === fi.productId ? { ...i, defaultQty: parseFloat(e.target.value) || 1 } : i
                                  )
                                )
                              }
                              className="h-5 w-12 text-center text-xs font-black bg-transparent focus:outline-hidden p-0"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[9px] text-slate-400 uppercase font-black">$ COSTO:</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={fi.defaultCost ?? prod.purchasePrice}
                              onChange={(e) =>
                                setFormItems((prev) =>
                                  prev.map((i) =>
                                    i.productId === fi.productId ? { ...i, defaultCost: parseFloat(e.target.value) || 0 } : i
                                  )
                                )
                              }
                              className="h-5 w-12 text-center text-xs font-bold bg-transparent focus:outline-hidden p-0"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromForm(fi.productId)}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                            title="Quitar producto de la plantilla"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-400 italic text-center py-2">
                  Busca y añade los productos que recibes con este proveedor.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (templates.length > 0) {
                  handleSelectTemplateForRestock(templates[0].id);
                } else {
                  onOpenChange(false);
                }
              }}
              className="text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSavingTemplate || !formName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl h-10 px-6 cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{viewMode === 'CREATE' ? 'Guardar y Usar' : 'Actualizar Plantilla'}</span>
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}

export function DailySuppliersModal({
  open,
  onOpenChange,
  ...props
}: DailySuppliersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <DailySuppliersModalContent onOpenChange={onOpenChange} {...props} />}
    </Dialog>
  );
}
