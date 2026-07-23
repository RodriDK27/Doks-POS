'use client';

import React from 'react';
import { Save, Package, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../../types';

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
  isSubmitting: boolean;
  onSaveProductForm: (e: React.FormEvent) => void;
}

export function EditTab({
  selectedProduct,
  prodForm,
  setProdForm,
  isSubmitting,
  onSaveProductForm,
}: EditTabProps) {
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
        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Código de Barras</label>
        <Input
          type="text"
          placeholder="Escaneado o manual..."
          className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
          value={prodForm.barcode}
          onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
        />
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
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Categoría</label>
          <Input
            type="text"
            placeholder="Ej. Abarrotes"
            className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200"
            value={prodForm.category}
            onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
          />
        </div>
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
