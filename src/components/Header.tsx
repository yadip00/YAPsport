import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Settings, Store, Sparkles, User } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenCart: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: 'all' | 'jersey' | 'equipment';
  setSelectedCategory: (cat: 'all' | 'jersey' | 'equipment') => void;
  onOpenVisitorLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onOpenVisitorLogin
}) => {
  const { 
    cart, activePanel, setActivePanel, settings,
    isCustomerAuthenticated, customerName, logoutCustomer
  } = useStore();

  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-md text-white shadow-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setActivePanel('store')}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white font-black text-xl sm:text-2xl px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-xl tracking-wider italic flex items-center shadow-lg shadow-red-600/20"
            >
              YAP
            </motion.div>
            <div className="hidden md:block">
              <span className="text-sm font-black text-white block leading-tight tracking-tight">SPORTS & APPAREL</span>
              <span className="text-xs text-red-500 font-mono tracking-tight block">UMKM Webstore</span>
            </div>
          </div>

          {/* Search Bar - only visible when in Storefront mode */}
          {activePanel === 'store' && (
            <div className="hidden sm:block flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari jersey timnas, bola sepak, raket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-100 placeholder-zinc-500 pl-4 pr-10 py-2.5 rounded-full border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm transition-all"
                  id="header-search-input"
                />
                <svg
                  className="absolute right-3 top-3 h-4 w-4 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {activePanel === 'store' ? (
              <>
                {/* Visitor Login / Profile Indicator */}
                {isCustomerAuthenticated ? (
                  <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                    <User className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[10px] sm:text-xs font-black text-zinc-300 max-w-[80px] sm:max-w-[120px] truncate">
                      {customerName}
                    </span>
                    <button 
                      onClick={logoutCustomer}
                      className="text-zinc-500 hover:text-red-500 text-[10px] font-black uppercase transition-colors pl-1.5 border-l border-zinc-800 cursor-pointer"
                      title="Keluar Akun"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenVisitorLogin}
                    className={`flex items-center space-x-1.5 ${
                      settings.requireVisitorLogin 
                        ? 'bg-red-950/40 border-red-900/40 text-red-500 hover:bg-red-900/20' 
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    } border px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all`}
                    title="Masuk Pengunjung"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Masuk</span>
                  </motion.button>
                )}

                {/* Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenCart}
                  className="relative p-2.5 text-zinc-300 hover:text-red-500 hover:bg-zinc-800 rounded-full transition-all flex items-center"
                  id="header-cart-button"
                  title="Keranjang Belanja"
                >
                  <ShoppingBag className="h-6 w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30">
                      {cartItemsCount}
                    </span>
                  )}
                </motion.button>

                {/* Go To Admin Panel */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivePanel('admin')}
                  className="flex items-center space-x-1 sm:space-x-2 bg-zinc-800 hover:bg-red-600 hover:text-white text-red-500 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-zinc-700 hover:border-red-600 transition-all shadow-md"
                  id="header-admin-panel-button"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </motion.button>
              </>
            ) : (
              /* Back to Storefront Button */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActivePanel('store')}
                className="flex items-center space-x-1 sm:space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-red-600/20"
                id="header-storefront-button"
              >
                <Store className="h-4 w-4" />
                <span>Lihat Webstore</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Header Category Filters (Store view) */}
      {activePanel === 'store' && (
        <div className="bg-zinc-950 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Tagline or store name */}
            <p className="text-xs text-zinc-400 font-medium text-center md:text-left flex items-center justify-center gap-1.5 max-w-full md:max-w-md">
              <Sparkles className="h-3 w-3 text-red-500 animate-pulse flex-shrink-0" />
              <span>{settings.storeTagline}</span>
            </p>

            {/* Filter buttons */}
            <div className="flex space-x-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none snap-x justify-center">
              {[
                { id: 'all', label: 'Semua Produk' },
                { id: 'jersey', label: 'Jersey Bola' },
                { id: 'equipment', label: 'Alat Olahraga' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    // Smooth scroll to catalog
                    const catalogEl = document.getElementById('katalog-produk');
                    if (catalogEl) {
                      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tight cursor-pointer transition-all whitespace-nowrap snap-center ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                  id={`filter-button-${cat.id}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
