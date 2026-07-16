import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Product, Supplier, Purchase } from '../types';

export function useInventory() {
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
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Error fetching inventory:', error);
        toast.error('No se pudo cargar el inventario.');
      }
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
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Error fetching suppliers:', error);
        toast.error('No se pudieron cargar los datos de proveedores.');
      }
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

    const existingIndex = addedPurchaseItems.findIndex(i => i.productId === newPurchaseItem.productId);
    if (existingIndex > -1) {
      const updated = [...addedPurchaseItems];
      updated[existingIndex].quantity += newPurchaseItem.quantity;
      updated[existingIndex].costPrice = newPurchaseItem.costPrice;
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
      fetchInventory();
      fetchSuppliersData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar la compra.');
    }
  };

  const calculatedMargin = formData.sellPrice > 0 
    ? ((formData.sellPrice - formData.purchasePrice) / formData.sellPrice) * 100 
    : 0;

  const totalInvoiceSum = addedPurchaseItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);

  return {
    activeTab,
    setActiveTab,
    products,
    categories,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    formData,
    setFormData,
    isDeleteOpen,
    setIsDeleteOpen,
    productToDelete,
    barcodeInputRef,
    suppliers,
    purchases,
    suppliersLoading,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierForm,
    setSupplierForm,
    isPurchaseOpen,
    setIsPurchaseOpen,
    selectedSupplierForPurchase,
    purchaseNotes,
    setPurchaseNotes,
    payFromRegister,
    setPayFromRegister,
    addedPurchaseItems,
    newPurchaseItem,
    setNewPurchaseItem,
    isDetailOpen,
    setIsDetailOpen,
    activePurchaseDetail,
    setActivePurchaseDetail,
    totalProductsCount,
    totalInvestment,
    expectedProfit,
    lowStockCount,
    filteredProducts,
    handleOpenAdd,
    handleOpenEdit,
    handleFormSubmit,
    handleOpenDelete,
    handleDeleteSubmit,
    handleSupplierSubmit,
    handleOpenRegisterPurchase,
    handleAddPurchaseItem,
    handleRemovePurchaseItemIndex,
    handlePurchaseSubmit,
    calculatedMargin,
    totalInvoiceSum,
  };
}
