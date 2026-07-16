import React from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelpDialog({ open, onOpenChange }: ShortcutsHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-655 dark:text-indigo-400" />
            Atajos de Teclado
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-450">
            Acelera tu flujo de trabajo en caja usando estas teclas rápidas:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {[
            { key: 'F2', action: 'Enfoca automáticamente la barra de búsqueda de productos.' },
            { key: 'F4', action: 'Abre el diálogo de cobro rápido / artículo libre.' },
            { key: 'F8', action: 'Enfoca la entrada de cobro en efectivo o el botón de registrar.' },
            { key: 'Esc', action: 'Cierra cualquier panel, modal o diálogo abierto.' },
          ].map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0 last:pb-0"
            >
              <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] font-black border border-slate-200 dark:border-slate-700/80 shadow-xs min-w-[32px] text-center">
                {shortcut.key}
              </span>
              <span className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{shortcut.action}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" className="text-xs rounded-xl w-full cursor-pointer" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
