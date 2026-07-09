import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { VisitorLoginModal } from './components/VisitorLoginModal';
import { 
  ShoppingBag, Search, Sparkles, Award, ShieldCheck, HeartHandshake, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { 
    products, settings, activePanel, formatPrice, isAdminAuthenticated,
    isCustomerAuthenticated, isLoading
  } = useStore();

  // Dialog overlay controls
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isVisitorLoginOpen, setIsVisitorLoginOpen] = useState(false);

  // Search & category states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'jersey' | 'equipment'>('all');

  // Automatically open Visitor Login modal if forced in settings and not authenticated
  useEffect(() => {
    if (!isLoading && settings.requireVisitorLogin && !isCustomerAuthenticated) {
      setIsVisitorLoginOpen(true);
    }
  }, [isLoading, settings.requireVisitorLogin, isCustomerAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans p-6" id="app-loading-screen">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute w-10 h-10 border-4 border-emerald-500/20 border-b-emerald-500 rounded-full animate-spin [animation-direction:reverse]"></div>
        </div>
        <div className="text-zinc-400 font-black text-xs sm:text-sm tracking-widest uppercase mt-6 animate-pulse">
          Menghubungkan ke Database...
        </div>
      </div>
    );
  }

  const handleSelectProduct = (prod: any) => {
    if (settings.requireVisitorLogin && !isCustomerAuthenticated) {
      setIsVisitorLoginOpen(true);
    } else {
      setSelectedProduct(prod);
    }
  };

  const handleOpenCart = () => {
    if (settings.requireVisitorLogin && !isCustomerAuthenticated) {
      setIsVisitorLoginOpen(true);
    } else {
      setIsCartOpen(true);
    }
  };

  // Filter products based on search term & category
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = filteredProducts.filter(p => p.isFeatured);
  const regularProducts = filteredProducts.filter(p => !p.isFeatured);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans" id="yap-webstore-root">
      
      {/* Sticky Navigation Header */}
      <Header
        onOpenCart={handleOpenCart}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenVisitorLogin={() => setIsVisitorLoginOpen(true)}
      />

      {/* RENDER BODY BASED ON ACTIVE PANEL ROUTING */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* PANEL 1: CLIENT WEBSTORE */}
          {activePanel === 'store' ? (
            <motion.div
              key="storefront"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
              id="webstore-storefront-panel"
            >
              
              {/* Athletic Hero Spotlight Banner (Bento Large) */}
              <section className="relative bg-zinc-900 text-white overflow-hidden py-12 sm:py-20 rounded-[2rem] border border-zinc-800 shadow-2xl mx-4 sm:mx-6 lg:mx-8 mt-6">
                {/* Background accent decor */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Left text spotlight */}
                    <div className="space-y-6 text-center lg:text-left">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center space-x-1.5 bg-red-950/40 border border-red-900/50 text-red-500 font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse text-red-500" />
                        <span>Koleksi Olahraga UMKM Premium</span>
                      </motion.div>

                      <motion.h1 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none"
                      >
                        Dukung Tim Kebanggaan, <br />
                        <span className="text-red-500">Maksimalkan Olahragamu</span>
                      </motion.h1>

                      <motion.p 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed"
                      >
                        Temukan berbagai jersey sepak bola berkualitas tinggi, bola sepak pro, raket carbon, dan peralatan olahraga terbaik dari UMKM lokal dengan kemudahan pembayaran langsung via WhatsApp.
                      </motion.p>

                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                      >
                        <a
                          href="#katalog-produk"
                          className="bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm px-8 py-3.5 rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span>Belanja Sekarang</span>
                        </a>
                        <button
                          onClick={() => {
                            const input = document.getElementById('header-search-input');
                            if (input) {
                              input.focus();
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-sm px-8 py-3.5 rounded-xl transition-all"
                        >
                          Cari Produk
                        </button>
                      </motion.div>
                    </div>

                    {/* Right visual mockup card */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                      className="hidden lg:flex justify-center relative"
                    >
                      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full relative">
                        <span className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow">HOT SELLER</span>
                        <img 
                          src={products.find(p => p.id === 'prod-1')?.image || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80"} 
                          alt="Jersey Timnas Indonesia Red Edition" 
                          referrerPolicy="no-referrer"
                          className="w-full h-48 object-cover rounded-xl border border-zinc-800"
                        />
                        <div className="mt-4 space-y-2">
                          <h4 className="text-white font-black text-base">Jersey Timnas Indonesia Red Edition</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2">Bahan dri-fit berpori mikro sejuk dengan bordir lambang Garuda 3D timbul mewah.</p>
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                            <span className="text-red-500 font-extrabold text-lg">{formatPrice(185000)}</span>
                            <button 
                              onClick={() => {
                                const prod = products.find(p => p.id === 'prod-1');
                                if (prod) handleSelectProduct(prod);
                              }}
                              className="text-xs bg-red-600 text-white font-extrabold px-3.5 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Core Features / Promises section (Bento Mediums) */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Promise 1 */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex items-start space-x-4">
                    <div className="p-3 bg-red-950/50 text-red-500 border border-red-900/50 rounded-xl flex-shrink-0">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">Kualitas Premium</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Jersey menggunakan bahan dri-fit kualitas ekspor yang sejuk serta awet untuk olahraga berkeringat tinggi.
                      </p>
                    </div>
                  </div>

                  {/* Promise 2 */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex items-start space-x-4">
                    <div className="p-3 bg-red-950/50 text-red-500 border border-red-900/50 rounded-xl flex-shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">Amanah & Terpercaya</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Kami adalah produsen lokal UMKM yang berkomitmen memberikan harga kompetitif dengan kontrol mutu terbaik.
                      </p>
                    </div>
                  </div>

                  {/* Promise 3 */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex items-start space-x-4">
                    <div className="p-3 bg-red-950/50 text-red-500 border border-red-900/50 rounded-xl flex-shrink-0">
                      <HeartHandshake className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">WhatsApp Checkout Instan</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Sistem keranjang belanja praktis yang langsung merangkum pesanan menjadi invoice dan terhubung ke WhatsApp penjual.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* PRODUCT CATALOG SECTIONS */}
              <section id="katalog-produk" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
                
                {/* Section title & search status info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-3">
                  <div>
                    <h2 className="text-white font-extrabold text-2xl sm:text-3xl flex items-center gap-2 tracking-tight">
                      <span>Katalog Produk Terlengkap</span>
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                      Menampilkan koleksi terbaik {selectedCategory !== 'all' ? `kategori ${selectedCategory === 'jersey' ? 'Jersey Bola' : 'Alat Olahraga'}` : ''} untuk olahraga harian Anda.
                    </p>
                  </div>
                  
                  {/* Dynamic Results Counter */}
                  <span className="bg-zinc-900 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full border border-zinc-800">
                    Ditemukan: {filteredProducts.length} Produk
                  </span>
                </div>

                {/* If Search/Filters yields nothing */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-2xl text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                      <Search className="h-7 w-7 text-red-500" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">Produk Tidak Ditemukan</h4>
                    <p className="text-zinc-400 text-xs sm:text-sm max-w-xs mx-auto mb-6">
                      Maaf, kami tidak dapat menemukan barang yang sesuai dengan kata kunci "{searchTerm}". Coba kata kunci lainnya.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Reset Filter & Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* 1. Featured / Hot Products Grid */}
                    {featuredProducts.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-white font-extrabold text-lg flex items-center gap-1.5 border-l-4 border-red-600 pl-3">
                          🔥 Produk Paling Populer (Best Seller)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {featuredProducts.map(prod => (
                            <ProductCard
                              key={prod.id}
                              product={prod}
                              onSelect={handleSelectProduct}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Regular Products Grid */}
                    {regularProducts.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-white font-extrabold text-lg flex items-center gap-1.5 border-l-4 border-zinc-700 pl-3">
                          🛍️ Semua Koleksi Produk
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {regularProducts.map(prod => (
                            <ProductCard
                              key={prod.id}
                              product={prod}
                              onSelect={handleSelectProduct}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Trust badges footer layout (Bento Wide Box) */}
              <section className="mx-4 sm:mx-6 lg:mx-8 mb-12">
                <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 p-8 sm:p-12 rounded-[2rem] text-center space-y-4 shadow-xl">
                  <h3 className="text-white font-black text-xl sm:text-2xl tracking-tight">Belanja Nyaman, Dukung Pengrajin Lokal</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                    Setiap pembelian jersey dan peralatan olahraga di <b className="text-red-500">{settings.storeName}</b> ikut memberdayakan konveksi kecil, pengrajin jahit bola, dan talenta UMKM Indonesia untuk terus berkarya.
                  </p>
                </div>
              </section>

            </motion.div>
          ) : (
            
            /* PANEL 2: PORTAL ADMIN VIEW / AUTH GATEWAY */
            <motion.div
              key="admin-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isAdminAuthenticated ? <AdminPanel /> : <AdminLogin />}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* COMPREHENSIVE FOOTER (Bento-style container at bottom) */}
      <footer className="bg-zinc-900 text-zinc-400 text-xs py-10 sm:py-14 border-t border-zinc-800 mx-4 sm:mx-6 lg:mx-8 mb-6 rounded-[2rem] shadow-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pb-8 border-b border-zinc-800">
            {/* Branding block */}
            <div className="space-y-3">
              <span className="text-red-500 font-extrabold text-2xl tracking-wider italic">YAP STORE</span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                {settings.storeTagline}
              </p>
              <p className="text-zinc-500 text-[10px]">
                © {new Date().getFullYear()} Yap Sports & Apparel. All Rights Reserved.
              </p>
            </div>

            {/* Offline Store Address block */}
            <div className="space-y-3">
              <span className="text-white font-bold text-sm block">Gudang Offline</span>
              <p className="text-zinc-400 leading-relaxed text-[11px] flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
            </div>

            {/* Merchant contact block */}
            <div className="space-y-3">
              <span className="text-white font-bold text-sm block">Hubungi Admin</span>
              <p className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>WhatsApp: {settings.whatsappNumber}</span>
              </p>
              <p className="text-zinc-500 text-[10px]">
                Dibuat Khusus untuk Digitalisasi UMKM Indonesia
              </p>
            </div>
          </div>
          
          <div className="pt-6 text-center text-zinc-500 text-[10px]">
            Portal Webstore & Admin didukung oleh system state terenkapsulasi yang aman dan responsif.
          </div>
        </div>
      </footer>

      {/* OVERLAY ELEMENTS */}
      
      {/* 1. Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* 2. Customer Checkout Modal (Invoice & WhatsApp Generator) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* 3. Product Info Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddedToCart={() => setIsCartOpen(true)} // Instantly opens cart when added!
      />

      {/* 4. Visitor Login Modal */}
      <VisitorLoginModal
        isOpen={isVisitorLoginOpen}
        onClose={() => setIsVisitorLoginOpen(false)}
        forceMode={settings.requireVisitorLogin}
      />

    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
