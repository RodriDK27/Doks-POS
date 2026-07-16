import { Coffee, Apple, Sparkles, Candy, Tag } from 'lucide-react';

export const getCategoryColor = (category: string | null) => {
  const cat = (category || 'OTROS').toUpperCase();
  if (cat.includes('BEBIDAS') || cat.includes('DRINKS')) {
    return {
      bg: 'bg-blue-50/65 dark:bg-blue-950/15',
      border: 'border-blue-200/60 dark:border-blue-900/30 hover:border-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      accent: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-750 dark:bg-blue-900/50 dark:text-blue-300'
    };
  }
  if (cat.includes('ABARROTES') || cat.includes('ALIMENTOS') || cat.includes('COMIDA')) {
    return {
      bg: 'bg-emerald-50/65 dark:bg-emerald-950/15',
      border: 'border-emerald-200/60 dark:border-emerald-900/30 hover:border-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      accent: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    };
  }
  if (cat.includes('LIMPIEZA') || cat.includes('CLEANING')) {
    return {
      bg: 'bg-purple-50/65 dark:bg-purple-950/15',
      border: 'border-purple-200/60 dark:border-purple-900/30 hover:border-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      accent: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
    };
  }
  if (cat.includes('DULCES') || cat.includes('SABRITAS') || cat.includes('BOTANAS') || cat.includes('SNACKS')) {
    return {
      bg: 'bg-amber-50/65 dark:bg-amber-950/15',
      border: 'border-amber-200/60 dark:border-amber-900/30 hover:border-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      accent: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    };
  }
  return {
    bg: 'bg-slate-50/65 dark:bg-slate-800/15',
    border: 'border-slate-200/60 dark:border-slate-700/30 hover:border-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    accent: 'text-indigo-650 dark:text-indigo-400',
    badge: 'bg-slate-105 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  };
};

export const getCategoryIcon = (category: string | null) => {
  const cat = (category || '').toUpperCase();
  if (cat.includes('BEBIDAS') || cat.includes('DRINKS')) return Coffee;
  if (cat.includes('ABARROTES') || cat.includes('ALIMENTOS') || cat.includes('COMIDA')) return Apple;
  if (cat.includes('LIMPIEZA') || cat.includes('CLEANING')) return Sparkles;
  if (cat.includes('DULCES') || cat.includes('SABRITAS') || cat.includes('BOTANAS') || cat.includes('SNACKS')) return Candy;
  return Tag;
};
