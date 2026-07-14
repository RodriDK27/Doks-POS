'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import PinLockGuard from '@/components/PinLockGuard';
import { toast } from 'sonner';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  CirclePercent, 
  Barcode, 
  Filter,
  RefreshCw,
  Truck,
  Phone,
  FileText,
  Check,
  Eye,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/CustomSelect';

interface Product {
  id: string;
  barcode: string | null;
  name: string;
  purchasePrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count?: {
    purchases: number;
  };
}

interface PurchaseItem {
  id: string;
  productId: string;
  product: { name: string };
  costPrice: number;
  quantity: number;
  total: number;
}

interface Purchase {
  id: string;
  supplierId: string;
  supplier: { name: string };
  total: number;
  notes: string | null;
  payFromRegister: boolean;
  cashRegisterId: string | null;
  createdAt: string;
  items: PurchaseItem[];
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'SUPPLIERS'>('CATALOG');
  
  // Catálogo Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'CRITICAL' | 'OUT_OF_STOCK'>('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    purchasePrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // ESTADOS DE PROVEEDORES Y COMPRAS
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  // Modal Proveedor
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Modal Compra
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<Supplier | null>(null);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [payFromRegister, setPayFromRegister] = useState(true);
  const [addedPurchaseItems, setAddedPurchaseItems] = useState<Array<{
    productId: string;
    productName: string;
    costPrice: number;
    quantity: number;
  }>>([]);
  const [newPurchaseItem, setNewPurchaseItem] = useState({
    productId: '',
    costPrice: 0,
    quantity: 1,
  });

