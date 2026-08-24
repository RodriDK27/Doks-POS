'use client';

import React, { useState } from 'react';
import { Save, Package, Scale, Barcode, Plus, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../../types';
import { CustomSelect } from '@/components/CustomSelect';

interface EditTabProps {
  selectedProduct: Product | null;
  prodForm: {
    name: string;
    barcode: string;
    sellPrice: string;
    purchasePrice: string;
    stock: string;
    minStock: string;
    category: string;
    unitType: 'PIECE' | 'WEIGHT';
  };
  setProdForm: React.Dispatch<React.SetStateAction<{
    name: string;
    barcode: string;
    sellPrice: string;
    purchasePrice: string;
    stock: string;
    minStock: string;
    category: string;
    unitType: 'PIECE' | 'WEIGHT';
  }>>;
  additionalBarcodes?: Array<{ barcode: string; label?: string | null }>;
  setAdditionalBarcodes?: React.Dispatch<React.SetStateAction<Array<{ barcode: string; label?: string | null }>>>;
  isSubmitting: boolean;
  onSaveProductForm: (e: React.FormEvent) => void;
  categories?: string[];
}

export function EditTab({
  selectedProduct,
  prodForm,
  setProdForm,
  additionalBarcodes = [],
  setAdditionalBarcodes,
  isSubmitting,
  onSaveProductForm,
  categories = [],
}: EditTabProps) {
  const [newSecBarcode, setNewSecBarcode] = useState('');

  const handleAddSecondaryBarcode = () => {
    const code = newSecBarcode.trim();
    if (!code || !setAdditionalBarcodes) return;
    if (prodForm.barcode && code === prodForm.barcode.trim()) return;
    if (additionalBarcodes.some((b) => b.barcode.toLowerCase() === code.toLowerCase())) return;

    setAdditionalBarcodes((prev) => [
      ...prev,
      { barcode: code, label: null },
    ]);
    setNewSecBarcode('');
  };

  const handleRemoveSecondaryBarcode = (index: number) => {
    if (!setAdditionalBarcodes) return;
    setAdditionalBarcodes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={onSaveProductForm} className="space-y-3 animate-in fade-in duration-150 py-1">
      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
        {selectedProduct ? `Editando: ${selectedProduct.name}` : 'Registrando Nuevo Producto'}
      </span>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Nombre del Producto *</label>
        <Input
          type="text"
          placeholder="Nombre del producto..."
          className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
          value={prodForm.name}
          onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tipo de Venta *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`h-9 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              prodForm.unitType === 'PIECE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            onClick={() => setProdForm({ ...prodForm, unitType: 'PIECE' })}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Pieza / Unidad</span>
          </button>

          <button
            type="button"
            className={`h-9 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              prodForm.unitType === 'WEIGHT'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            onClick={() => setProdForm({ ...prodForm, unitType: 'WEIGHT' })}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>A Granel (Kg)</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Código de Barras Principal</label>
        <Input
          type="text"
          placeholder="Escaneado o manual..."
          className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 font-mono"
          value={prodForm.barcode}
          onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
        />
      </div>

      {/* CÓDIGOS DE BARRAS ADICIONALES / ALTERNATIVOS (MÓVIL) */}
      <div className="p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="h-3 w-3 text-indigo-500" />
            <span>Códigos Adicionales</span>
          </label>
          {additionalBarcodes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black">
              {additionalBarcodes.length} extra{additionalBarcodes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Escanear o teclear código extra..."
              value={newSecBarcode}
              onChange={(e) => setNewSecBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSecondaryBarcode();
                }
              }}
              className="pl-8 h-9 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSecondaryBarcode}
            disabled={!newSecBarcode.trim()}
            className="h-9 px-3 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer flex items-center justify-center shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Agregar</span>
          </Button>
        </div>

        {additionalBarcodes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {additionalBarcodes.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 text-[10px] shadow-2xs"
              >
                <Barcode className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {item.barcode}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSecondaryBarcode(index)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Precio Compra ($)</label>
          <Input
            type="number"
            step="0.50"
            placeholder="0.00"
            className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
            value={prodForm.purchasePrice}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setProdForm({ ...prodForm, purchasePrice: e.target.value })}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase block mb-1">
            {prodForm.unitType === 'WEIGHT' ? 'Precio x Kg ($) *' : 'Precio Venta ($) *'}
          </label>
          <Input
            type="number"
            step="0.50"
            placeholder="0.00"
            className="h-10 text-xs font-black rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 focus-visible:ring-indigo-500"
            value={prodForm.sellPrice}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setProdForm({ ...prodForm, sellPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
            {prodForm.unitType === 'WEIGHT' ? 'Stock Inicial (Kg)' : 'Stock Inicial'}
          </label>
          <Input
            type="number"
            placeholder="0"
            className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
            value={prodForm.stock}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase block mb-1">Alerta Stock Bajo</label>
          <Input
            type="number"
            placeholder="5"
            className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
            value={prodForm.minStock}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setProdForm({ ...prodForm, minStock: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Categoría</label>
        <CustomSelect
          value={prodForm.category}
          onChange={(val) => setProdForm({ ...prodForm, category: val })}
          placeholder="-- Seleccionar categoría --"
          options={[
            { value: '', label: '-- Seleccionar categoría --' },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !prodForm.name.trim() || !prodForm.sellPrice}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-11 rounded-xl cursor-pointer mt-2 active:scale-98 shadow-md"
      >
        <Save className="h-4 w-4 mr-1.5" /> {selectedProduct ? 'Actualizar Producto' : 'Guardar Nuevo Producto'}
      </Button>
    </form>
  );
}
