import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CustomerDetails } from '../types';
import { X, Send, CreditCard, ShoppingBag, Truck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { 
    cart, settings, createInvoice, generateWhatsAppUrl, formatPrice, clearCart,
    isCustomerAuthenticated, customerName, customerPhone
  } = useStore();

  const [form, setForm] = useState<CustomerDetails>({
    name: customerName || '',
    phone: customerPhone || '',
    address: '',
    notes: '',
    shippingMethod: 'regular' // 'regular' or 'pickup'
  });

  React.useEffect(() => {
    if (isCustomerAuthenticated) {
      setForm(prev => ({
        ...prev,
        name: prev.name || customerName,
        phone: prev.phone || customerPhone
      }));
    }
  }, [isCustomerAuthenticated, customerName, customerPhone]);

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = form.shippingMethod === 'pickup' ? 0 : settings.shippingFee;
  const grandTotal = subtotal + shippingFee;

  const validate = () => {
    const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!form.phone.trim()) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi';
    } else if (!/^[0-9+ ]{8,15}$/.test(form.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Masukkan nomor WhatsApp yang valid (minimal 8 angka)';
    }
    if (form.shippingMethod !== 'pickup' && !form.address.trim()) {
      newErrors.address = 'Alamat pengiriman wajib diisi untuk opsi kurir';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof CustomerDetails]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Create Invoice & deduct stock
    const invoice = createInvoice({
      ...form,
      address: form.shippingMethod === 'pickup' ? `Ambil di Toko / Offlline (${settings.address})` : form.address
    });

    // Generate WA URL
    const waUrl = generateWhatsAppUrl(invoice);

    // Give visual delay then redirect and reset
    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      onClose();
      // Redirect to WhatsApp
      window.open(waUrl, '_blank');
    }, 1000);
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

        {/* Modal Stage Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10 border border-zinc-800 flex flex-col md:flex-row text-white"
          id="checkout-modal-container"
        >
          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all"
            id="close-checkout-modal-button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Form Column */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-zinc-800">
            <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2">
              <CreditCard className="text-red-500 h-5 w-5" />
              <span>Formulir Pemesanan UMKM</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Penerima *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                    errors.name ? 'border-red-500 focus:ring-red-500/30' : 'border-zinc-800'
                  }`}
                  id="checkout-input-name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-bold">{errors.name}</p>}
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp HP (Aktif) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                    errors.phone ? 'border-red-500 focus:ring-red-500/30' : 'border-zinc-800'
                  }`}
                  id="checkout-input-phone"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1 font-bold">{errors.phone}</p>}
              </div>

              {/* Shipping Option */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Metode Pengiriman *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border rounded-2xl p-3 flex items-center space-x-3 cursor-pointer transition-all ${
                    form.shippingMethod === 'regular'
                      ? 'border-red-500 bg-red-950/20 text-white'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                  }`}>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="regular"
                      checked={form.shippingMethod === 'regular'}
                      onChange={handleChange}
                      className="accent-red-600"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Truck className="h-3 w-3 text-red-500" />
                        Opsi Kurir
                      </span>
                      <span className="text-[10px] text-zinc-500">{formatPrice(settings.shippingFee)} (Reguler)</span>
                    </div>
                  </label>

                  <label className={`border rounded-2xl p-3 flex items-center space-x-3 cursor-pointer transition-all ${
                    form.shippingMethod === 'pickup'
                      ? 'border-red-500 bg-red-950/20 text-white'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                  }`}>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="pickup"
                      checked={form.shippingMethod === 'pickup'}
                      onChange={handleChange}
                      className="accent-red-600"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        Ambil di Toko
                      </span>
                      <span className="text-[10px] text-zinc-500">Gratis biaya kirim</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Delivery Address (Conditional) */}
              {form.shippingMethod === 'regular' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Alamat Lengkap Pengiriman *
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Tulis jalan, nomor rumah, RT/RW, kecamatan, kota, provinsi, kode pos"
                    className={`w-full bg-zinc-950 border px-4 py-3 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all ${
                      errors.address ? 'border-red-500 focus:ring-red-500/30' : 'border-zinc-800'
                    }`}
                    id="checkout-input-address"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1 font-bold">{errors.address}</p>}
                </div>
              )}

              {/* Additional notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Contoh: Titip di pos satpam, atau jersey minta ukuran M cadangan"
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  id="checkout-input-notes"
                />
              </div>

              {/* Warning note */}
              <p className="text-[10px] text-zinc-500 leading-normal bg-zinc-950 p-3 rounded-2xl border border-zinc-850 flex items-start gap-1.5">
                <span>⚠️</span>
                <span>Proses checkout ini menggunakan koneksi instan WhatsApp. Anda akan dialihkan ke chat nomor penjual (*{settings.whatsappNumber}*) dengan invoice terisi otomatis.</span>
              </p>
            </form>
          </div>

          {/* Invoice Preview Column */}
          <div className="w-full md:w-5/12 bg-zinc-950 text-white p-6 sm:p-8 rounded-b-3xl md:rounded-b-none md:rounded-r-3xl flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-850">
            <div>
              <h3 className="text-white font-extrabold text-lg mb-4 pb-3 border-b border-zinc-800 flex items-center gap-2">
                <ShoppingBag className="text-red-500 h-5 w-5" />
                <span>Rincian Tagihan</span>
              </h3>

              {/* Items List inside invoice */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 mb-4 scrollbar-thin">
                {cart.map(item => (
                  <div key={`${item.product.id}-${item.selectedSize || ''}`} className="flex justify-between items-start text-xs">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-zinc-200 line-clamp-1">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {item.quantity} x {formatPrice(item.product.price)}
                        {item.selectedSize && ` • Size: ${item.selectedSize}`}
                      </p>
                    </div>
                    <span className="font-mono text-zinc-200">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations Block */}
              <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal Belanja</span>
                  <span className="font-mono text-zinc-200">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Pengiriman</span>
                  <span className="font-mono text-zinc-200">
                    {form.shippingMethod === 'pickup' ? 'Gratis' : formatPrice(settings.shippingFee)}
                  </span>
                </div>
                {form.shippingMethod === 'pickup' && (
                  <p className="text-[9px] bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl text-amber-500">
                    📍 Ambil langsung di toko: <br />
                    {settings.address}
                  </p>
                )}
                <div className="flex justify-between text-sm text-white font-black pt-3 border-t border-zinc-800">
                  <span>TOTAL AKHIR</span>
                  <span className="font-mono text-red-500 text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Form submit button triggers */}
            <div className="mt-8">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
                className={`w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  !isSubmitting && cart.length > 0 ? 'shadow-red-600/10' : ''
                }`}
                id="place-order-whatsapp-button"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Membuat Invoice...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim ke WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
