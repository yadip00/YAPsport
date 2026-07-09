import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, StoreSettings, Invoice, CustomerDetails } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialProducts';
import { collection, onSnapshot, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StoreContextType {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  invoices: Invoice[];
  activePanel: 'store' | 'admin';
  setActivePanel: (panel: 'store' | 'admin') => void;
  isAdminAuthenticated: boolean;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  isCustomerAuthenticated: boolean;
  customerName: string;
  customerPhone: string;
  loginCustomer: (name: string, phone: string) => void;
  logoutCustomer: () => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateSettings: (settings: StoreSettings) => void;
  addToCart: (product: Product, quantity: number, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  createInvoice: (customer: CustomerDetails) => Invoice;
  formatPrice: (price: number) => string;
  generateWhatsAppUrl: (invoice: Invoice) => string;
  resetAllData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('yap_products');
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        // Automatically heal/migrate image URLs if they are old unsplash links, empty, or not a local path
        return parsed.map(p => {
          const initial = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
          if (initial) {
            const isLocalImage = p.image && (
              p.image.startsWith('/src/assets/') || 
              p.image.startsWith('/assets/') || 
              p.image.startsWith('data:image/') || 
              p.image.startsWith('blob:') ||
              p.image.includes('/assets/images/')
            );
            if (!isLocalImage || p.image.includes('unsplash.com')) {
              return { ...p, image: initial.image };
            }
          }
          return p;
        });
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('yap_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('yap_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('yap_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePanel, setActivePanel] = useState<'store' | 'admin'>(() => {
    const saved = localStorage.getItem('yap_active_panel');
    return (saved === 'store' || saved === 'admin') ? saved : 'store';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('yap_admin_auth') === 'true';
  });

  const loginAdmin = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    // Allow either YAPStore/123456 or admin@yapstore.com/admin123
    if (
      (cleanEmail === 'yapstore' && pass === '123456') ||
      ((cleanEmail === 'admin@yapstore.com' || cleanEmail === 'admin@gmail.com') && pass === 'admin123')
    ) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('yap_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('yap_admin_auth');
    setActivePanel('store');
  };

  const [isCustomerAuthenticated, setIsCustomerAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('yap_customer_auth') === 'true';
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    return localStorage.getItem('yap_customer_name') || '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return localStorage.getItem('yap_customer_phone') || '';
  });

  const loginCustomer = (name: string, phone: string) => {
    setIsCustomerAuthenticated(true);
    setCustomerName(name);
    setCustomerPhone(phone);
    localStorage.setItem('yap_customer_auth', 'true');
    localStorage.setItem('yap_customer_name', name);
    localStorage.setItem('yap_customer_phone', phone);
  };

  const logoutCustomer = () => {
    setIsCustomerAuthenticated(false);
    setCustomerName('');
    setCustomerPhone('');
    localStorage.removeItem('yap_customer_auth');
    localStorage.removeItem('yap_customer_name');
    localStorage.removeItem('yap_customer_phone');
  };

  // Real-time synchronization with Firestore
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, seed it with INITIAL_PRODUCTS atomically using writeBatch to avoid partial lists
        const batch = writeBatch(db);
        INITIAL_PRODUCTS.forEach((prod) => {
          batch.set(doc(db, 'products', prod.id), prod);
        });
        batch.commit().catch((err) =>
          console.error('Error seeding products batch to Firestore:', err)
        );
      } else {
        const firestoreProds = snapshot.docs.map((d) => d.data() as Product);
        // Sort products using natural sort so the order matches INITIAL_PRODUCTS or custom products order
        firestoreProds.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        setProducts(firestoreProds);
      }
    }, (error) => {
      console.error("Firestore products read error:", error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'store_settings'), (snapshot) => {
      if (!snapshot.exists()) {
        // Seed initial settings to Firestore
        setDoc(doc(db, 'settings', 'store_settings'), INITIAL_SETTINGS).catch((err) =>
          console.error('Error seeding settings to Firestore:', err)
        );
      } else {
        setSettings(snapshot.data() as StoreSettings);
      }
    }, (error) => {
      console.error("Firestore settings read error:", error);
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreInvoices = snapshot.docs.map((d) => d.data() as Invoice);
        // Sort newest first
        firestoreInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(firestoreInvoices);
      } else {
        setInvoices([]);
      }
    }, (error) => {
      console.error("Firestore invoices read error:", error);
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubInvoices();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('yap_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('yap_active_panel', activePanel);
  }, [activePanel]);

  useEffect(() => {
    localStorage.setItem('yap_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('yap_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('yap_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Price formatting helper (IDR Rp)
  const formatPrice = (price: number) => {
    return `${settings.currencySymbol}${price.toLocaleString('id-ID')}`;
  };

  // Admin inventory helpers
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`
    };
    // Sync to Firestore
    setDoc(doc(db, 'products', product.id), product).catch(err => console.error("Error adding product to Firestore:", err));
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (updatedProd: Product) => {
    // Sync to Firestore
    setDoc(doc(db, 'products', updatedProd.id), updatedProd).catch(err => console.error("Error updating product to Firestore:", err));
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    // also update corresponding products in the cart if their price/image changed
    setCart(prev => prev.map(item => {
      if (item.product.id === updatedProd.id) {
        return { ...item, product: updatedProd };
      }
      return item;
    }));
  };

  const deleteProduct = (id: string) => {
    // Sync to Firestore
    deleteDoc(doc(db, 'products', id)).catch(err => console.error("Error deleting product from Firestore:", err));
    setProducts(prev => prev.filter(p => p.id !== id));
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    // Sync to Firestore
    setDoc(doc(db, 'settings', 'store_settings'), newSettings).catch(err => console.error("Error updating settings to Firestore:", err));
    setSettings(newSettings);
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number, size?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.selectedSize === size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, selectedSize: size }];
      }
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedSize === size)
    ));
  };

  const updateCartQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedSize === size) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Create invoice log
  const createInvoice = (customer: CustomerDetails): Invoice => {
    const items = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      size: item.selectedSize,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity
    }));

    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = customer.shippingMethod === 'pickup' ? 0 : settings.shippingFee;
    const grandTotal = totalPrice + shippingFee;

    const invoice: Invoice = {
      id: `YAP-${Date.now().toString().slice(-6)}`,
      customer,
      items,
      totalPrice,
      shippingFee,
      grandTotal,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // 1. Write invoice to Firestore
    setDoc(doc(db, 'invoices', invoice.id), invoice).catch(err => console.error("Error saving invoice to Firestore:", err));

    // 2. Update stock of products in local state and Firestore!
    const updatedProducts = products.map(p => {
      const purchasedItem = items.find(item => item.productId === p.id);
      if (purchasedItem) {
        const newStock = Math.max(0, p.stock - purchasedItem.quantity);
        const updated = { ...p, stock: newStock };
        // Sync new stock to Firestore
        setDoc(doc(db, 'products', p.id), updated).catch(err => console.error("Error updating product stock to Firestore:", err));
        return updated;
      }
      return p;
    });

    setInvoices(prev => [invoice, ...prev]);
    setProducts(updatedProducts);

    return invoice;
  };

  // Generate WhatsApp Redirect Link with Indonesia Country Code validation
  const generateWhatsAppUrl = (invoice: Invoice) => {
    let cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const titleStr = `*📄 INVOICE #${invoice.id} - ${settings.storeName}*`;
    const lineStr = `----------------------------------------------`;
    
    let itemsStr = `*Detail Pesanan:*`;
    invoice.items.forEach((item, index) => {
      const sizeTag = item.size ? ` [Ukuran: ${item.size}]` : '';
      itemsStr += `\n${index + 1}. *${item.productName}*${sizeTag}\n    Qty: ${item.quantity} x ${formatPrice(item.price)} = _${formatPrice(item.subtotal)}_`;
    });

    const feeStr = invoice.shippingFee === 0 ? 'Gratis / Ambil Sendiri' : formatPrice(invoice.shippingFee);
    const detailsStr = 
`*Rincian Pembayaran:*
• Subtotal: ${formatPrice(invoice.totalPrice)}
• Ongkir (${invoice.customer.shippingMethod.toUpperCase()}): ${feeStr}
• *Total Tagihan:* *${formatPrice(invoice.grandTotal)}*`;

    const customerStr = 
`*Informasi Pengiriman:*
• *Nama:* ${invoice.customer.name}
• *No. HP:* ${invoice.customer.phone}
• *Alamat:* ${invoice.customer.address}
${invoice.customer.notes ? `• *Catatan:* ${invoice.customer.notes}` : ''}`;

    const text = `${titleStr}
${lineStr}
Halo Admin *${settings.storeName}*, saya ingin melakukan pemesanan untuk produk olahraga berikut:

${itemsStr}

${lineStr}
${detailsStr}

${lineStr}
${customerStr}

${lineStr}
_Mohon instruksi selanjutnya untuk pembayaran dan pengiriman barang. Terima kasih!_`;

    const encodedText = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  };

  const resetAllData = async () => {
    localStorage.removeItem('yap_products');
    localStorage.removeItem('yap_settings');
    localStorage.removeItem('yap_cart');
    localStorage.removeItem('yap_invoices');
    localStorage.removeItem('yap_active_panel');
    
    // Clear and reset Firestore collections in real-time atomically using writeBatch
    try {
      const batch = writeBatch(db);

      // 1. Reset settings in the batch
      batch.set(doc(db, 'settings', 'store_settings'), INITIAL_SETTINGS);
      
      // 2. Delete all existing invoices in the batch
      invoices.forEach(inv => {
        batch.delete(doc(db, 'invoices', inv.id));
      });
      
      // 3. Delete all current products and seed INITIAL_PRODUCTS in the same batch
      products.forEach(prod => {
        batch.delete(doc(db, 'products', prod.id));
      });
      
      INITIAL_PRODUCTS.forEach(prod => {
        batch.set(doc(db, 'products', prod.id), prod);
      });

      // Commit the batch atomically so listeners only see a single consolidated update
      await batch.commit();
    } catch (e) {
      console.error("Error resetting Firestore data in real-time:", e);
    }
    
    setProducts(INITIAL_PRODUCTS);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    setInvoices([]);
    setActivePanel('store');
  };

  return (
    <StoreContext.Provider value={{
      products,
      settings,
      cart,
      invoices,
      activePanel,
      setActivePanel,
      isAdminAuthenticated,
      loginAdmin,
      logoutAdmin,
      isCustomerAuthenticated,
      customerName,
      customerPhone,
      loginCustomer,
      logoutCustomer,
      addProduct,
      updateProduct,
      deleteProduct,
      updateSettings,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      createInvoice,
      formatPrice,
      generateWhatsAppUrl,
      resetAllData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
