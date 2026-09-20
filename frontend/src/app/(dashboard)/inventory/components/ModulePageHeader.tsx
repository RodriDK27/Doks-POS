import React from 'react';

interface ModulePageHeaderProps {
  title: string;
  /** Texto pequeño sobre el título (por defecto la sección a la que pertenece) */
  eyebrow?: string;
  actions?: React.ReactNode;
}

/** Encabezado común de los módulos de inventario (Proveedores, Solicitudes, Mermas, Rendimiento). */
export function ModulePageHeader({ title, eyebrow = 'Inventario', actions }: ModulePageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 pb-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />
          {eyebrow}
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">{title}</h1>
      </div>
      {actions}
    </div>
  );
}
