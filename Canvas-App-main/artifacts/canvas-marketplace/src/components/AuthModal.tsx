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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8"
          role="dialog"
          aria-modal="true"
        >
          <style>{`
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            .cloud-input {
              background-color: white;
              border: 1px solid transparent;
              box-shadow: 0 2px 10px rgba(0,0,0,0.03);
              transition: all 0.2s ease;
            }
            .cloud-input:focus {
              border-color: #E5E5E5;
              box-shadow: 0 4px 14px rgba(0,0,0,0.06);
              outline: none;
            }
          `}</style>

          <button 
            onClick={onClose}
            className="absolute right-4 top-4 z-50 p-2 text-white/70 hover:text-white md:right-8 md:top-8 transition-colors"
          >
            <X size={32} strokeWidth={1.5} />
          </button>

          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full max-w-[1000px] h-auto min-h-[550px] md:h-[600px] flex-col md:flex-row overflow-hidden rounded-2xl bg-[#F6F5F2] shadow-2xl"
          >
            <div className="relative hidden w-1/2 md:block bg-[#EBE9E4]">
              <img 
                src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80" 
                alt="Makeup Artist Application" 
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 pr-10">
                <h2 className="text-3xl font-medium text-white tracking-wide">
                  The standard <br />in beauty.
                </h2>
              </div>
            </div>

            <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-8 sm:p-12 relative overflow-y-auto hide-scroll">
              <div className="w-full max-w-[340px]">
                <h3 className="text-[2rem] font-medium text-center text-stone-800 mb-8 tracking-tight">
                  {isLogin ? 'Login' : 'Create Account'}
                </h3>

                {message && (
                  <div className={`mb-6 flex items-start gap-3 rounded-lg p-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-stone-200/50 text-stone-800'}`}>
                    {message.type === 'success' && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                    <p>{message.text}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="flex h-[46px] w-full rounded-lg bg-[#EBE9E4] p-1 mb-2">
                        <button
                          type="button"
                          onClick={() => setRole('client')}
                          className={`w-1/2 rounded-md text-sm font-medium transition-all ${role === 'client' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                          Client
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('artist')}
                          className={`w-1/2 rounded-md text-sm font-medium transition-all ${role === 'artist' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                          Artist
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="cloud-input h-12 w-full rounded-md px-4 text-sm text-stone-800 placeholder-stone-400"
                        />
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="cloud-input h-12 w-full rounded-md px-4 text-sm text-stone-800 placeholder-stone-400"
                        />
                      </div>
                    </>
                  )}

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="cloud-input h-12 w-full rounded-md px-4 text-sm text-stone-800 placeholder-stone-400"
                  />

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="cloud-input h-12 w-full rounded-md px-4 text-sm text-stone-800 placeholder-stone-400"
                  />

                  <div className="pt-4 flex justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-full bg-stone-800 px-12 py-3.5 text-sm font-medium text-white transition-all hover:bg-stone-700 disabled:opacity-50 w-full"
                    >
                      {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                    </button>
                  </div>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3 text-sm text-stone-500">
                  {isLogin && (
                    <button type="button" className="underline underline-offset-4 hover:text-stone-800 transition-colors">
                      Forgot your password?
                    </button>
                  )}
                  <p>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setMessage(null);
                      }}
                      className="text-stone-800 underline underline-offset-4 hover:text-stone-600 transition-colors"
                    >
                      {isLogin ? "Sign up!" : "Sign in!"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}