'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  menuPlacement?: 'top' | 'bottom';
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className,
  menuPlacement = 'bottom',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 border border-slate-200 dark:border-slate-800 rounded-xl px-4 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left focus:outline-none focus:ring-1 focus:ring-indigo-500",
          className
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isOpen && "transform rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-[999] max-h-60 overflow-y-auto animate-in fade-in duration-150",
          menuPlacement === 'top' ? "bottom-full mb-1.5 slide-in-from-bottom-1" : "top-full mt-1.5 slide-in-from-top-1"
        )}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-xs font-semibold block transition-colors duration-150 cursor-pointer",
                  isSelected 
                    ? "bg-indigo-50 dark:bg-indigo-955/40 text-indigo-650 dark:text-indigo-400" 
                    : "text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
