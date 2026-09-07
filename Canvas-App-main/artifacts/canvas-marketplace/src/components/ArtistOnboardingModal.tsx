import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Premium } from '@/components/Premium';

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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Montserrat']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white border border-black/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center gap-2 text-[#B66CF2] mb-2">
          <Sparkles size={18} />
          <span className="text-[10px] font-bold uppercase tracking-[0.35em]">Canvas Artist Induction</span>
        </div>
        
        <h2 className="font-extrabold text-3xl text-black tracking-tight mb-2">
          Configure Your <Premium>Studio.</Premium>
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-8">
          Step {step} of 2 · Vetting and Logistics Setup
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                  Studio / Business Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaushal Makeover Studio"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full text-sm text-black placeholder:text-black/30 border-b border-black/15 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                  Primary Specialization Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm text-black border-b border-black/15 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B] cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                    Base City / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-sm text-black border-b border-black/15 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                    Starting Fee (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: Number(e.target.value) })}
                    className="w-full text-sm text-black border-b border-black/15 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B] tabular-nums"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#BA965B] hover:text-black transition-colors mt-4"
              >
                Next: Portfolio & Logistics &rarr;
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                  Max Travel Radius ({formData.max_travel_km} km)
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.max_travel_km}
                  onChange={(e) => setFormData({ ...formData, max_travel_km: Number(e.target.value) })}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Compulsory Portfolio Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-black/50 mb-2">
                  Compulsory Portfolio Showcase Image *
                </label>
                <label className="flex flex-col items-center justify-center border border-dashed border-black/20 rounded-none p-6 bg-black/5 hover:border-black cursor-pointer transition-colors">
                  <Upload size={24} className="text-black/60 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
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
                  className="w-1/3 bg-black/5 text-black py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black/10 transition-colors"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#BA965B] hover:text-black transition-colors disabled:opacity-50"
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