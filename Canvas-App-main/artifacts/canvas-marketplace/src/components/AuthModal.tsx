import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`.trim(),
            }
          }
        });
        if (error) throw error;
        window.alert('Account created! You can now log in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error: any) {
      window.alert(error.message);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          // THE FIX: Added max-h-[90vh], overflow-y-auto, and tightened padding (p-8 instead of p-12/16)
          className="relative w-full max-w-md bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button: Repositioned slightly so it stays visible */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-black/40 hover:text-black transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          <div className="mb-8">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[#B66CF2]">
              {isLogin ? 'Welcome Back' : 'Join the Collective'}
            </p>
            <h2 className="text-3xl font-bold lowercase tracking-tight text-black">
              {isLogin ? 'log in.' : 'create account.'}
            </h2>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-3 border border-black/10 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-black transition-colors hover:bg-black/5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-black/10"></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-black/30">Or</span>
            <div className="h-[1px] flex-1 bg-black/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-black/50">First Name</span>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full border-b border-black/20 bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none transition-colors focus:border-black"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-black/50">Last Name</span>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full border-b border-black/20 bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none transition-colors focus:border-black"
                  />
                </label>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-black/50">Email Address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border-b border-black/20 bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none transition-colors focus:border-black"
              />
            </label>

            <label className="block pb-4">
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-black/50">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-b border-black/20 bg-transparent py-2.5 text-xs font-bold tracking-widest text-black placeholder-black/20 outline-none transition-colors focus:border-black"
              />
            </label>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-black py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#B66CF2] disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="border-b border-black/20 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-black/50 transition-colors hover:border-black hover:text-black"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}