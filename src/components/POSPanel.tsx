import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Invoice } from '../types';
import { 
  Search, Plus, Minus, Trash2, Barcode, CreditCard, Coins, QrCode, 
  Printer, Check, Loader2, Percent, ShoppingBag, User, Sparkles, 
  RefreshCw, X, AlertTriangle, Receipt, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const POSPanel: React.FC = () => {
  const { products, createPOSInvoice, formatPrice, settings, logoutAdmin } = useStore();

  // Active cashier user name (saved in session)
  const [cashierName, setCashierName] = useState(() => {
    return localStorage.getItem('yap_cashier_name') || 'Kasir YAP';
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'jersey' | 'equipment'>('all');
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number; selectedSize?: string }[]>([]);

  // Calculations states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(10); // Default PB1 Tax: 10%
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>(''); // For Cash
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Completed order receipt modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // References for barcode scanners and keyboard focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount and on resetting
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Sync cashier name changes
  useEffect(() => {
    localStorage.setItem('yap_cashier_name', cashierName);
  }, [cashierName]);

  // Handle SKU/Barcode direct match adding
  const handleBarcodeOrQueryChange = (val: string) => {
    setSearchQuery(val);
    const cleaned = val.trim().toLowerCase();
    
    if (cleaned.length >= 3) {
      // Check if there is an exact SKU match
      // For instance, generate a pseudo-SKU like 'JER-' or 'EQP-' based on index
      const foundProduct = products.find(p => {
        const generatedSku = p.id.replace('prod-', 'YAP-');
        return generatedSku.toLowerCase() === cleaned;
      });

      if (foundProduct) {
        // Immediate add to POS cart!
        handleAddToPosCart(foundProduct);
        setSearchQuery(''); // clear barcode input
        
        // Brief visual success flash or trigger
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.play().catch(() => {}); // Play subtle beep if browser permits
      }
    }
  };

  // Add to POS Cart
  const handleAddToPosCart = (product: Product, size?: string) => {
    if (product.stock <= 0) {
      alert(`Stok untuk ${product.name} telah habis!`);
      return;
    }

    setPosCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.selectedSize === size
      );

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        if (currentQty >= product.stock) {
          alert(`Stok tidak mencukupi! Hanya tersedia ${product.stock} unit.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        // Default size to first available size if it's a jersey
        const defaultSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
        return [...prev, { product, quantity: 1, selectedSize: defaultSize }];
      }
    });
  };

  // Update Qty
  const handleUpdateQty = (productId: string, delta: number, size?: string) => {
    setPosCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedSize === size) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          
          if (delta > 0 && newQty > item.product.stock) {
            alert(`Stok tidak mencukupi! Maksimum ${item.product.stock} unit.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  // Remove completely
  const handleRemoveItem = (productId: string, size?: string) => {
    setPosCart(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedSize === size)
    ));
  };

  // Change size
  const handleChangeSize = (productId: string, oldSize?: string, newSize?: string) => {
    setPosCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedSize === oldSize) {
        return { ...item, selectedSize: newSize };
      }
      return item;
    }));
  };

  // Quick action presets for cash paid amount
  const handleCashPreset = (value: number) => {
    setAmountPaid(value.toString());
  };

  // Cart financial summary
  const subtotal = posCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * (taxPercent / 100));
  const grandTotal = taxableAmount + taxAmount;

  // Change computation
  const numericPaid = parseFloat(amountPaid) || 0;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, numericPaid - grandTotal) : 0;
  const isPaidEnough = paymentMethod !== 'cash' || numericPaid >= grandTotal;

  // Filtered product catalog
  const filteredCatalog = products.filter(p => {
    const generatedSku = p.id.replace('prod-', 'YAP-');
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      generatedSku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Execute POS Checkout with Real-time locking (Firestore transaction)
  const handleCheckoutPOS = async () => {
    if (posCart.length === 0) {
      setErrorMessage('Keranjang kasir kosong.');
      return;
    }

    if (paymentMethod === 'cash' && numericPaid < grandTotal) {
      setErrorMessage('Uang pembayaran tunai kurang.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Map cart details for transactional processing
      const checkoutItems = posCart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.selectedSize
      }));

      const invoice = await createPOSInvoice(
        checkoutItems,
        paymentMethod,
        paymentMethod === 'cash' ? numericPaid : grandTotal,
        discountPercent,
        taxPercent,
        cashierName
      );

      // Successfully processed transaction
      setCompletedInvoice(invoice);
      setPosCart([]);
      setAmountPaid('');
      setDiscountPercent(0);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses transaksi kasir.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Print thermal receipt handler
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Mohon izinkan pop-up untuk mencetak struk belanja.');
      return;
    }

    const dateStr = completedInvoice 
      ? new Date(completedInvoice.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : '';

    const itemsRowsHtml = completedInvoice?.items.map(item => `
      <tr>
        <td style="padding: 4px 0; text-align: left;">
          ${item.productName} ${item.size ? `[${item.size}]` : ''}<br>
          <span style="font-size: 11px; color: #555;">${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}</span>
        </td>
        <td style="padding: 4px 0; text-align: right; vertical-align: bottom;">
          Rp ${item.subtotal.toLocaleString('id-ID')}
        </td>
      </tr>
    `).join('') || '';

    const subtotalText = completedInvoice?.totalPrice.toLocaleString('id-ID') || '0';
    const discountText = completedInvoice?.discountPercent && completedInvoice.discountPercent > 0 
      ? `-${completedInvoice.discountPercent}% (Rp ${(completedInvoice.totalPrice * completedInvoice.discountPercent / 100).toLocaleString('id-ID')})`
      : 'Rp 0';
    const taxText = completedInvoice?.taxPercent && completedInvoice.taxPercent > 0 
      ? `${completedInvoice.taxPercent}% (Rp ${Math.round((completedInvoice.totalPrice - (completedInvoice.totalPrice * (completedInvoice.discountPercent || 0) / 100)) * completedInvoice.taxPercent / 100).toLocaleString('id-ID')})`
      : 'Rp 0';
    const totalText = completedInvoice?.grandTotal.toLocaleString('id-ID') || '0';
    const payText = completedInvoice?.amountPaid?.toLocaleString('id-ID') || '0';
    const changeText = completedInvoice?.change?.toLocaleString('id-ID') || '0';

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Belanja - ${settings.storeName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; width: 58mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.4; color: #000; }
              @page { margin: 0; }
            }
            body { font-family: 'Courier New', Courier, monospace; max-width: 80mm; margin: 20px auto; padding: 15px; border: 1px dashed #ccc; font-size: 12px; line-height: 1.4; }
            .center { text-align: center; }
            .right { text-align: right; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .bold { font-weight: bold; }
            .totals td { padding: 2px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center">
            <span style="font-size: 16px; font-weight: bold;">${settings.storeName.toUpperCase()}</span><br>
            <span style="font-size: 10px;">${settings.storeTagline}</span><br>
            <span style="font-size: 10px;">Gudang: ${settings.address}</span><br>
            <span style="font-size: 10px;">Telp: ${settings.whatsappNumber}</span>
          </div>
          
          <div class="line"></div>
          
          <div>
            <b>No Struk:</b> ${completedInvoice?.id}<br>
            <b>Tanggal :</b> ${dateStr}<br>
            <b>Kasir   :</b> ${completedInvoice?.cashierName || 'Kasir YAP'}<br>
            <b>Tipe    :</b> POS OFFLINE
          </div>
          
          <div class="line"></div>
          
          <table>
            ${itemsRowsHtml}
          </table>
          
          <div class="line"></div>
          
          <table class="totals">
            <tr>
              <td>Subtotal</td>
              <td class="right">Rp ${subtotalText}</td>
            </tr>
            <tr>
              <td>Diskon</td>
              <td class="right">${discountText}</td>
            </tr>
            <tr>
              <td>Pajak (PB1)</td>
              <td class="right">${taxText}</td>
            </tr>
            <tr class="bold">
              <td style="font-size: 13px;">TOTAL AKHIR</td>
              <td class="right" style="font-size: 13px;">Rp ${totalText}</td>
            </tr>
          </table>
          
          <div class="line"></div>
          
          <table class="totals">
            <tr>
              <td>Metode Bayar</td>
              <td class="right">${completedInvoice?.paymentMethod?.toUpperCase()}</td>
            </tr>
            <tr>
              <td>Uang Bayar</td>
              <td class="right">Rp ${payText}</td>
            </tr>
            <tr>
              <td>Uang Kembali</td>
              <td class="right">Rp ${changeText}</td>
            </tr>
          </table>
          
          <div class="line"></div>
          
          <div class="center" style="margin-top: 15px; font-size: 10px;">
            Terima kasih atas kunjungan Anda!<br>
            Barang yang sudah dibeli<br>
            tidak dapat ditukar/dikembalikan.<br>
            Powered by YAP Sport & Apparel POS
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen p-4 sm:p-6 space-y-6" id="pos-module-root">
      
      {/* Upper POS Status Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-600/10 text-red-500 p-2 rounded-xl border border-red-500/20">
            <Barcode className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
              <span>Point of Sale (POS)</span>
              <span className="text-[10px] bg-red-950 border border-red-900 text-red-400 font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest">OFFLINE KASIR</span>
            </h2>
            <p className="text-zinc-500 text-xs">Aplikasi kasir retail terintegrasi langsung dengan manajemen inventaris.</p>
          </div>
        </div>

        {/* Cashier profile & configuration */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute left-3 top-3 text-zinc-500">
              <User className="h-4 w-4" />
            </span>
            <input 
              type="text" 
              value={cashierName} 
              onChange={(e) => setCashierName(e.target.value)} 
              placeholder="Nama Kasir..." 
              className="w-full sm:w-48 bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 pl-9 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-red-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button 
            onClick={() => {
              setPosCart([]);
              setSearchQuery('');
              setAmountPaid('');
              if (searchInputRef.current) searchInputRef.current.focus();
            }}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition-colors cursor-pointer"
            title="Reset POS"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={logoutAdmin}
            className="p-2.5 bg-zinc-800 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 rounded-xl border border-zinc-700 hover:border-red-900/50 transition-all cursor-pointer"
            title="Keluar dari Portal Kasir"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout POS (Bento-styled console) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Catalog Controls Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Product Search (by Name, SKU, Barcode) */}
              <div className="relative flex-grow">
                <span className="absolute left-3.5 top-3.5 text-zinc-500">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleBarcodeOrQueryChange(e.target.value)}
                  placeholder="Cari Nama / ketik SKU (YAP-1)..." 
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500 focus:outline-none text-sm transition-all"
                  id="pos-search-input"
                />
                <span className="absolute right-3.5 top-3.5 text-zinc-500 flex items-center gap-1 font-mono text-[9px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shadow">
                  <Barcode className="h-3 w-3 text-red-500" />
                  <span>BARCODE AUTO-ADD</span>
                </span>
              </div>
            </div>

            {/* Category selection */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Semua Produk' },
                { id: 'jersey', label: 'Jersey Timnas' },
                { id: 'equipment', label: 'Alat Olahraga' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/15'
                      : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-850'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredCatalog.map(prod => {
                const sku = prod.id.replace('prod-', 'YAP-');
                const isOutOfStock = prod.stock <= 0;
                
                return (
                  <motion.div
                    key={prod.id}
                    layout
                    whileHover={{ y: -3 }}
                    className={`bg-zinc-900 border ${
                      isOutOfStock ? 'border-zinc-850 opacity-60' : 'border-zinc-800 hover:border-zinc-700'
                    } rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden transition-all`}
                  >
                    <div>
                      {/* Product image */}
                      <div className="relative rounded-xl overflow-hidden aspect-square border border-zinc-950 bg-zinc-950 mb-3">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 left-2 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-[9px] font-mono font-black tracking-wide text-zinc-400 px-2 py-0.5 rounded shadow uppercase">
                          {sku}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="text-white text-xs font-black tracking-tight leading-tight line-clamp-2">{prod.name}</h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                      <div className="flex flex-col">
                        <span className="text-red-500 text-xs font-extrabold">{formatPrice(prod.price)}</span>
                        <span className={`text-[10px] ${
                          prod.stock <= 3 ? 'text-red-400 font-bold' : 'text-zinc-500'
                        }`}>
                          Stok: {prod.stock}
                        </span>
                      </div>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleAddToPosCart(prod)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isOutOfStock 
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10'
                        }`}
                        title="Tambah ke Kasir"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredCatalog.length === 0 && (
              <div className="col-span-full bg-zinc-900 border border-zinc-800 p-10 rounded-2xl text-center text-zinc-500 text-xs">
                Tidak ada produk kasir yang sesuai.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: POS Cart Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
            
            {/* Cashier Cart Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-850 mb-4">
              <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <ShoppingBag className="h-4.5 w-4.5 text-red-500" />
                <span>Keranjang Transaksi</span>
              </span>
              <span className="bg-zinc-950 text-red-500 text-xs font-black px-3 py-1 rounded-full border border-zinc-800">
                {posCart.reduce((acc, c) => acc + c.quantity, 0)} Items
              </span>
            </div>

            {/* Cashier Items Scroll container */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {posCart.map((item, idx) => {
                const itemSubtotal = item.product.price * item.quantity;
                
                return (
                  <motion.div 
                    key={`${item.product.id}-${item.selectedSize}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex items-center justify-between gap-3 relative"
                  >
                    <div className="flex-grow space-y-1">
                      <h5 className="text-white text-xs font-bold leading-tight truncate max-w-[180px]">{item.product.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-[10px]">{formatPrice(item.product.price)}</span>
                        
                        {/* Jersey size dropdown selector if applicable */}
                        {item.product.sizes && item.product.sizes.length > 0 && (
                          <select 
                            value={item.selectedSize || ''}
                            onChange={(e) => handleChangeSize(item.product.id, item.selectedSize, e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 font-bold px-1 py-0.5 rounded cursor-pointer"
                          >
                            {item.product.sizes.map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Qty controller buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateQty(item.product.id, -1, item.selectedSize)}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      
                      <span className="font-mono font-bold text-xs text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>

                      <button 
                        onClick={() => handleUpdateQty(item.product.id, 1, item.selectedSize)}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col items-end min-w-[70px]">
                      <span className="text-red-500 text-xs font-bold">{formatPrice(itemSubtotal)}</span>
                      <button
                        onClick={() => handleRemoveItem(item.product.id, item.selectedSize)}
                        className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer mt-1"
                        title="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {posCart.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-xs">
                  Scan produk atau klik item di katalog untuk ditambahkan ke kasir.
                </div>
              )}
            </div>

            {/* Financial Adjustments Section */}
            <div className="mt-5 pt-4.5 border-t border-zinc-850 space-y-3 text-xs">
              
              {/* Discount and Tax inputs */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Percent className="h-3 w-3 text-red-500" />
                    <span>Diskon (%)</span>
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 p-2 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Percent className="h-3 w-3 text-emerald-500" />
                    <span>Pajak PB1 (%)</span>
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="10"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 p-2 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bill Details */}
              <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-medium">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Diskon ({discountPercent}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between text-red-500/80">
                    <span>Pajak (PB1 {taxPercent}%)</span>
                    <span>+{formatPrice(taxAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-850 flex justify-between text-white font-black text-sm">
                  <span>TOTAL TAGIHAN</span>
                  <span className="text-red-500 text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Coins },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard },
                    { id: 'qris', label: 'QRIS', icon: QrCode }
                  ].map(pm => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(pm.id as any);
                          setErrorMessage('');
                        }}
                        className={`py-2 px-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-[11px] font-bold cursor-pointer ${
                          paymentMethod === pm.id 
                            ? 'bg-red-600/10 border-red-500 text-red-500 shadow shadow-red-600/5'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Paid input (Only Cash) */}
              {paymentMethod === 'cash' && (
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-zinc-400 font-bold">Uang Pembayaran</span>
                    <div className="relative w-full sm:w-44">
                      <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">Rp</span>
                      <input 
                        type="text" 
                        value={amountPaid} 
                        onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0" 
                        className="w-full bg-zinc-900 border border-zinc-800 text-right font-mono font-bold text-sm text-zinc-100 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {[subtotal, grandTotal, 50000, 100000, 200000].map(val => {
                      if (val <= 0) return null;
                      // Round up to nearest nice cash denomination if grand total
                      const niceVal = val === grandTotal ? val : Math.ceil(val / 50000) * 50000;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleCashPreset(niceVal)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                        >
                          {niceVal.toLocaleString('id-ID')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Change readout */}
                  {numericPaid > 0 && (
                    <div className="pt-2 border-t border-zinc-850 flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Uang Kembalian</span>
                      <span className={`font-mono text-sm font-extrabold ${
                        changeAmount > 0 ? 'text-emerald-500' : 'text-zinc-400'
                      }`}>
                        {formatPrice(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout POS error warning */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Processing and Submit Action Button */}
              <button
                type="button"
                disabled={isProcessing || posCart.length === 0 || !isPaidEnough}
                onClick={handleCheckoutPOS}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Memproses Transaksi Kasir...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    <span>Selesaikan Transaksi & Bayar</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* POS Receipt Modal (Pop-up after a successful cash transaction) */}
      <AnimatePresence>
        {completedInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full relative max-h-[90vh] overflow-y-auto flex flex-col justify-between"
            >
              <button 
                onClick={() => setCompletedInvoice(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-2 mb-5">
                <div className="inline-flex p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded-2xl">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-white font-black text-lg">Transaksi Sukses!</h3>
                <p className="text-zinc-500 text-xs">Transaksi tercatat di database & struk siap dicetak.</p>
              </div>

              {/* Miniature Thermal Receipt Layout Preview */}
              <div className="bg-white text-zinc-950 p-4 rounded-2xl border border-zinc-200 shadow-inner font-mono text-[10px] space-y-3 leading-relaxed max-h-[350px] overflow-y-auto select-none">
                <div className="text-center">
                  <span className="font-bold text-xs uppercase block">{settings.storeName}</span>
                  <span className="text-[9px] block text-zinc-600">{settings.storeTagline}</span>
                  <span className="text-[9px] block text-zinc-500">Telp: {settings.whatsappNumber}</span>
                </div>
                
                <div className="border-t border-dashed border-zinc-300"></div>

                <div className="space-y-0.5">
                  <div><b>No Struk:</b> {completedInvoice.id}</div>
                  <div><b>Tanggal :</b> {new Date(completedInvoice.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div><b>Kasir   :</b> {completedInvoice.cashierName || 'Kasir YAP'}</div>
                </div>

                <div className="border-t border-dashed border-zinc-300"></div>

                <table className="w-full text-left text-[10px]">
                  <tbody>
                    {completedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-1">
                          {item.productName} {item.size ? `[${item.size}]` : ''}<br/>
                          <span className="text-zinc-500 text-[9px]">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="text-right py-1 vertical-bottom font-bold">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-zinc-300"></div>

                <div className="space-y-1 font-bold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {completedInvoice.totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {completedInvoice.discountPercent ? completedInvoice.discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Diskon ({completedInvoice.discountPercent}%)</span>
                      <span>-Rp {(completedInvoice.totalPrice * completedInvoice.discountPercent / 100).toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                  {completedInvoice.taxPercent ? completedInvoice.taxPercent > 0 && (
                    <div className="flex justify-between text-zinc-700">
                      <span>Pajak (PB1 {completedInvoice.taxPercent}%)</span>
                      <span>+Rp {Math.round((completedInvoice.totalPrice - (completedInvoice.totalPrice * (completedInvoice.discountPercent || 0) / 100)) * completedInvoice.taxPercent / 100).toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-zinc-300 pt-1 text-[11px]">
                    <span>GRAND TOTAL</span>
                    <span>Rp {completedInvoice.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-300"></div>

                <div className="space-y-0.5 text-zinc-700">
                  <div className="flex justify-between">
                    <span>Bayar via ({completedInvoice.paymentMethod?.toUpperCase()})</span>
                    <span>Rp {completedInvoice.amountPaid?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>Rp {completedInvoice.change?.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Modal Action buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedInvoice(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-zinc-750"
                >
                  <span>Selesai</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
