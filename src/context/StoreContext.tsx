import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, StoreSettings, Invoice, CustomerDetails } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialProducts';
import { collection, onSnapshot, setDoc, doc, deleteDoc, writeBatch, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';

const cleanUndefined = <T,>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
};

interface StoreContextType {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  invoices: Invoice[];
  activePanel: 'store' | 'admin';
  setActivePanel: (panel: 'store' | 'admin') => void;
  isAdminAuthenticated: boolean;
  userRole: 'admin' | 'kasir' | null;
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
  createPOSInvoice: (
    items: { productId: string; name: string; quantity: number; price: number; size?: string }[],
    paymentMethod: 'cash' | 'transfer' | 'qris',
    amountPaid: number,
    discountPercent: number,
    taxPercent: number,
    cashierName: string
  ) => Promise<Invoice>;
  formatPrice: (price: number) => string;
  generateWhatsAppUrl: (invoice: Invoice) => string;
  resetAllData: () => void;
  isLoading: boolean;
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

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const isLoading = isLoadingProducts || isLoadingSettings || isLoadingInvoices;

  const [activePanel, setActivePanel] = useState<'store' | 'admin'>(() => {
    const saved = localStorage.getItem('yap_active_panel');
    return (saved === 'store' || saved === 'admin') ? saved : 'store';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('yap_admin_auth') === 'true';
  });
  const [userRole, setUserRole] = useState<'admin' | 'kasir' | null>(() => {
    return localStorage.getItem('yap_user_role') as 'admin' | 'kasir' | null;
  });

