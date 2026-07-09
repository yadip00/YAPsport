import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCheckout
}) => {
  const { cart, removeFromCart, updateCartQuantity, formatPrice } = useStore();

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop clickable overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
        />

        {/* Drawer container stage */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="w-screen max-w-md bg-zinc-900 shadow-2xl border-l border-zinc-800 flex flex-col"
            id="cart-drawer-container"
          >
            {/* Header section */}
            <div className="px-5 py-5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-black tracking-tight">Keranjang Belanja</h3>
                <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-md">
                  {totalItemsCount}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                id="close-cart-drawer-button"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                /* Empty Cart State */
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-zinc-950/30 border border-zinc-850/50 rounded-3xl">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h4 className="text-white font-black text-lg mb-1">Keranjangmu Kosong</h4>
                  <p className="text-zinc-400 text-sm max-w-xs mb-6">
                    Sepertinya Anda belum memilih jersey atau perlengkapan olahraga favorit Anda.
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-red-600 text-white font-black text-sm px-6 py-3 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                    id="cart-shop-now-button"
                  >
                    Mulai Belanja
                  </button>
                </div>
              ) : (
                /* Cart Items List */
                cart.map((item, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={`${item.product.id}-${item.selectedSize || 'none'}`}
                    className="flex space-x-4 p-3 bg-zinc-950 rounded-2xl border border-zinc-850 hover:border-zinc-800 transition-all relative group"
                    id={`cart-item-${item.product.id}`}
                  >
                    {/* Thumbnail */}
                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Meta & adjustments */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-white font-bold text-xs sm:text-sm line-clamp-1 pr-6 group-hover:text-red-500 transition-colors">
                          {item.product.name}
                        </h4>
                        
                        {item.selectedSize && (
                          <span className="inline-block bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 border border-zinc-700">
                            Ukuran: {item.selectedSize}
                          </span>
                        )}

                        <span className="text-red-500 font-extrabold text-xs sm:text-sm block mt-1">
                          {formatPrice(item.product.price)}
                        </span>
                      </div>

                      {/* Quantity Selector inside cart */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden h-7">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                            className="px-2.5 h-full text-zinc-400 hover:text-white font-bold hover:bg-zinc-800 text-xs transition-colors"
                            id={`cart-qty-dec-${item.product.id}`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white font-bold font-mono text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                            className="px-2.5 h-full text-zinc-400 hover:text-white font-bold hover:bg-zinc-800 text-xs transition-colors"
                            disabled={item.quantity >= item.product.stock}
                            id={`cart-qty-inc-${item.product.id}`}
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal of single type item */}
                        <span className="text-white font-black text-xs">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Delete trigger */}
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                      className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-red-500 rounded-xl hover:bg-zinc-800 transition-colors"
                      id={`cart-delete-${item.product.id}`}
                      title="Hapus Produk"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout button */}
            {cart.length > 0 && (
              <div className="border-t border-zinc-800 p-5 space-y-4 bg-zinc-950">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-sm font-semibold">Total Sementara (Subtotal)</span>
                  <span className="text-lg font-black text-white">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  *Belum termasuk ongkos pengiriman. Pengiriman akan dikalkulasi pada tahap pengisian detail penerima selanjutnya.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCheckout();
                  }}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/15 cursor-pointer"
                  id="checkout-trigger-button"
                >
                  <span>Lanjutkan ke Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
