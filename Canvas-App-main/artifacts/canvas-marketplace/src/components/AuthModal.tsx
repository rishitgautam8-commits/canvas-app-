import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up now only grabs the essentials: Name & Email
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;
        window.alert('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[420px] bg-[#F9F9F9] border border-black/10 shadow-2xl p-10 sm:p-12 my-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-black/40 hover:text-black transition-colors"
            >
              <X size={24} strokeWidth={1.5} />
            </button>

            <div className="mb-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B66CF2] mb-3">
                {isSignUp ? 'JOIN THE COLLECTIVE' : 'ACCESS CANVAS'}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold lowercase tracking-tight text-black">
                {isSignUp ? 'create account.' : 'welcome back.'}
              </h2>
            </div>

            {error && (
              <div className="mb-6 border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold uppercase tracking-widest text-red-600">
                {error}
              </div>
            )}

            <button 
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-4 border border-black/20 bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-black hover:bg-black/5 hover:border-black transition-all mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-black/10"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30">OR</span>
              <div className="h-px flex-1 bg-black/10"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              
              {isSignUp && (
                <div className="grid grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">First Name</span>
                    <input 
                      type="text" 
                      required={isSignUp}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane" 
                      className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none focus:border-[#B66CF2] transition-colors" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Last Name</span>
                    <input 
                      type="text" 
                      required={isSignUp}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe" 
                      className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none focus:border-[#B66CF2] transition-colors" 
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Email Address</span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none focus:border-[#B66CF2] transition-colors" 
                />
              </label>
              
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Password</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-black placeholder-black/20 outline-none focus:border-[#B66CF2] transition-colors" 
                />
              </label>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-transparent hover:text-black transition-all disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'LOG IN WITH EMAIL')}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors border-b border-black/20 pb-0.5 hover:border-black"
              >
                {isSignUp ? 'ALREADY HAVE AN ACCOUNT? LOG IN' : 'NEED AN ACCOUNT? SIGN UP'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}