  const loginAdmin = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    // Allow either YAPStore/123456 or admin@yapstore.com/admin123 for Admin
    if (
      (cleanEmail === 'yapstore' && pass === '123456') ||
      ((cleanEmail === 'admin@yapstore.com' || cleanEmail === 'admin@gmail.com') && pass === 'admin123')
    ) {
      setIsAdminAuthenticated(true);
      setUserRole('admin');
      localStorage.setItem('yap_admin_auth', 'true');
      localStorage.setItem('yap_user_role', 'admin');
      return true;
    }
    // Allow either kasir/123456 or kasir@yapstore.com/kasir123 for Kasir
    else if (
      (cleanEmail === 'kasir' || cleanEmail === 'kasiryap' || cleanEmail === 'kasir@yapstore.com') &&
      (pass === '123456' || pass === 'kasir123')
    ) {
      setIsAdminAuthenticated(true);
      setUserRole('kasir');
      localStorage.setItem('yap_admin_auth', 'true');
      localStorage.setItem('yap_user_role', 'kasir');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('yap_admin_auth');
    localStorage.removeItem('yap_user_role');
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
        batch.commit()
          .then(() => {
            // Seeding committed, next snapshot trigger will update local state and resolve loading
          })
          .catch((err) => {
            console.error('Error seeding products batch to Firestore:', err);
            setIsLoadingProducts(false);
          });
      } else {
        const firestoreProds = snapshot.docs.map((d) => {
          const prod = d.data() as Product;
          // Self-heal local image paths by resolving them to the correct runtime bundled assets
          if (prod.image && !prod.image.startsWith('http') && !prod.image.startsWith('data:')) {
            const initialProd = INITIAL_PRODUCTS.find(p => p.id === prod.id);
            if (initialProd) {
              return { ...prod, image: initialProd.image };
            }
          }
          return prod;
        });
        // Sort products using natural sort so the order matches INITIAL_PRODUCTS or custom products order
        firestoreProds.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        setProducts(firestoreProds);
        setIsLoadingProducts(false);
      }
    }, (error) => {
      console.error("Firestore products read error:", error);
      setIsLoadingProducts(false);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'store_settings'), (snapshot) => {
      if (!snapshot.exists()) {
        // Seed initial settings to Firestore
        setDoc(doc(db, 'settings', 'store_settings'), INITIAL_SETTINGS)
          .then(() => {
            // Seeding committed, next snapshot trigger will update local state and resolve loading
          })
          .catch((err) => {
            console.error('Error seeding settings to Firestore:', err);
            setIsLoadingSettings(false);
          });
      } else {
        const rawSettings = snapshot.data() as StoreSettings;
        let finalSettings = { ...rawSettings };
        let needsUpdate = false;

        if (finalSettings.storeName && finalSettings.storeName.includes('Yap')) {
          finalSettings.storeName = finalSettings.storeName.replace(/Yap/g, 'YAP');
          needsUpdate = true;
        }
        if (finalSettings.storeName && finalSettings.storeName.includes('Sports & Apparel')) {
          finalSettings.storeName = finalSettings.storeName.replace('Sports & Apparel', 'Sport & Apparel');
          needsUpdate = true;
        }

        if (needsUpdate) {
          setDoc(doc(db, 'settings', 'store_settings'), finalSettings).catch(err => 
            console.error('Error auto-updating store settings to YAP in Firestore:', err)
          );
        }

        setSettings(finalSettings);
        setIsLoadingSettings(false);
      }
    }, (error) => {
      console.error("Firestore settings read error:", error);
      setIsLoadingSettings(false);
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
      setIsLoadingInvoices(false);
    }, (error) => {
      console.error("Firestore invoices read error:", error);
      setIsLoadingInvoices(false);
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
    setDoc(doc(db, 'products', product.id), cleanUndefined(product)).catch(err => console.error("Error adding product to Firestore:", err));
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (updatedProd: Product) => {
    // Sync to Firestore
    setDoc(doc(db, 'products', updatedProd.id), cleanUndefined(updatedProd)).catch(err => console.error("Error updating product to Firestore:", err));
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
    setDoc(doc(db, 'settings', 'store_settings'), cleanUndefined(newSettings)).catch(err => console.error("Error updating settings to Firestore:", err));
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
    const items = cart.map(item => {
      const mappedItem: any = {
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      };
      if (item.selectedSize !== undefined && item.selectedSize !== null) {
        mappedItem.size = item.selectedSize;
      }
      return mappedItem;
    });

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
    setDoc(doc(db, 'invoices', invoice.id), cleanUndefined(invoice)).catch(err => console.error("Error saving invoice to Firestore:", err));

    // 2. Update stock of products in local state and Firestore!
    const updatedProducts = products.map(p => {
      const purchasedItem = items.find(item => item.productId === p.id);
      if (purchasedItem) {
        const newStock = Math.max(0, p.stock - purchasedItem.quantity);
        const updated = { ...p, stock: newStock };
        // Sync new stock to Firestore
        setDoc(doc(db, 'products', p.id), cleanUndefined(updated)).catch(err => console.error("Error updating product stock to Firestore:", err));
        return updated;
      }
      return p;
    });

    setInvoices(prev => [invoice, ...prev]);
    setProducts(updatedProducts);

    return invoice;
  };

  const createPOSInvoice = async (
    items: { productId: string; name: string; quantity: number; price: number; size?: string }[],
    paymentMethod: 'cash' | 'transfer' | 'qris',
    amountPaid: number,
    discountPercent: number,
    taxPercent: number,
    cashierName: string
  ): Promise<Invoice> => {
    const invoiceId = `YAP-POS-${Date.now().toString().slice(-6)}`;

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.round(totalPrice * (discountPercent / 100));
    const taxableAmount = totalPrice - discountAmount;
    const taxAmount = Math.round(taxableAmount * (taxPercent / 100));
    const grandTotal = taxableAmount + taxAmount;

    const invoice: Invoice = {
      id: invoiceId,
      customer: {
        name: 'Pelanggan POS / Kasir',
        phone: '-',
        address: 'Penjualan Langsung Toko (POS)',
        shippingMethod: 'pickup',
        notes: `Pembayaran: ${paymentMethod.toUpperCase()}`
      },
      items: items.map(item => {
        const mappedItem: any = {
          productId: item.productId,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        };
        if (item.size !== undefined && item.size !== null) {
          mappedItem.size = item.size;
        }
        return mappedItem;
      }),
      totalPrice,
      shippingFee: 0,
      grandTotal,
      createdAt: new Date().toISOString(),
      status: 'sent',
      paymentMethod,
      amountPaid,
      change: paymentMethod === 'cash' ? Math.max(0, amountPaid - grandTotal) : 0,
      discountPercent,
      taxPercent,
      cashierName,
      isPOS: true
    };

    try {
      await runTransaction(db, async (transaction) => {
        // Fetch all product docs inside the transaction
        const productRefs = items.map(item => doc(db, 'products', item.productId));
        const productSnapshots = await Promise.all(
          productRefs.map(ref => transaction.get(ref))
        );

        const updates: { ref: any; updatedProduct: Product }[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const snap = productSnapshots[i];
          
          if (!snap.exists()) {
            throw new Error(`Produk "${item.name}" tidak ditemukan di database!`);
          }

          const dbProd = snap.data() as Product;
          if (dbProd.stock < item.quantity) {
            throw new Error(`Stok "${item.name}" tidak mencukupi! Tersedia: ${dbProd.stock}, diminta: ${item.quantity}`);
          }

          const newStock = dbProd.stock - item.quantity;
          updates.push({
            ref: snap.ref,
            updatedProduct: { ...dbProd, stock: newStock }
          });
        }

        // Apply all stock updates in the transaction
        for (const update of updates) {
          transaction.set(update.ref, cleanUndefined(update.updatedProduct));
        }

        // Save POS invoice log
        const invoiceRef = doc(db, 'invoices', invoiceId);
        transaction.set(invoiceRef, cleanUndefined(invoice));
      });

      // Update local state if transaction succeeds
      setProducts(prev => {
        return prev.map(p => {
          const purchased = items.find(item => item.productId === p.id);
          if (purchased) {
            return { ...p, stock: Math.max(0, p.stock - purchased.quantity) };
          }
          return p;
        });
      });
      setInvoices(prev => [invoice, ...prev]);

      return invoice;
    } catch (error: any) {
      console.error("Firestore POS Transaction Failed:", error);
      throw new Error(error.message || "Gagal memproses transaksi karena kesalahan database.");
    }
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
      userRole,
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
      createPOSInvoice,
      formatPrice,
      generateWhatsAppUrl,
      resetAllData,
      isLoading
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
