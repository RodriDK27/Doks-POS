'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, X } from 'lucide-react';
import { Product } from '../types';

interface BarcodeLabelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
}

// Generador simple de Código de Barras (Code 128 sutil en SVG)
function generateBarcodeSVG(text: string) {
  // Representación muy simplificada de Code 128 o Code 39 para dibujo estático
  // Para propósitos visuales profesionales, generamos un patrón de barras a partir del hash del texto
  const safeText = text.replace(/[^a-zA-Z0-9]/g, '') || '12345678';
  let hash = 0;
  for (let i = 0; i < safeText.length; i++) {
    hash = safeText.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Patrón determinista de 40 barras
  const bars: boolean[] = [];
  const current = true;
  for (let i = 0; i < 48; i++) {
    // Generar un ancho de barra semi-aleatorio determinista basado en el hash del texto
    const bit = ((hash >> (i % 16)) & 1) === 1;
    bars.push(bit);
    if (i % 3 === 0) bars.push(false); // Espaciado
  }

  // Asegurar inicio y fin con barras fuertes
  const finalBars = [true, false, true, ...bars, true, false, true];

  return (
    <svg viewBox={`0 0 ${finalBars.length * 2} 40`} className="w-full h-10" preserveAspectRatio="none">
      {finalBars.map((isBar, index) => {
        if (!isBar) return null;
        return (
          <rect
            key={index}
            x={index * 2}
            y={0}
            width={2}
            height={40}
            className="fill-black dark:fill-slate-900"
          />
        );
      })}
    </svg>
  );
}

export function BarcodeLabelsModal({ open, onOpenChange, selectedProducts }: BarcodeLabelsModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (id: string) => quantities[id] ?? 1;
  const setQuantity = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const handlePrint = () => {
    // Crear un iframe oculto para mandar a imprimir limpiamente sin romper la UI de la app
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = selectedProducts.map(p => {
      const qty = getQuantity(p.id);
      const barcodeText = p.barcode || 'SIN-CODIGO';
      
      return Array.from({ length: qty }).map((_, idx) => `
        <div class="label-card">
          <div class="store-name">DOKS VENTA</div>
          <div class="product-name">${p.name}</div>
          <div class="barcode-container">
            ${renderSVGToString(barcodeText)}
            <div class="barcode-text">${barcodeText}</div>
          </div>
          <div class="product-price">$${p.sellPrice.toFixed(2)}</div>
        </div>
      `).join('');
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Etiquetas de Códigos de Barras</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 10mm;
              padding: 0;
              background-color: white;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 5mm;
            }
            .label-card {
              border: 1px dashed #ccc;
              padding: 4mm;
              text-align: center;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              height: 35mm;
              width: 55mm;
              page-break-inside: avoid;
            }
            .store-name {
              font-size: 8px;
              font-weight: 900;
              letter-spacing: 1px;
              color: #666;
            }
            .product-name {
              font-size: 10px;
              font-weight: bold;
              margin: 1mm 0;
              max-height: 8mm;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .barcode-container {
              width: 90%;
              text-align: center;
            }
            .barcode-container svg {
              width: 100%;
              height: 8mm;
            }
            .barcode-text {
              font-size: 8px;
              font-family: monospace;
              margin-top: 0.5mm;
              color: #444;
            }
            .product-price {
              font-size: 12px;
              font-weight: 900;
              color: #000;
            }
            @media print {
              body {
                margin: 5mm;
              }
              .label-card {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-600" />
            Configurar Impresión de Etiquetas
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecciona la cantidad de etiquetas que necesitas para cada producto antes de imprimir.
          </DialogDescription>
        </DialogHeader>

        {/* Listado de cantidades por producto */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {selectedProducts.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-slate-150 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex-1 min-w-0 pr-4">
                <span className="font-bold text-xs text-slate-850 dark:text-slate-200 block truncate">{p.name}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.barcode || 'Sin código'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Etiquetas:</span>
                <Input
                  type="number"
                  min={1}
                  className="w-16 h-8 text-center font-bold text-xs"
                  value={getQuantity(p.id)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(p.id, parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl gap-2">
          <Button variant="outline" className="text-xs rounded-xl h-10" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-5 flex items-center gap-1.5 active:scale-95 transition-all"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Imprimir Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Renderizador estático a string para usar en el script de impresión
function renderSVGToString(text: string): string {
  const safeText = text.replace(/[^a-zA-Z0-9]/g, '') || '12345678';
  let hash = 0;
  for (let i = 0; i < safeText.length; i++) {
    hash = safeText.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const bars: boolean[] = [];
  for (let i = 0; i < 48; i++) {
    const bit = ((hash >> (i % 16)) & 1) === 1;
    bars.push(bit);
    if (i % 3 === 0) bars.push(false);
  }

  const finalBars = [true, false, true, ...bars, true, false, true];
  
  const rects = finalBars.map((isBar, index) => {
    if (!isBar) return '';
    return `<rect x="${index * 2}" y="0" width="2" height="40" fill="black" />`;
  }).join('');

  return `
    <svg viewBox="0 0 ${finalBars.length * 2} 40" preserveAspectRatio="none">
      ${rects}
    </svg>
  `;
}