  // Modal Detalle Compra
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activePurchaseDetail, setActivePurchaseDetail] = useState<Purchase | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliersData = async () => {
    try {
      setSuppliersLoading(true);
      const [suppliersRes, purchasesRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/purchases')
      ]);
      setSuppliers(suppliersRes.data);
      setPurchases(purchasesRes.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('No se pudieron cargar los datos de proveedores.');
    } finally {
      setSuppliersLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeTab === 'SUPPLIERS') {
      fetchSuppliersData();
    }
  }, [activeTab]);

  // Métricas
  const totalProductsCount = products.length;
  const totalInvestment = products.reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0);
  const expectedProfit = totalRetailValuation - totalInvestment;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;

    const matchesStock = 
      stockFilter === 'ALL' ||
      (stockFilter === 'CRITICAL' && p.stock <= p.minStock && p.stock > 0) ||
      (stockFilter === 'OUT_OF_STOCK' && p.stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      category: '',
      purchasePrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 5,
    });
    setIsFormOpen(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || '',
      purchasePrice: product.purchasePrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minStock: product.minStock,
    });
    setIsFormOpen(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del producto es obligatorio.');
      return;
    }

    if (formData.sellPrice <= 0 || formData.purchasePrice < 0) {
      toast.error('Los precios deben ser valores positivos.');
      return;
    }

    const payload = {
      ...formData,
      barcode: formData.barcode.trim() || null,
      category: formData.category.trim() || null,
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        toast.success(`Producto "${formData.name}" actualizado.`);
      } else {
        await api.post('/products', payload);
        toast.success(`Producto "${formData.name}" registrado.`);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al guardar el producto.';
      toast.error(typeof errorMsg === 'object' ? errorMsg[0] : errorMsg);
    }
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success(`El producto "${productToDelete.name}" ha sido eliminado.`);
      setIsDeleteOpen(false);
      setProductToDelete(null);
      fetchInventory();
    } catch (error) {
      toast.error('No se pudo eliminar el producto.');
    }
  };

  // HANDLERS REGISTRO PROVEEDOR
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.error('El nombre del proveedor es obligatorio.');
      return;
    }

    try {
      await api.post('/suppliers', supplierForm);
      toast.success(`Proveedor "${supplierForm.name}" registrado.`);
      setIsSupplierOpen(false);
      setSupplierForm({ name: '', phone: '', address: '' });
      fetchSuppliersData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar proveedor.');
    }
  };

  // HANDLERS REGISTRO COMPRA
  const handleOpenRegisterPurchase = (supplier: Supplier) => {
    setSelectedSupplierForPurchase(supplier);
    setPurchaseNotes('');
    setPayFromRegister(true);
    setAddedPurchaseItems([]);
    setNewPurchaseItem({ productId: '', costPrice: 0, quantity: 1 });
    setIsPurchaseOpen(true);
  };

  const handleAddPurchaseItem = () => {
    if (!newPurchaseItem.productId) {
      toast.error('Selecciona un producto del catálogo.');
      return;
    }
    if (newPurchaseItem.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a cero.');
      return;
    }

    const prod = products.find(p => p.id === newPurchaseItem.productId);
    if (!prod) return;

    // Verificar si ya está en la lista de agregados
    const existingIndex = addedPurchaseItems.findIndex(i => i.productId === newPurchaseItem.productId);
    if (existingIndex > -1) {
      const updated = [...addedPurchaseItems];
      updated[existingIndex].quantity += newPurchaseItem.quantity;
      updated[existingIndex].costPrice = newPurchaseItem.costPrice; // actualizar costo
      setAddedPurchaseItems(updated);
    } else {
      setAddedPurchaseItems([
        ...addedPurchaseItems,
        {
          productId: newPurchaseItem.productId,
          productName: prod.name,
          costPrice: newPurchaseItem.costPrice,
          quantity: newPurchaseItem.quantity,
        }
      ]);
    }

    setNewPurchaseItem({ productId: '', costPrice: 0, quantity: 1 });
  };

  const handleRemovePurchaseItemIndex = (index: number) => {
    const updated = [...addedPurchaseItems];
    updated.splice(index, 1);
    setAddedPurchaseItems(updated);
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedSupplierForPurchase) return;
    if (addedPurchaseItems.length === 0) {
      toast.error('Debes agregar al menos un artículo a la factura de compra.');
      return;
    }

    const payload = {
      supplierId: selectedSupplierForPurchase.id,
      notes: purchaseNotes.trim() || undefined,
      payFromRegister,
      items: addedPurchaseItems.map(i => ({
        productId: i.productId,
        costPrice: i.costPrice,
        quantity: i.quantity,
      })),
    };

    try {
      await api.post('/purchases', payload);
      toast.success('Compra registrada. Stock de inventario e historial de caja actualizados.');
      setIsPurchaseOpen(false);
      fetchInventory(); // Refrescar stock e info del catálogo
      fetchSuppliersData(); // Refrescar bitácoras de compra
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar la compra.');
    }
  };

  const calculatedMargin = formData.sellPrice > 0 
    ? ((formData.sellPrice - formData.purchasePrice) / formData.sellPrice) * 100 
    : 0;

  const totalInvoiceSum = addedPurchaseItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);

  return (
    <PinLockGuard>
      <div className="space-y-6 max-w-5xl mx-auto pb-6">
        
        {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
          Control de Stock
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventario de Tienda</h1>
      </div>

      {/* SECTOR DE PESTAÑAS (TABS RESPONSIVOS TÁCTILES) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md shrink-0">
        <Button
          variant={activeTab === 'CATALOG' ? 'default' : 'ghost'}
          className={cn(
            "flex-1 h-10 font-extrabold text-xs rounded-xl transition-all",
            activeTab === 'CATALOG' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          )}
          onClick={() => setActiveTab('CATALOG')}
        >
          <Package className="h-4 w-4 mr-1.5" /> Catálogo de Productos
        </Button>
        <Button
          variant={activeTab === 'SUPPLIERS' ? 'default' : 'ghost'}
          className={cn(
            "flex-1 h-10 font-extrabold text-xs rounded-xl transition-all",
            activeTab === 'SUPPLIERS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          )}
          onClick={() => setActiveTab('SUPPLIERS')}
        >
          <Truck className="h-4 w-4 mr-1.5" /> Proveedores y Compras
        </Button>
      </div>

      {activeTab === 'CATALOG' ? (
        <>
          {/* A. VISTA DE INVENTARIO / CATÁLOGO */}
          {/* METRICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Catálogo</span>
                <span className="text-xl font-black text-slate-800 block mt-1">{totalProductsCount}</span>
                <span className="text-[9px] text-slate-400 block">Artículos distintos</span>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Inversión Neta</span>
                <span className="text-xl font-black text-slate-800 block mt-1">${totalInvestment.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block">Costo de adquisición</span>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ganancia Estimada</span>
                <span className="text-xl font-black text-indigo-600 block mt-1">${expectedProfit.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block">Margen potencial</span>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bajo Stock</span>
                <span className={`text-xl font-black block mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{lowStockCount}</span>
                <span className="text-[9px] text-slate-400 block">Artículos agotándose</span>
              </CardContent>
            </Card>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar producto o código..."
                  className="pl-9 h-11 border-slate-200 rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <CustomSelect
                  className="w-40"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="-- Categorías --"
                  options={[
                    { value: '', label: '-- Categorías --' },
                    ...categories.map((c) => ({ value: c, label: c })),
                  ]}
                />

                <CustomSelect
                  className="w-40"
                  value={stockFilter}
                  onChange={(val) => setStockFilter(val as any)}
                  options={[
                    { value: 'ALL', label: 'Todo el Stock' },
                    { value: 'CRITICAL', label: 'Stock Bajo' },
                    { value: 'OUT_OF_STOCK', label: 'Agotados' },
                  ]}
                />
              </div>
            </div>

            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow px-5 flex items-center gap-1.5 active:scale-95 transition-all w-full md:w-auto justify-center"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" /> Nuevo Producto
            </Button>
          </div>

          {/* TABLA CATÁLOGO */}
          <div className="border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">Cargando inventario...</div>
            ) : filteredProducts.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b">
                    <TableHead className="text-xs font-bold text-slate-500">Producto</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Stock</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24">Venta</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-24 hidden sm:table-cell">Compra</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-500 w-20 hidden sm:table-cell">Margen</TableHead>
                    <TableHead className="w-20 text-center text-xs font-bold text-slate-500">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {filteredProducts.map((p) => {
                    const isCritical = p.stock <= p.minStock;
                    const isOut = p.stock === 0;
                    
                    const margin = p.sellPrice > 0 
                      ? ((p.sellPrice - p.purchasePrice) / p.sellPrice) * 100 
                      : 0;

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/20 border-b">
                        <TableCell className="py-3">
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{p.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {p.barcode && (
                                <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                                  <Barcode className="h-3 w-3" /> {p.barcode}
                                </span>
                              )}
                              {p.category && (
                                <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-slate-100 text-slate-500 font-bold border-none">
                                  {p.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-bold text-xs">
                          <span className={isOut ? 'text-rose-500' : isCritical ? 'text-amber-500' : 'text-slate-700'}>
                            {p.stock}
                          </span>
                          {isCritical && (
                            <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-50 px-1 py-0.5 rounded ml-1 block sm:inline-block">
                              Mín {p.minStock}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right text-slate-800 font-black text-xs">
                          ${p.sellPrice.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-slate-400 text-xs hidden sm:table-cell">
                          ${p.purchasePrice.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-emerald-500 font-bold text-xs hidden sm:table-cell">
                          {margin.toFixed(0)}%
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-500 hover:bg-slate-100"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                              onClick={() => handleOpenDelete(p)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                No se encontraron productos en el inventario.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* B. VISTA DE PROVEEDORES Y COMPRAS FACTURADAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LISTA DE PROVEEDORES (1/3 ANCHO) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Truck className="h-4 w-4 text-indigo-650" /> Proveedores Activos
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg"
                  onClick={() => setIsSupplierOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-0.5" /> Registrar
                </Button>
              </div>

              {suppliersLoading ? (
                <div className="text-slate-400 text-xs text-center py-10 bg-white border border-slate-100 rounded-2xl">Cargando proveedores...</div>
              ) : suppliers.length > 0 ? (
                <div className="space-y-3">
                  {suppliers.map((supplier) => (
                    <div 
                      key={supplier.id} 
                      className="border border-slate-100 rounded-2xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-800 block truncate">{supplier.name}</span>
                        <div className="flex flex-col gap-1.5 mt-2 text-[10px] text-slate-450 font-semibold">
                          {supplier.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {supplier.phone}</span>
                          )}
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-slate-400" /> {supplier._count?.purchases || 0} Facturas registradas</span>
                        </div>
                      </div>
                      
                      <div className="pt-2.5 border-t border-slate-50 flex gap-2">
                        <Button 
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] h-8 rounded-lg active:scale-95 transition-all"
                          onClick={() => handleOpenRegisterPurchase(supplier)}
                        >
                          Registrar Compra
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs bg-white border border-slate-100 rounded-2xl p-4">
                  No hay proveedores registrados. Haz clic en "Registrar" arriba.
                </div>
              )}
            </div>

            {/* BITÁCORA DE COMPRAS A PROVEEDORES (2/3 ANCHO) */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FileText className="h-4 w-4 text-indigo-650" /> Bitácora de Compras Realizadas
              </h3>

              <div className="border border-slate-100 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                {suppliersLoading ? (
                  <div className="py-20 text-center text-slate-400 text-xs">Cargando compras...</div>
                ) : purchases.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b">
                        <TableHead className="text-xs font-bold text-slate-500">Proveedor</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500">Fecha y Hora</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 w-24 text-center">Caja Chica</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-500 w-28">Total Compra</TableHead>
                        <TableHead className="w-20 text-center text-xs font-bold text-slate-500">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id} className="hover:bg-slate-50/20 border-b">
                          <TableCell className="font-bold text-xs text-slate-700">{purchase.supplier.name}</TableCell>
                          <TableCell className="text-slate-455 text-xs">
                            {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={purchase.payFromRegister ? 'bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] px-1.5' : 'bg-slate-50 text-slate-500 border-none font-bold text-[8px] px-1.5'}>
                              {purchase.payFromRegister ? 'SÍ' : 'NO'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-800 text-xs">
                            ${purchase.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg flex items-center gap-1.5 mx-auto"
                              onClick={() => {
                                setActivePurchaseDetail(purchase);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" /> Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    No se han registrado facturas de compras de mercancías.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL REGISTRAR PROVEEDOR */}
      <Dialog open={isSupplierOpen} onOpenChange={setIsSupplierOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Registrar Proveedor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSupplierSubmit} className="space-y-4 py-1 text-xs">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre de la Empresa / Marca *</label>
              <Input
                type="text"
                required
                placeholder="Ej. Coca-Cola, Sabritas, Bimbo..."
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Teléfono de Repartidor / Ejecutivo</label>
              <Input
                type="text"
                placeholder="Ej. 5512345678"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Dirección / Notas adicionales</label>
              <Input
                type="text"
                placeholder="Ej. Distribuidor regional oriente..."
                className="focus-visible:ring-indigo-500 h-10 text-xs"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsSupplierOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
                Guardar Proveedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRAR FACTURA DE COMPRA (ESTILO CARRITO EN MODAL) */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800 flex items-center gap-1.5">
              <Truck className="h-5 w-5 text-indigo-600" />
              Ingresar Compra de Mercancía
            </DialogTitle>
            <DialogDescription className="text-xs">
              Proveedor: <strong className="text-slate-800">{selectedSupplierForPurchase?.name}</strong>. Agrega artículos para surtir stock.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2 text-xs">
            
            {/* LADO IZQUIERDO: AGREGAR PRODUCTO (5/12 ANCHO) */}
            <div className="md:col-span-5 space-y-4 p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Agregar Artículo</span>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Seleccionar Producto</label>
                <CustomSelect
                  value={newPurchaseItem.productId}
                  onChange={(val) => {
                    const prod = products.find(p => p.id === val);
                    setNewPurchaseItem({
                      productId: val,
                      costPrice: prod ? prod.purchasePrice : 0,
                      quantity: 1
                    });
                  }}
                  placeholder="-- Producto --"
                  options={[
                    { value: '', label: '-- Producto --' },
                    ...products.map(p => ({ value: p.id, label: `${p.name} (Stock: ${p.stock.toFixed(0)})` }))
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Costo Adquisición ($)</label>
                  <Input
                    type="number"
                    step="any"
                    className="focus-visible:ring-indigo-500 h-9 font-bold text-xs"
                    value={newPurchaseItem.costPrice || ''}
                    onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Cantidad</label>
                  <Input
                    type="number"
                    step="any"
                    className="focus-visible:ring-indigo-500 h-9 font-bold text-xs"
                    value={newPurchaseItem.quantity || ''}
                    onChange={(e) => setNewPurchaseItem({ ...newPurchaseItem, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <Button 
                type="button"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] h-9 rounded-lg"
                onClick={handleAddPurchaseItem}
              >
                Insertar a Factura
              </Button>
            </div>

            {/* LADO DERECHO: DESGLOSE ORDEN DE COMPRA (7/12 ANCHO) */}
            <div className="md:col-span-7 flex flex-col justify-between min-h-[220px]">
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Artículos de esta factura</span>
                
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {addedPurchaseItems.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b">
                          <TableHead className="text-[9px] font-bold py-1">Nombre</TableHead>
                          <TableHead className="text-right text-[9px] font-bold py-1 w-16">Costo</TableHead>
                          <TableHead className="text-center text-[9px] font-bold py-1 w-16">Cant</TableHead>
                          <TableHead className="text-right text-[9px] font-bold py-1 w-20">Subtotal</TableHead>
                          <TableHead className="w-10 py-1"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y">
                        {addedPurchaseItems.map((item, idx) => (
                          <TableRow key={item.productId} className="border-b py-0 hover:bg-slate-50/20">
                            <TableCell className="py-1.5 font-bold text-[10px] text-slate-700 truncate max-w-[100px]">{item.productName}</TableCell>
                            <TableCell className="py-1.5 text-right text-[10px] text-slate-450">${item.costPrice.toFixed(1)}</TableCell>
                            <TableCell className="py-1.5 text-center text-[10px] font-bold">{item.quantity}</TableCell>
                            <TableCell className="py-1.5 text-right font-bold text-[10px] text-slate-800">${(item.costPrice * item.quantity).toFixed(2)}</TableCell>
                            <TableCell className="py-1.5 text-center">
                              <button 
                                className="text-rose-500 hover:text-rose-600"
                                onClick={() => handleRemovePurchaseItemIndex(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-[10px]">Agrega productos del panel izquierdo.</div>
                  )}
                </div>
              </div>

              {/* CONTROLES TOTALES Y PAGO DE CAJA CHICA */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 p-2.5 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="payFromRegister-chk"
                      className="accent-indigo-600 h-4 w-4 shrink-0 rounded"
                      checked={payFromRegister}
                      onChange={(e) => setPayFromRegister(e.target.checked)}
                    />
                    <label htmlFor="payFromRegister-chk" className="text-[10px] font-bold text-slate-600 leading-none">
                      Pagar con dinero de caja chica
                    </label>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Factura</span>
                    <span className="font-black text-sm text-indigo-650">${totalInvoiceSum.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Notas / Factura Ref.</label>
                  <Input
                    type="text"
                    placeholder="Ej. Factura #88219..."
                    className="focus-visible:ring-indigo-500 h-8 text-[11px] font-semibold"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsPurchaseOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 rounded-xl h-10"
              disabled={addedPurchaseItems.length === 0}
              onClick={handlePurchaseSubmit}
            >
              Registrar Compra y Recibir Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLES COMPRA REALIZADA */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">Detalles de Compra</DialogTitle>
          </DialogHeader>

          {activePurchaseDetail && (
            <div className="space-y-4 py-1 text-xs">
              <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Proveedor:</span>
                  <span className="font-bold text-slate-700">{activePurchaseDetail.supplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Fecha:</span>
                  <span className="font-bold text-slate-700">{new Date(activePurchaseDetail.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Caja Chica Salida:</span>
                  <span className="font-bold text-slate-750">{activePurchaseDetail.payFromRegister ? 'Sí' : 'No'}</span>
                </div>
                {activePurchaseDetail.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Referencia:</span>
                    <span className="font-bold text-slate-700">{activePurchaseDetail.notes}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span className="text-slate-500">Monto total pagado:</span>
                  <span className="font-black text-indigo-650 text-sm">${activePurchaseDetail.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Productos Ingresados</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b">
                        <TableHead className="text-[9px] font-bold">Producto</TableHead>
                        <TableHead className="text-center text-[9px] font-bold w-14">Cant</TableHead>
                        <TableHead className="text-right text-[9px] font-bold w-20">Costo</TableHead>
                        <TableHead className="text-right text-[9px] font-bold w-20">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {activePurchaseDetail.items.map((item) => (
                        <TableRow key={item.id} className="border-b py-0">
                          <TableCell className="py-2 font-bold text-[10px] text-slate-700 truncate max-w-[120px]">{item.product.name}</TableCell>
                          <TableCell className="py-2 text-center text-[10px] font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right text-[10px] text-slate-450">${item.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right font-bold text-[10px] text-slate-800">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" className="text-xs rounded-xl w-full" onClick={() => setIsDetailOpen(false)}>
              Cerrar Detalle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: NUEVO PRODUCTO CATÁLOGO */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">
              {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Introduce la información del artículo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-1 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre del Producto *</label>
              <Input
                type="text"
                required
                placeholder="Ej. Coca-Cola 600ml"
                className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Barcode className="h-3.5 w-3.5" /> Código de Barras
                </label>
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Escanea o escribe..."
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-mono"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
                <Input
                  type="text"
                  placeholder="Bebidas, Abarrotes..."
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Compra ($) *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Precio de Venta ($) *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold text-indigo-650"
                  value={formData.sellPrice || ''}
                  onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <CirclePercent className="h-3.5 w-3.5 text-indigo-650" />
                Margen de Utilidad Proyectado:
              </span>
              <span className={`font-black text-xs ${calculatedMargin > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                {calculatedMargin.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Existencia *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder="Ej. 100"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Mínimo Alerta *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder="Ej. 5"
                  className="focus-visible:ring-indigo-500 h-10 text-xs font-bold"
                  value={formData.minStock || ''}
                  onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" className="text-xs rounded-xl" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 rounded-xl h-10">
                {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: ELIMINACIÓN PRODUCTO */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5" /> ¿Eliminar Producto?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Removerá permanentemente el artículo de tu catálogo de ventas.
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="bg-slate-50 border p-3 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-800 text-sm">{productToDelete.name}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="text-xs rounded-xl" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl h-10" 
              onClick={handleDeleteSubmit}
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PinLockGuard>
  );
}
