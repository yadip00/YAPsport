import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, setActivePanel } = useStore();
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      const success = loginAdmin(email, password);
      setIsLoading(false);
      
      if (!success) {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    }, 800);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12" id="admin-login-viewport">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full space-y-8 bg-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header Block */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-red-950/40 text-red-500 border border-red-900/50 rounded-2xl">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight">Portal Admin</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Masuk untuk mengelola produk dan transaksi webstore Anda.
            </p>
          </div>
        </div>

        {/* Informational Credentials Box */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4.5 space-y-2">
          <span className="text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Kredensial Login Kasir</span>
          </span>
          <div className="space-y-1 text-xs text-zinc-400 font-medium">
            <div className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-zinc-500">Username:</span>
              <span className="font-mono text-zinc-200 select-all font-bold">YAPStore</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-zinc-500">Kata Sandi:</span>
              <span className="font-mono text-red-400 font-extrabold select-all">123456</span>
            </div>
          </div>
        </div>

        {/* Error Alert Panel */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-950/30 border border-red-900/50 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5"
          >
            <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email/Username input field */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Username atau Email</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-zinc-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="YAPStore atau email@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                className="w-full bg-zinc-950 text-zinc-100 placeholder-zinc-600 pl-11 pr-4 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-black uppercase tracking-wider block">Kata Sandi</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                className="w-full bg-zinc-950 text-zinc-100 placeholder-zinc-600 pl-11 pr-4 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-sm transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Portal Admin</span>
            )}
          </button>
        </form>

        {/* Back to Webstore options */}
        <div className="pt-2 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={() => setActivePanel('store')}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Webstore</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
