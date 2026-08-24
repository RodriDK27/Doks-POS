'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Settings2, Plus, Zap, Truck, Package, Store, ShoppingBag, Boxes, Utensils, Coffee, Layers } from 'lucide-react';
import { DailySupplierTemplate } from '../types';
import { DailySuppliersModal, renderTemplateIcon } from './DailySuppliersModal';

interface DailySupplierShortcutsProps {
  activeRegisterBalance?: number;
  onRefresh?: () => void;
  className?: string;
  showTitle?: boolean;
}

export function DailySupplierShortcuts({
  activeRegisterBalance,
  onRefresh,
  className = '',
  showTitle = true,
}: DailySupplierShortcutsProps) {
  const { data: templates = [], mutate: mutateTemplates } = useSWR<DailySupplierTemplate[]>('/daily-templates');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'RESTOCK' | 'CREATE'>('RESTOCK');

  const handleOpenTemplate = (tpl: DailySupplierTemplate) => {
    setSelectedTemplateId(tpl.id);
    setModalMode('RESTOCK');
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedTemplateId(null);
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80';
      case 'emerald':
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/80';
      case 'sky':
        return 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/80';
      case 'rose':
        return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/80';
      case 'violet':
        return 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-300/80 dark:border-violet-800/80';
      default:
        return 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/80';
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Proveedores y Entregas Diarias</span>
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="h-3 w-3" />
            <span>Gestionar / Nueva</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => handleOpenTemplate(tpl)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black border flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 ${getColorClasses(
              tpl.color
            )}`}
          >
            {renderTemplateIcon(tpl.icon, 'h-4 w-4 shrink-0')}
            <span>{tpl.name}</span>
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-black/40 font-bold">
              {tpl.items.length} pzas
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all hover:border-indigo-400"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {/* MODAL TODO EN UNO: SELECCIÓN + PAGO + CREACIÓN / EDICIÓN EN LA MISMA VENTANA */}
      <DailySuppliersModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialTemplateId={selectedTemplateId}
        initialMode={modalMode}
        activeRegisterBalance={activeRegisterBalance}
        onSuccess={() => {
          mutateTemplates();
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
export { renderTemplateIcon };
