import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Mail, Phone, User, Sparkles, LogIn, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisitorLoginModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional if we allow closing, but we'll enforce it if they must log in
  forceMode?: boolean; // If true, hide close button so they MUST login to proceed
}

export const VisitorLoginModal: React.FC<VisitorLoginModalProps> = ({ 
  isOpen, 
  onClose,
  forceMode = true 
}) => {
  const { loginCustomer, settings } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan masukkan nama lengkap Anda.');
      return;
    }
    if (!phone.trim()) {
      setError('Silakan masukkan nomor WhatsApp Anda.');
      return;
    }
    
    // Process clean phone
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith('62') && cleanPhone.length > 0) {
      cleanPhone = '62' + cleanPhone;
    }

    if (cleanPhone.length < 10) {
      setError('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit.');
      return;
    }

    loginCustomer(name.trim(), cleanPhone);
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md"
          onClick={() => {
            if (!forceMode && onClose) onClose();
          }}
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden z-10 space-y-6"
          id="visitor-login-modal-box"
        >
          {/* Subtle gradient highlights */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-red-600/5 rounded-full blur-2xl pointer-events-none"></div>

          {/* Close button - only shown if not forced */}
          {!forceMode && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Header block */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-red-950/40 text-red-500 border border-red-900/50 rounded-2xl mb-1">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="text-white font-black text-xl sm:text-2xl tracking-tight">Daftar Pengunjung Toko</h3>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xs mx-auto">
              Silakan isi nama dan nomor WhatsApp Anda untuk menjelajahi produk & belanja di <b className="text-red-500">{settings.storeName}</b>
            </p>
          </div>

          {/* Demo Info / Tagline */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Info Pengunjung</span>
            </span>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Data ini digunakan hanya untuk mempermudah pengisian otomatis invoice checkout langsung ke WhatsApp tanpa perlu mengisi form ulang nanti!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {error && (
              <div className="bg-red-950/50 border border-red-900/50 p-3 rounded-xl text-red-400 font-bold text-xs text-center">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Nama Lengkap</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-zinc-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama Anda (cth: Budi Santoso)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800/80 pl-10 pr-4 py-3 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-xs sm:text-sm"
                  id="visitor-login-name-input"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Nomor WhatsApp Aktif</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-zinc-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789 atau 628123..."
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800/80 pl-10 pr-4 py-3 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-xs sm:text-sm"
                  id="visitor-login-phone-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-red-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              id="visitor-login-submit-button"
            >
              <LogIn className="h-4 w-4" />
              <span>Mulai Belanja Sekarang</span>
            </button>
          </form>

          {/* Mode Switch Footer Alert */}
          <div className="text-center text-[10px] text-zinc-500 pt-1">
            Mode Akses Web Store diatur oleh Admin melalui Dashboard Toko secara Real-time.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
