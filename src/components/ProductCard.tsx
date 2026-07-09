import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Eye, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, formatPrice } = useStore();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (product.category === 'jersey') {
      // If it's a jersey, we MUST let them select a size, so open detail modal
      onSelect(product);
    } else {
      // If equipment, directly add to cart
      addToCart(product, 1);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900 rounded-3xl shadow-xl hover:shadow-2xl border border-zinc-800 overflow-hidden flex flex-col h-full cursor-pointer group"
      onClick={() => onSelect(product)}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative pt-[85%] bg-zinc-950 overflow-hidden border-b border-zinc-800">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Category Tag */}
        <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md ${
          product.category === 'jersey'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
        }`}>
          {product.category === 'jersey' ? 'Jersey' : 'Alat Olahraga'}
        </span>

        {/* Featured Tag */}
        {product.isFeatured && (
          <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase bg-red-600 text-white px-2.5 py-1 rounded-full shadow-md">
            Hot
          </span>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
            <span className="bg-red-600 text-white font-black uppercase text-xs tracking-wider px-3 py-1.5 rounded-md shadow-md animate-pulse">
              Habis / Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Details info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Stock Notification */}
          {isLowStock && (
            <p className="text-[10px] text-amber-500 font-bold mb-1.5 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Sisa {product.stock} pcs terakhir!</span>
            </p>
          )}

          <h3 className="text-white font-black text-sm sm:text-base leading-snug group-hover:text-red-500 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Harga</span>
              <span className="text-red-500 font-extrabold text-base sm:text-lg">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex space-x-1.5">
              {/* Quick Add Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleQuickAdd}
                disabled={isOutOfStock}
                className={`p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center ${
                  isOutOfStock
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/10'
                }`}
                title={product.category === 'jersey' ? 'Pilih Ukuran' : 'Tambah ke Keranjang'}
                id={`quick-add-${product.id}`}
              >
                <ShoppingCart className="h-4 w-4" />
              </motion.button>

              {/* View Details Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelect(product)}
                className="p-2.5 bg-zinc-850 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all flex items-center justify-center"
                title="Lihat Detail"
                id={`view-details-${product.id}`}
              >
                <Eye className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
