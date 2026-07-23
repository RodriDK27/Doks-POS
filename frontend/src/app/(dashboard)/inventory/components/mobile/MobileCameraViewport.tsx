'use client';

import React from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileCameraViewportProps {
  viewportId: string;
  isCameraActive: boolean;
  cameraError: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export function MobileCameraViewport({
  viewportId,
  isCameraActive,
  cameraError,
  onStartCamera,
  onStopCamera,
}: MobileCameraViewportProps) {
  return (
    <div className="relative shrink-0 w-full bg-slate-950 dark:bg-black rounded-2xl overflow-hidden shadow-md border border-slate-900 aspect-video max-h-36 flex items-center justify-center">
      <div
        id={viewportId}
        className="w-full h-full object-cover overflow-hidden flex items-center justify-center [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:my-auto [&_div]:my-auto [&_#inventory-mobile-inline-viewport__scan_region]:my-auto [&_#inventory-mobile-inline-viewport__scan_region]:mx-auto"
      />

      {isCameraActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-emerald-400 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Escaneando
          </span>
          <Button
            type="button"
            size="icon"
            className="h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            onClick={onStopCamera}
          >
            <CameraOff className="h-3 w-3" />
          </Button>
        </div>
      )}

      {(!isCameraActive || cameraError) && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center z-20">
          <Camera className="h-6 w-6 text-indigo-400 mb-1 animate-pulse" />
          <p className="text-[11px] font-black text-white">{cameraError || 'Cámara en Pausa'}</p>
          <Button
            type="button"
            onClick={onStartCamera}
            className="h-6.5 mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-3 rounded-lg cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Activar Cámara
          </Button>
        </div>
      )}
    </div>
  );
}
