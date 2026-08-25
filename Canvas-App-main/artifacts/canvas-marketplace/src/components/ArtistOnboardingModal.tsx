import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ArtistOnboardingProps = {
  open: boolean;
  userId: string;
  onComplete: () => void;
};

const CATEGORIES = [
  'Bridal & Wedding',
  'Party & Event Glam',
  'Natural & Soft Aesthetics',
  'Editorial & High Fashion',
  'Specialized Skin & Grooming'
];

export function ArtistOnboardingModal({ open, userId, onComplete }: ArtistOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    category: 'Bridal & Wedding',
    city: 'Jubilee Hills, Hyderabad',
    max_travel_km: 30,
    starting_price: 15000,
  });
  
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFile) {
      window.alert("Please upload at least one compulsory portfolio showcase image to continue.");
      return;
    }
  
    setLoading(true);
  
    try {
      const fileExt = portfolioFile.name.split('.').pop();
      const filePath = `${userId}/portfolio-${Date.now()}.${fileExt}`;
  
      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, portfolioFile, { upsert: true });
  
      if (uploadError) throw uploadError;
  
      const { data: publicUrlData } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath);
  
      const { error } = await supabase
        .from('artist_profiles')
        .upsert({
          id: userId,
          business_name: formData.business_name,
          category: formData.category,
          city: formData.city,
          max_travel_km: formData.max_travel_km,
          starting_price: formData.starting_price,
          portfolio: [publicUrlData.publicUrl],
        });
  
      if (error) throw error;
  
      window.alert("Studio profile successfully verified and published to Canvas directory!");
      onComplete();
    } catch (err: any) {
      window.alert(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-[#150A26] border border-white/20 rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center gap-3 text-[#B66CF2] mb-2">
          <Sparkles size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Canvas Artist Induction</span>
        </div>
        
        <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          Configure Your Studio
        </h2>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-8">
          Step {step} of 2 · Vetting and Logistics Setup
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                  Studio / Business Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaushal Makeover Studio"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#B66CF2]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                  Primary Specialization Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#B66CF2] [&>option]:bg-[#150A26]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                    Base City / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#B66CF2]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                    Starting Fee (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#B66CF2]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-white text-black py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#B66CF2] hover:text-white transition-all mt-4"
              >
                Next: Portfolio & Logistics &rarr;
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                  Max Travel Radius ({formData.max_travel_km} km)
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.max_travel_km}
                  onChange={(e) => setFormData({ ...formData, max_travel_km: Number(e.target.value) })}
                  className="w-full accent-[#B66CF2] cursor-pointer"
                />
              </div>

              {/* Compulsory Portfolio Upload */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                  Compulsory Portfolio Showcase Image *
                </label>
                <label className="flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl p-6 bg-black/20 hover:border-[#B66CF2] cursor-pointer transition-colors">
                  <Upload size={24} className="text-[#B66CF2] mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {portfolioFile ? portfolioFile.name : 'Click to upload master look image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => e.target.files && setPortfolioFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white/10 text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-all"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-white text-black py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#B66CF2] hover:text-white transition-all disabled:opacity-50"
                >
                  {loading ? 'Publishing Studio...' : 'Complete & Launch Studio'}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}