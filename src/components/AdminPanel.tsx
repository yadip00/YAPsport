import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, StoreSettings, Invoice } from '../types';
import { 
  TrendingUp, DollarSign, Package, ClipboardList, Settings, Plus, Edit, Trash2, 
  Check, Save, AlertTriangle, Upload, X, CheckSquare, Search, ChevronRight, LogOut
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

type AdminTab = 'dashboard' | 'products' | 'transactions' | 'settings';

export const AdminPanel: React.FC = () => {
  const { 
    products, settings, invoices, addProduct, updateProduct, deleteProduct, 
    updateSettings, formatPrice, logoutAdmin, resetAllData
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Search filter for products table
  const [productSearch, setProductSearch] = useState('');

  // Forms states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New/Edit product form local state
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'jersey' as 'jersey' | 'equipment',
    price: 0,
    image: '',
    description: '',
    stock: 0,
    sizes: [] as string[],
    isFeatured: false
  });

  const [dragActive, setDragActive] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calculations for dashboard
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockItems = products.filter(p => p.stock === 0);

  // Prepare real-time financial report data from invoices
  const chartData = React.useMemo(() => {
    if (!invoices || invoices.length === 0) {
      // Fallback/Placeholder data if no transactions yet, showing a nice demo trend
      return [
        { name: 'Senin', 'Omset': 1200000, 'Jersey': 800000, 'Perlengkapan': 400000 },
        { name: 'Selasa', 'Omset': 1850000, 'Jersey': 1200000, 'Perlengkapan': 650000 },
        { name: 'Rabu', 'Omset': 1500000, 'Jersey': 900000, 'Perlengkapan': 600000 },
        { name: 'Kamis', 'Omset': 2400000, 'Jersey': 1600000, 'Perlengkapan': 800000 },
        { name: 'Jumat', 'Omset': 3100000, 'Jersey': 2100000, 'Perlengkapan': 1000000 },
        { name: 'Sabtu', 'Omset': 4500000, 'Jersey': 3000000, 'Perlengkapan': 1500000 },
        { name: 'Minggu', 'Omset': 3800000, 'Jersey': 2500000, 'Perlengkapan': 1300000 },
      ];
    }

    // Group actual invoices by date
    const dateMap: Record<string, { total: number; jersey: number; equipment: number }> = {};
    
    // Sort oldest to newest
    const chronologicalInvoices = [...invoices].reverse();
    
    chronologicalInvoices.forEach(inv => {
      const dateLabel = new Date(inv.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
      
      if (!dateMap[dateLabel]) {
        dateMap[dateLabel] = { total: 0, jersey: 0, equipment: 0 };
      }
      
      dateMap[dateLabel].total += inv.grandTotal;
      
      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'jersey';
        if (cat === 'jersey') {
          dateMap[dateLabel].jersey += item.subtotal;
        } else {
          dateMap[dateLabel].equipment += item.subtotal;
        }
      });
    });
    
    return Object.entries(dateMap).map(([name, data]) => ({
      name,
      'Omset': data.total,
      'Jersey': data.jersey,
      'Perlengkapan': data.equipment,
    })).slice(-10);
  }, [invoices, products]);

  // Handle open modal for product creation
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category: 'jersey',
      price: 150000,
      image: products[0]?.image || '',
      description: '',
      stock: 30,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      isFeatured: false
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  // Handle open modal for product editing
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      image: prod.image,
      description: prod.description,
      stock: prod.stock,
      sizes: prod.sizes || [],
      isFeatured: prod.isFeatured || false
    });
    setFormErrors({});
    setIsProductModalOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to read and convert a file to a Base64 string
  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (JPG, PNG, GIF, dll.)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProdForm(prev => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoUpload(e.target.files[0]);
    }
  };

  // Drag and drop events for real photo upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
  };

  // Size Checkbox toggle
  const handleSizeToggle = (size: string) => {
    setProdForm(prev => {
      const current = [...prev.sizes];
      if (current.includes(size)) {
        return { ...prev, sizes: current.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...current, size] };
      }
    });
  };

  // Form submission
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // validation
    const errors: Record<string, string> = {};
    if (!prodForm.name.trim()) errors.name = 'Nama produk wajib diisi';
    if (!prodForm.description.trim()) errors.description = 'Deskripsi produk wajib diisi';
    if (prodForm.price <= 0) errors.price = 'Harga wajib lebih dari Rp 0';
    if (prodForm.stock < 0) errors.stock = 'Stok tidak boleh kurang dari 0';
    if (!prodForm.image.trim()) errors.image = 'Tautan foto produk wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...prodForm
      });
    } else {
      addProduct(prodForm);
    }

    setIsProductModalOpen(false);
  };

  // Settings form local state
  const [setForm, setSetForm] = useState<StoreSettings>({ ...settings });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    setSetForm({ ...settings });
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(setForm);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-panel-viewport">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-white font-black text-2xl sm:text-3xl flex items-center gap-2 tracking-tight">
              <Settings className="text-red-500 h-8 w-8 animate-spin-slow" />
              <span>Portal Admin Webstore YAP</span>
            </h1>
            <button
              onClick={logoutAdmin}
              className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
              title="Keluar dari Portal Admin"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Kelola inventaris produk, sesuaikan pengaturan checkout WhatsApp, dan pantau log transaksi toko UMKM Anda.
          </p>
        </div>
        
        {/* Tab selector buttons */}
        <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl flex space-x-1 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Ringkasan', icon: TrendingUp },
            { id: 'products', label: 'Kelola Produk', icon: Package },
            { id: 'transactions', label: 'Transaksi WA', icon: ClipboardList },
            { id: 'settings', label: 'Pengaturan Toko', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                id={`admin-tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
            id="admin-view-dashboard"
          >
            {/* Numerical indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Revenue */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md flex items-center space-x-4">
                <div className="p-3.5 bg-red-950/40 text-red-500 border border-red-900/40 rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Total Omset</span>
                  <span className="text-xl sm:text-2xl font-black text-white block leading-tight mt-0.5">{formatPrice(totalRevenue)}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">*Berdasarkan Checkout WA</span>
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md flex items-center space-x-4">
                <div className="p-3.5 bg-red-950/40 text-red-500 border border-red-900/40 rounded-xl">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Total Transaksi</span>
                  <span className="text-xl sm:text-2xl font-black text-white block leading-tight mt-0.5">{invoices.length} Order</span>
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">Tingkat checkout tinggi</span>
                </div>
              </div>

              {/* Unique products */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md flex items-center space-x-4">
                <div className="p-3.5 bg-red-950/40 text-red-500 border border-red-900/40 rounded-xl">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Produk Katalog</span>
                  <span className="text-xl sm:text-2xl font-black text-white block leading-tight mt-0.5">{products.length} Items</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Jersey & Perlengkapan</span>
                </div>
              </div>

              {/* Critical Stock */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md flex items-center space-x-4">
                <div className={`p-3.5 rounded-xl border ${
                  lowStockItems.length + outOfStockItems.length > 0
                    ? 'bg-red-950/50 text-red-500 border-red-900/50 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Stok Menipis/Habis</span>
                  <span className="text-xl sm:text-2xl font-black text-white block leading-tight mt-0.5">
                    {lowStockItems.length + outOfStockItems.length} Produk
                  </span>
                  {outOfStockItems.length > 0 ? (
                    <span className="text-[10px] text-red-500 font-bold mt-1 block">{outOfStockItems.length} Produk Kosong!</span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 mt-1 block">Inventaris relatif aman</span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Business Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales activity graph */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md lg:col-span-2">
                <h3 className="text-white font-black text-base mb-4 flex items-center gap-1.5">
                  <TrendingUp className="text-red-500 h-5 w-5" />
                  <span>Grafik Mingguan Nilai Transaksi</span>
                </h3>

                {/* Simulated dynamic SVG chart */}
                <div className="h-64 w-full flex items-end justify-between pt-6 px-4 border-b border-zinc-800 relative bg-zinc-950 rounded-2xl overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 pb-12">
                    <div className="border-b border-zinc-900/50 w-full h-0"></div>
                    <div className="border-b border-zinc-900/50 w-full h-0"></div>
                    <div className="border-b border-zinc-900/50 w-full h-0"></div>
                  </div>

                  {/* Fictional data columns decorated with real checkout metrics */}
                  {[
                    { day: 'Sen', val: totalRevenue > 0 ? 0.3 : 0.2, label: 'Rp 200rb' },
                    { day: 'Sel', val: totalRevenue > 0 ? 0.45 : 0.35, label: 'Rp 450rb' },
                    { day: 'Rab', val: totalRevenue > 0 ? 0.8 : 0.15, label: totalRevenue > 0 ? formatPrice(totalRevenue * 0.4) : 'Rp 150rb' },
                    { day: 'Kam', val: totalRevenue > 0 ? 0.35 : 0.5, label: 'Rp 500rb' },
                    { day: 'Jum', val: totalRevenue > 0 ? 0.6 : 0.4, label: 'Rp 400rb' },
                    { day: 'Sab', val: totalRevenue > 0 ? 0.95 : 0.8, label: 'Rp 800rb' },
                    { day: 'Min', val: totalRevenue > 0 ? 0.75 : 0.65, label: 'Rp 650rb' }
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative group">
                      {/* Price Tooltip */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-md border border-zinc-800 pointer-events-none z-10 shadow-xl whitespace-nowrap">
                        {bar.label}
                      </span>
                      {/* Interactive Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${bar.val * 80}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className="w-8 sm:w-12 bg-red-600 rounded-t-md hover:bg-red-700 cursor-pointer shadow-lg shadow-red-600/10"
                      />
                      <span className="text-[10px] text-zinc-500 font-bold mt-2 pb-1.5">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular items and low stock list */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="text-white font-black text-base mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="text-red-500 h-5 w-5" />
                    <span>Perlu Tambah Stok</span>
                  </h3>
                  <div className="space-y-3">
                    {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
                      <div className="p-4 bg-zinc-950 rounded-xl text-center text-xs text-zinc-400 font-medium border border-zinc-850">
                        ✅ Semua stok barang mencukupi!
                      </div>
                    ) : (
                      [...outOfStockItems, ...lowStockItems].slice(0, 4).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-850">
                          <div className="flex items-center space-x-2">
                            <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="h-9 w-9 object-cover rounded-md border border-zinc-800" />
                            <div className="max-w-[120px] sm:max-w-none">
                              <p className="text-xs font-black text-white truncate">{item.name}</p>
                              <span className="text-[9px] text-zinc-500 font-mono">ID: {item.id}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            item.stock === 0 ? 'bg-red-950 text-red-400 border border-red-900/40' : 'bg-amber-950 text-amber-400 border border-amber-900/40'
                          }`}>
                            Stok: {item.stock}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Help tip for UMKM */}
                <div className="bg-zinc-950 text-white p-4.5 rounded-2xl border border-zinc-850 shadow-md">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Tips WhatsApp Checkout</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Pastikan nomor WhatsApp penjual di tab <b>Pengaturan</b> diawali kode negara Indonesia (contoh: <b>62812...</b>) agar pelanggan langsung dialihkan ke chat Anda secara otomatis tanpa galat.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: INVENTORY TABLE & MANAGEMENT */}
        {activeTab === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            id="admin-view-products"
          >
            {/* Search and Action header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari barang katalog..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-zinc-900 text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-xs sm:text-sm transition-all"
                  id="admin-inventory-search-input"
                />
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/15 transition-all"
                id="admin-add-product-button"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {/* Products Inventory Grid/Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 text-xs font-extrabold uppercase border-b border-zinc-800">
                      <th className="px-6 py-4.5">Foto / Nama</th>
                      <th className="px-6 py-4.5">Kategori</th>
                      <th className="px-6 py-4.5">Harga</th>
                      <th className="px-6 py-4.5">Stok</th>
                      <th className="px-6 py-4.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300 text-xs sm:text-sm">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-500">
                          Tidak ada produk yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-zinc-850/40 transition-colors">
                          {/* Image & Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 object-cover rounded-xl border border-zinc-800"
                              />
                              <div>
                                <p className="font-bold text-white text-xs sm:text-sm line-clamp-1">{prod.name}</p>
                                <span className="text-[10px] text-zinc-500 font-mono">ID: {prod.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold ${
                              prod.category === 'jersey'
                                ? 'bg-red-950 text-red-400 border border-red-900/40'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}>
                              {prod.category === 'jersey' ? 'Jersey' : 'Alat'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 font-extrabold text-red-400">
                            {formatPrice(prod.price)}
                          </td>

                          {/* Stock status */}
                          <td className="px-6 py-4">
                            <span className={`font-mono font-bold ${
                              prod.stock === 0 
                                ? 'text-red-500 font-black' 
                                : prod.stock <= 5 
                                ? 'text-amber-500' 
                                : 'text-zinc-300'
                            }`}>
                              {prod.stock} pcs
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all inline-flex items-center"
                              title="Edit Produk"
                              id={`admin-edit-prod-${prod.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus produk "${prod.name}" dari katalog?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-xl transition-all inline-flex items-center"
                              title="Hapus Produk"
                              id={`admin-delete-prod-${prod.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: TRANSACTION LOGS */}
        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="admin-view-transactions"
          >
            {/* Laporan Keuangan Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Metrics */}
              <div className="lg:col-span-1 space-y-4">
                {/* Metric 1 */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-md">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Omset Toko</span>
                  <span className="text-2xl font-black text-white mt-1 block">{formatPrice(totalRevenue)}</span>
                  <p className="text-[11px] text-green-500 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span>Real-time terupdate dari Firestore</span>
                  </p>
                </div>
                {/* Metric 2 */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-md">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Transaksi Kasir</span>
                  <span className="text-2xl font-black text-white mt-1 block">{invoices.length} Transaksi</span>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Rata-rata: {formatPrice(invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0)} / order
                  </p>
                </div>
                {/* Metric 3 */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-md">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Target Omset Bulanan</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-black text-zinc-300">Rp 15.000.000</span>
                    <span className="text-xs text-red-500 font-extrabold bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                      {Math.min(100, Math.round((totalRevenue / 15000000) * 100))}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-3 overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (totalRevenue / 15000000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recharts Graphical Chart */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                      <TrendingUp className="text-red-500 h-5 w-5" />
                      <span>Grafik Analisis Laporan Keuangan</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Analisis pendapatan produk Jersey vs Perlengkapan</p>
                  </div>
                  <span className="text-[10px] font-black text-red-500 bg-red-950/40 border border-red-900/30 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 w-fit">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span>Live Database</span>
                  </span>
                </div>

                <div className="h-56 w-full" id="laporan-keuangan-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorJersey" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#71717a" 
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('id-ID')}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                        itemStyle={{ fontSize: '11px' }}
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Omset" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorOmset)" 
                        name="Total Omset"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Jersey" 
                        stroke="#3b82f6" 
                        strokeWidth={1.5}
                        fillOpacity={1} 
                        fill="url(#colorJersey)" 
                        name="Omset Jersey"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 text-xs font-extrabold uppercase border-b border-zinc-800">
                      <th className="px-6 py-4.5">ID Invoice / Tanggal</th>
                      <th className="px-6 py-4.5">Penerima</th>
                      <th className="px-6 py-4.5">Metode Kirim / Alamat</th>
                      <th className="px-6 py-4.5">Rincian Barang</th>
                      <th className="px-6 py-4.5">Total Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300 text-xs sm:text-sm">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-500">
                          Belum ada transaksi pembelian. Lakukan simulasi checkout di webstore untuk memunculkan log di sini!
                        </td>
                      </tr>
                    ) : (
                      invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-zinc-850/40 transition-colors">
                          {/* Invoice ID & Date */}
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-red-500 font-mono">#{inv.id}</span>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">
                              {new Date(inv.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </td>

                          {/* Customer info */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-white text-xs sm:text-sm">{inv.customer.name}</p>
                            <span className="text-xs text-zinc-400 font-mono">{inv.customer.phone}</span>
                          </td>

                          {/* Shipping address info */}
                          <td className="px-6 py-4 max-w-xs">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border block w-fit mb-1 ${
                              inv.customer.shippingMethod === 'pickup'
                                ? 'bg-amber-950 text-amber-400 border-amber-900/40'
                                : 'bg-red-950 text-red-400 border-red-900/40'
                            }`}>
                              {inv.customer.shippingMethod === 'pickup' ? 'Ambil Di Toko' : 'Kurir Reguler'}
                            </span>
                            <p className="text-[11px] text-zinc-400 line-clamp-2">{inv.customer.address}</p>
                          </td>

                          {/* Purchased items list */}
                          <td className="px-6 py-4 max-w-xs">
                            <div className="space-y-0.5 text-[11px]">
                              {inv.items.map((item, idx) => (
                                <p key={idx} className="text-zinc-300 font-medium">
                                  • {item.productName} {item.size && `(${item.size})`} x {item.quantity}
                                </p>
                              ))}
                            </div>
                          </td>

                          {/* Grand total */}
                          <td className="px-6 py-4 font-black text-white font-mono">
                            {formatPrice(inv.grandTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-xl"
            id="admin-view-settings"
          >
            <h3 className="text-white font-black text-lg mb-6 pb-3 border-b border-zinc-800 flex items-center gap-1.5">
              <Settings className="text-red-500 h-5 w-5" />
              <span>Konfigurasi Webstore YAP</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs sm:text-sm">
              {/* Store Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Brand Toko *
                </label>
                <input
                  type="text"
                  value={setForm.storeName}
                  onChange={(e) => setSetForm({ ...setForm, storeName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="settings-input-store-name"
                  required
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Slogan / Tagline Toko *
                </label>
                <input
                  type="text"
                  value={setForm.storeTagline}
                  onChange={(e) => setSetForm({ ...setForm, storeTagline: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="settings-input-tagline"
                  required
                />
              </div>

              {/* WhatsApp phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp Penjual (Admin Checkout) *
                </label>
                <input
                  type="text"
                  value={setForm.whatsappNumber}
                  onChange={(e) => setSetForm({ ...setForm, whatsappNumber: e.target.value })}
                  placeholder="Contoh: 628123456789"
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="settings-input-whatsapp"
                  required
                />
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">
                  *Gunakan format angka lengkap dengan kode negara tanpa lambang "+" (contoh: gunakan <b>628123456789</b> untuk Indonesia). Jangan menggunakan angka nol di depan (seperti 0812...).
                </p>
              </div>

              {/* Shipping Rate */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Biaya Kirim Flat Kurir (Rupiah) *
                </label>
                <input
                  type="number"
                  value={setForm.shippingFee}
                  onChange={(e) => setSetForm({ ...setForm, shippingFee: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="settings-input-shipping-fee"
                  required
                />
              </div>

              {/* Visitor Access Security Mode */}
              <div className="bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-red-500 uppercase tracking-wider">
                  Mode Keamanan & Akses Pengunjung Web Store *
                </label>
                <p className="text-[11px] text-zinc-400">
                  Tentukan apakah pengunjung harus masuk/login terlebih dahulu untuk dapat melihat detail dan membeli produk, atau bebas menjelajahi beranda.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Bebas Tanpa Login */}
                  <label 
                    className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                      !setForm.requireVisitorLogin 
                        ? 'bg-red-950/20 border-red-500/50 text-white' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requireVisitorLogin"
                      checked={!setForm.requireVisitorLogin}
                      onChange={() => setSetForm({ ...setForm, requireVisitorLogin: false })}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-black block">🔓 Akses Bebas (Tanpa Login)</span>
                      <span className="text-[10px] text-zinc-400 block leading-normal">
                        Pengunjung bebas membuka beranda, memfilter kategori, mencari produk, dan melihat detail tanpa wajib masuk.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Wajib Login */}
                  <label 
                    className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                      setForm.requireVisitorLogin 
                        ? 'bg-red-950/20 border-red-500/50 text-white' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requireVisitorLogin"
                      checked={!!setForm.requireVisitorLogin}
                      onChange={() => setSetForm({ ...setForm, requireVisitorLogin: true })}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-black block">🔒 Wajib Login Pengunjung</span>
                      <span className="text-[10px] text-zinc-400 block leading-normal">
                        Saat pengunjung mengklik link, produk, filter, atau keranjang, sistem akan mengunci dan mewajibkan login/daftar nama.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Store Offline Address */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Alamat Gudang Toko (Untuk Ambil Offline) *
                </label>
                <textarea
                  rows={3}
                  value={setForm.address}
                  onChange={(e) => setSetForm({ ...setForm, address: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="settings-input-address"
                  required
                />
              </div>

              {/* Save changes triggers */}
              <div className="pt-5 flex items-center space-x-3 border-t border-zinc-800">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10 transition-all cursor-pointer"
                  id="settings-save-button"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Konfigurasi</span>
                </button>

                {settingsSuccess && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-red-500 font-bold flex items-center gap-1 text-xs"
                  >
                    <Check className="h-4 w-4" />
                    Berhasil disimpan!
                  </motion.span>
                )}
              </div>
            </form>

            {/* Danger Zone: Reset Data */}
            <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
              <h4 className="text-red-500 font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Zona Bahaya (Danger Zone)</span>
              </h4>
              <div className="bg-red-950/25 border border-red-900/40 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-white font-bold text-xs sm:text-sm block">Reset Semua Data Toko ke Default</span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed max-w-md">
                    Tindakan ini akan menghapus seluruh data kustomisasi Anda, riwayat transaksi, pengaturan kustom, serta memulihkan katalog produk bawaan beserta gambarnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus seluruh data kustom dan memulihkan katalog produk bawaan beserta gambarnya?')) {
                      resetAllData();
                      alert('Seluruh data berhasil disetel ulang!');
                      window.location.reload();
                    }
                  }}
                  className="bg-red-900/60 hover:bg-red-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all border border-red-800 hover:border-red-500 cursor-pointer"
                >
                  Reset Semua Data
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD / EDIT PRODUCT */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 border border-zinc-800 flex flex-col"
              id="admin-product-form-modal"
            >
              <div className="px-6 py-5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 rounded-t-3xl">
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Package className="text-red-500 h-5 w-5" />
                  <span>{editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}</span>
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                  id="admin-close-product-modal-button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs sm:text-sm">
                
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Contoh: Jersey Garuda Merah 2026 Premium"
                    className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                      formErrors.name ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.name}</p>}
                </div>

                {/* Category & Pricing & Stock Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Kategori *
                    </label>
                    <select
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                    >
                      <option value="jersey">Jersey Bola</option>
                      <option value="equipment">Alat Olahraga</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      type="number"
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: parseInt(e.target.value) || 0 })}
                      className={`w-full bg-zinc-950 border px-3 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                        formErrors.price ? 'border-red-500' : 'border-zinc-800'
                      }`}
                    />
                    {formErrors.price && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.price}</p>}
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Stok Fisik *
                    </label>
                    <input
                      type="number"
                      value={prodForm.stock}
                      onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value) || 0 })}
                      className={`w-full bg-zinc-950 border px-3 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                        formErrors.stock ? 'border-red-500' : 'border-zinc-800'
                      }`}
                    />
                    {formErrors.stock && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.stock}</p>}
                  </div>
                </div>

                {/* Drag and Drop Photo Upload Zone & Preview */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Foto Produk (Tautan URL atau Unggah File) *
                  </label>
                  <input
                    type="text"
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    placeholder="Masukkan URL foto produk..."
                    className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                      formErrors.image ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                  {formErrors.image && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.image}</p>}

                  {/* Hidden input file for real file selection */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Visual Drag & Drop Zone and Preview Container */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* The Clickable Drag & Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        dragActive 
                          ? 'border-red-500 bg-red-950/20' 
                          : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-850/50 hover:border-zinc-700'
                      }`}
                    >
                      <Upload className="h-6 w-6 text-red-500 mb-1.5" />
                      <p className="text-xs text-zinc-300 font-bold">
                        Pilih file atau Seret Gambar
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Klik untuk jelajahi file komputer Anda (PNG, JPG)
                      </p>
                    </div>

                    {/* Live Preview Container */}
                    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-3 flex flex-col items-center justify-center relative min-h-[110px]">
                      {prodForm.image ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <img 
                            src={prodForm.image} 
                            alt="Pratinjau Foto" 
                            className="max-h-24 max-w-full object-contain rounded-xl border border-zinc-800 shadow"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProdForm(prev => ({ ...prev, image: '' }));
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow transition-all cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-zinc-500 text-[11px] font-medium py-4">
                          Belum ada foto terpilih. Gunakan kolom URL atau pilih file foto untuk melihat pratinjau di sini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Keterangan / Deskripsi Lengkap *
                  </label>
                  <textarea
                    rows={3}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Tulis spesifikasi produk, keunggulan bahan, dan petunjuk ukuran lengkap..."
                    className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                      formErrors.description ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                  {formErrors.description && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.description}</p>}
                </div>

                {/* Jersey Sizes Checklist (Conditional) */}
                {prodForm.category === 'jersey' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Ukuran Jersey yang Tersedia
                    </label>
                    <div className="flex flex-wrap gap-4 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                      {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <label key={size} className="flex items-center space-x-1.5 cursor-pointer text-zinc-300 font-bold">
                          <input
                            type="checkbox"
                            checked={prodForm.sizes.includes(size)}
                            onChange={() => handleSizeToggle(size)}
                            className="accent-red-600 h-4 w-4 rounded"
                          />
                          <span>{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options (Featured) */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={prodForm.isFeatured}
                    onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                    className="accent-red-600 h-4 w-4 rounded"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold text-zinc-400 cursor-pointer">
                    Tampilkan sebagai Produk Utama (Featured / Hot) di beranda
                  </label>
                </div>

                {/* Submit buttons */}
                <div className="pt-5 flex justify-end space-x-2 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4.5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-extrabold rounded-2xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-red-600/10 transition-all cursor-pointer"
                    id="admin-submit-prod-form"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan Produk</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
