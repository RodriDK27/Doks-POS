import { useState, useRef } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Product, Supplier, Purchase } from '../types';
import { ProductFormValues } from '../components/ProductFormDialog';
import { parseAxiosError } from '@/lib/errorMapper';
export function useInventory() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'SUPPLIERS'>('CATALOG');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'CRITICAL' | 'OUT_OF_STOCK'>('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  


  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

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

  // SWR Queries
  const { data: swrProducts, mutate: mutateProducts, isLoading: loading } = useSWR<Product[]>('/products');
  const { data: swrCategories } = useSWR<string[]>('/products/categories');
  const { data: swrSuppliers, mutate: mutateSuppliers, isLoading: suppliersLoading } = useSWR<Supplier[]>(activeTab === 'SUPPLIERS' ? '/suppliers' : null);
  const { data: swrPurchases, mutate: mutatePurchases } = useSWR<Purchase[]>(activeTab === 'SUPPLIERS' ? '/purchases' : null);

  // Derived dynamic variables
  const products = swrProducts ?? [];
  const categories = swrCategories ?? [];
  const suppliers = swrSuppliers ?? [];
  const purchases = swrPurchases ?? [];

  const fetchInventory = async () => {
    mutateProducts();
  };

  const fetchSuppliersData = async () => {
    mutateSuppliers();
    mutatePurchases();
  };

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
    setIsFormOpen(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  const handleFormSubmit = async (values: ProductFormValues) => {
    const payload = {
      ...values,
      barcode: values.barcode?.trim() || null,
      category: values.category?.trim() || null,
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        toast.success(`Producto "${values.name}" actualizado.`);
      } else {
        await api.post('/products', payload);
        toast.success(`Producto "${values.name}" registrado.`);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar el producto.'));
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
      toast.error(parseAxiosError(error, 'No se pudo eliminar el producto.'));
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
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar proveedor.'));
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
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar la compra.'));
    }
  };

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
    totalInvoiceSum,
  };
}
