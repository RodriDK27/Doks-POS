'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Layers, Search, Check, X, AlertCircle, ImageOff, Camera, Loader2 } from 'lucide-react';
import { Category } from '../types';
import { parseAxiosError } from '@/lib/errorMapper';
import { getProductImageSrc, uploadImage } from '@/lib/productImages';

// Errores de compresión (formato no soportado, ej. HEIC en navegadores viejos) no vienen de axios
function imageErrorMessage(err: unknown): string {
  return axios.isAxiosError(err)
    ? parseAxiosError(err, 'No se pudo subir la imagen.')
    : 'No se pudo leer la imagen. Intenta con otra foto.';
}

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (newCategoryName: string) => void;
}

export function CategoryManagementModal({
  open,
  onOpenChange,
  onCategoryCreated,
}: CategoryManagementModalProps) {
  const { data: categories = [], isLoading } = useSWR<Category[]>(open ? '/categories' : null);

  const [search, setSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Imagen de la nueva categoría (lo que ve el modo abuela): se sube justo después de crearla
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);
  const newImagePreview = useMemo(() => (newCategoryImage ? URL.createObjectURL(newCategoryImage) : null), [newCategoryImage]);
  useEffect(() => () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
  }, [newImagePreview]);

  // Cambiar/quitar la imagen de una categoría existente directo desde su renglón
  const rowImageInputRef = useRef<HTMLInputElement>(null);
  const [imageTargetId, setImageTargetId] = useState<string | null>(null);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  // Edición en línea
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Eliminación
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const refreshCategories = () => {
    mutate('/categories');
    mutate('/products/categories');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Ingresa el nombre de la categoría');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });

      toast.success(`Categoría "${response.data.name}" creada correctamente`);
      const createdName = response.data.name;
      if (newCategoryImage) {
        try {
          await uploadImage(`/categories/${response.data.id}/image`, newCategoryImage);
        } catch (err) {
          toast.error(`La categoría se creó, pero la imagen no: ${imageErrorMessage(err)}`);
        }
      }
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryImage(null);
      refreshCategories();
      if (onCategoryCreated) {
        onCategoryCreated(createdName);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al crear la categoría'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDesc(category.description || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    try {
      await api.patch(`/categories/${id}`, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      toast.success('Categoría actualizada');
      cancelEditing();
      refreshCategories();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al actualizar categoría'));
    }
  };

  const pickRowImage = (id: string) => {
    setImageTargetId(id);
    rowImageInputRef.current?.click();
  };

  const handleRowImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Permite volver a elegir el mismo archivo
    const id = imageTargetId;
    if (!file || !id) return;
    setBusyImageId(id);
    try {
      await uploadImage(`/categories/${id}/image`, file);
      toast.success('Imagen de la categoría guardada');
      refreshCategories();
    } catch (err) {
      toast.error(imageErrorMessage(err));
    } finally {
      setBusyImageId(null);
    }
  };

  const handleRemoveRowImage = async (id: string) => {
    setBusyImageId(id);
    try {
      await api.delete(`/categories/${id}/image`);
      toast.success('Imagen quitada');
      refreshCategories();
    } catch (err) {
      toast.error(parseAxiosError(err, 'No se pudo quitar la imagen.'));
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoría eliminada');
      setDeletingCategory(null);
      refreshCategories();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al eliminar categoría'));
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[720px] md:max-w-[780px] max-h-[90vh] rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-850 dark:text-slate-100">
                Gestión de Categorías
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Crea y administra las categorías oficiales de tu inventario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1 text-xs">

          {/* FORMULARIO DE NUEVA CATEGORÍA */}
          <form onSubmit={handleCreateCategory} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              + Agregar Nueva Categoría
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => newImageInputRef.current?.click()}
                title="Imagen para el modo abuela"
                className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 flex items-center justify-center cursor-pointer"
              >
                {newImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                  <img src={newImagePreview} alt="Imagen de la categoría" className="h-full w-full object-contain" />
                ) : (
                  <Camera className="h-6 w-6 text-slate-400" />
                )}
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Imagen (opcional)</span>
                <span className="text-[10px] text-slate-400 block">Es el cuadro que ve el modo abuela. Si no tiene, usa la foto de un producto.</span>
                {newCategoryImage && (
                  <button
                    type="button"
                    onClick={() => setNewCategoryImage(null)}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
              <input
                ref={newImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) setNewCategoryImage(file);
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Input
                  type="text"
                  placeholder="Nombre (ej. Bebidas)*"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-9 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
            </Button>
          </form>

          {/* Un solo selector de archivo para cambiar la imagen de cualquier renglón */}
          <input ref={rowImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleRowImageFile} />

          {/* BÚSQUEDA Y LISTA DE CATEGORÍAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Categorías Registradas ({filteredCategories.length})
              </span>
              <div className="relative w-48">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-slate-400 font-semibold">Cargando categorías...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Layers className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-slate-500 font-bold text-xs">No hay categorías registradas</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Usa el formulario arriba para agregar la primera.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isEditingThis = editingId === cat.id;

                  if (isEditingThis) {
                    return (
                      <div key={cat.id} className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-xs font-bold bg-white dark:bg-slate-900 border-indigo-300"
                          />
                          <Input
                            type="text"
                            placeholder="Descripción..."
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-900 border-indigo-300"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-7 text-xs px-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateCategory(cat.id)}
                            className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Guardar
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-white dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <button
                        type="button"
                        disabled={busyImageId === cat.id}
                        onClick={() => pickRowImage(cat.id)}
                        title={cat.imageUrl ? 'Cambiar imagen' : 'Agregar imagen'}
                        className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 flex items-center justify-center cursor-pointer disabled:cursor-wait"
                      >
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- la imagen viene del backend en otro dominio, ya optimizada
                          <img src={getProductImageSrc(cat.imageUrl) ?? undefined} alt={cat.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
                        ) : (
                          <Camera className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        )}
                        {busyImageId === cat.id && (
                          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          </div>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-800 dark:text-slate-100 text-xs truncate">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {cat.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {cat.imageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Quitar imagen"
                            disabled={busyImageId === cat.id}
                            onClick={() => handleRemoveRowImage(cat.id)}
                            className="h-7 w-7 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          >
                            <ImageOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(cat)}
                          className="h-7 w-7 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingCategory(cat)}
                          className="h-7 w-7 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DIÁLOGO CONFIRMAR ELIMINACIÓN */}
        {deletingCategory && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>¿Eliminar la categoría &quot;{deletingCategory.name}&quot;?</span>
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400">
              Los productos que tengan esta categoría conservarán su texto pero la categoría dejará de estar disponible en el listado oficial.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCategory(null)}
                className="h-7 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDeleteCategory(deletingCategory.id)}
                className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Sí, Eliminar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold h-9 rounded-xl px-5"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
