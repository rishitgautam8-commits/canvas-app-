import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';

export type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'artist'>('client');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setIsLogin(true);
      setRole('client');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
        
        // Fetch role and route accordingly
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role === 'artist') {
            setLocation('/dashboard');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: role,
            }
          }
        });
        
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: `${firstName} ${lastName}`.trim(),
            email: email,
            role: role
          }, { onConflict: 'email' });
          
          if (profileError) throw profileError;
        }
        
        onClose();

        // Instantly redirect artists straight to their dashboard setup
        if (role === 'artist') {
          setLocation('/dashboard');
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--bg-dark)]/80 backdrop-blur-sm p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <style>{`
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>

          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[var(--bg-cream)] w-full max-w-[460px] rounded-2xl p-8 md:p-10 relative shadow-2xl flex flex-col hide-scroll overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-50 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={24} strokeWidth={1.5} />
            </button>

            <h2 className="font-serif text-3xl font-medium text-[var(--text-primary)] mb-2 text-center">
              {isLogin ? 'Welcome back' : 'Join Canvas'}
            </h2>
            <p className="text-center text-sm text-[var(--text-secondary)] mb-8 font-sans">
              {isLogin ? 'Log in to your Canvas account' : 'Are you a client or a makeup artist?'}
            </p>

            {message && (
              <div className={`mb-6 flex items-start gap-3 rounded-lg p-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {message.type === 'success' && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                <p>{message.text}</p>
              </div>
            )}

            {!isLogin && (
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex-1 py-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                    role === 'client'
                      ? 'border-[var(--gold)] bg-white shadow-sm'
                      : 'border-[var(--border-light)] bg-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-2xl">💄</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`flex-1 py-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                    role === 'artist'
                      ? 'border-[var(--gold)] bg-white shadow-sm'
                      : 'border-[var(--border-light)] bg-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-2xl">🎨</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Artist</span>
                </button>
              </div>
            )}

            <button
              onClick={handleGoogle}
              className="w-full bg-white border border-[var(--border-light)] py-3.5 rounded-lg flex items-center justify-center gap-3 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--gold)] transition-colors shadow-sm mb-6"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              {isLogin ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-[1px] bg-[var(--border-light)]"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">OR</span>
              <div className="flex-1 h-[1px] bg-[var(--border-light)]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      className="w-full bg-white border border-[var(--border-light)] px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last"
                      className="w-full bg-white border border-[var(--border-light)] px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white border border-[var(--border-light)] px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "••••••••" : "Create a password"}
                  className="w-full bg-white border border-[var(--border-light)] px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--gold)] text-[var(--text-primary)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--bg-dark)] text-[var(--text-white)] py-4 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] mt-4 hover:bg-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Log in with Email' : 'Create with Email'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                }}
                className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up!" : "Already have an account? Log in!"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}