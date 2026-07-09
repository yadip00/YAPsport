import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { X, ShoppingCart, Check, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddedToCart: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddedToCart
}) => {
  if (!product) return null;

  const { addToCart, formatPrice } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedSize('');
    setSizeError(false);
    setIsSuccess(false);
  }, [product]);

  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    if (product.category === 'jersey' && !selectedSize) {
      setSizeError(true);
      return;
    }

    addToCart(product, quantity, product.category === 'jersey' ? selectedSize : undefined);
    
    // Show success state
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      onAddedToCart(); // Opens cart drawer
    }, 800);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10 border border-zinc-800 flex flex-col md:flex-row text-white"
          id={`product-detail-modal-${product.id}`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all"
            id="close-detail-modal-button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Column: Image Stage */}
          <div className="w-full md:w-1/2 bg-zinc-950 relative flex items-center justify-center min-h-[300px] md:min-h-full border-r border-zinc-800">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-[400px] md:max-h-full"
            />
            
            {/* Category Banner */}
            <span className={`absolute bottom-4 left-4 text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-lg border ${
              product.category === 'jersey'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}>
              {product.category === 'jersey' ? 'Jersey Timnas/Klub' : 'Peralatan Olahraga'}
            </span>
          </div>

          {/* Right Column: Full Details */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Product title & price */}
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block mb-1">Yap Store Catalog</span>
              <h2 className="text-white text-xl sm:text-2xl font-black leading-tight mb-2">
                {product.name}
              </h2>
              
              <div className="flex items-baseline space-x-2 my-3">
                <span className="text-2xl sm:text-3xl text-red-500 font-black tracking-tight">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-zinc-500 font-medium">/ pcs</span>
              </div>

              {/* Status Badge & Stock Indicator */}
              <div className="flex items-center space-x-3 mb-6">
                {isOutOfStock ? (
                  <span className="bg-red-950/60 text-red-400 border border-red-900/40 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Stok Habis
                  </span>
                ) : (
                  <span className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-red-500" />
                    Ready Stock (Tersedia: {product.stock} pcs)
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-zinc-200 font-bold text-sm mb-1.5 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <Info className="h-4 w-4 text-zinc-500" />
                  Deskripsi Produk
                </h4>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line max-h-[150px] overflow-y-auto pr-1">
                  {product.description}
                </p>
              </div>

              {/* Jersey Size Selector (Conditional) */}
              {product.category === 'jersey' && product.sizes && (
                <div className="mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-zinc-300 font-bold text-sm">Pilih Ukuran Jersey:</h4>
                    {sizeError && (
                      <span className="text-xs text-red-500 font-bold animate-bounce">
                        *Wajib memilih ukuran
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        disabled={isOutOfStock}
                        className={`w-11 h-11 rounded-xl text-sm font-bold border transition-all flex items-center justify-center cursor-pointer ${
                          selectedSize === size
                            ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-500/30'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                        id={`size-button-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart controls */}
            <div className="mt-8 pt-4 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Quantity adjustments */}
                {!isOutOfStock && (
                  <div className="flex items-center border border-zinc-800 rounded-2xl overflow-hidden h-12 bg-zinc-950">
                    <button
                      onClick={handleDecrement}
                      className="px-4.5 h-full text-zinc-400 hover:text-white font-bold hover:bg-zinc-900 transition-colors"
                      id="decrement-qty-button"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-white font-black font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="px-4.5 h-full text-zinc-400 hover:text-white font-bold hover:bg-zinc-900 transition-colors"
                      id="increment-qty-button"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Submit action button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isSuccess}
                  className={`flex-1 h-12 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    isOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                      : isSuccess
                      ? 'bg-red-700 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10'
                  }`}
                  id="add-to-cart-action-button"
                >
                  {isSuccess ? (
                    <>
                      <Check className="h-5 w-5 stroke-[3]" />
                      <span>Berhasil Ditambahkan!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span>{isOutOfStock ? 'Stok Habis' : 'Masukkan Keranjang'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
