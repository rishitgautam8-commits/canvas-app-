import React, { useRef, useState } from 'react';
import { Search, ArrowRight, Sparkles, Upload, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeroSearchValue {
  services: string[];
  location: string;
  date: string;
  timeSlot: 'Morning (08:00 - 13:00)' | 'Evening (15:00 - 20:00)';
  priceRange: string;
  lookDescription: string;
  inspirationFile?: File | null;
}

interface HeroSearchProps {
  value: HeroSearchValue;
  onChange: (val: HeroSearchValue) => void;
  onSubmit: (val: HeroSearchValue) => void;
  onAuthRequired?: () => void;
  isAuthenticated?: boolean;
}

const HYDERABAD_LOCATIONS = [
  'Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Gachibowli',
  'Film Nagar', 'Madhapur', 'Kondapur', 'Somajiguda',
  'Begumpet', 'Secunderabad', 'Kukatpally', 'Financial District',
  'Manikonda', 'KBR Park', 'Shamshabad'
];

const analysisSteps = [
  "Isolating color palettes & lighting undertones...",
  "Mapping facial geometry & aesthetic drape...",
  "Cross-referencing 100 verified studio portfolios...",
  "Curating optimal matches based on style & location..."
];

const OCCASIONS = ['Wedding', 'Shoot', 'Party', 'Editorial', 'Everyday'];
const SUGGESTION_PILLS = ['Pinterest board', 'Instagram screenshot', 'Mood board', 'Magazine cutout'];

export function HeroSearch({ value, onChange, onSubmit, onAuthRequired, isAuthenticated }: HeroSearchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeOccasion, setActiveOccasion] = useState('Wedding');
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchContext = {
      ...value,
      lookDescription: `${value.lookDescription || ''} ${activeOccasion}`.trim()
    };
    onSubmit(searchContext);
  };

  const filteredLocations = HYDERABAD_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes((value?.location || '').toLowerCase())
  );

  const handleFileSelected = (file: File) => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 600);

    setTimeout(() => {
      setIsAnalyzing(false);
      const searchContext = { ...value, inspirationFile: file, lookDescription: activeOccasion };
      onChange(searchContext);
      onSubmit(searchContext);
    }, 2600);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(file);
    } else {
      window.alert("Please drop a valid image file.");
    }
  };

  return (
    <div className="w-full max-w-[960px] mx-auto relative z-20 font-sans">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/40 backdrop-blur-md rounded-[32px] p-8 md:p-14 shadow-[0_20px_50px_-12px_rgba(21,4,32,0.04)] border border-white/50 relative overflow-visible"
      >
        <form onSubmit={handleSubmit}>
          
          {/* Top Search Bar Row (Now Split into Look & Location) */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 relative">
            
            {/* 1. Look Description */}
            <div className="flex-[2] flex items-center bg-white/50 backdrop-blur-sm border border-white/60 rounded-[20px] px-6 py-4 shadow-[0_2px_8px_rgba(21,4,32,0.02)] focus-within:border-[#BA965B] focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-[#BA965B]/10 transition-all duration-300">
              <Search size={22} className="text-[#5C3D6E] mr-4 opacity-50 shrink-0" />
              <input
                type="text"
                value={value?.lookDescription || ''}
                onChange={(e) => onChange({ ...value, lookDescription: e.target.value })}
                placeholder="nizami bridal..."
                className="w-full bg-transparent outline-none text-[#150420] text-[16px] font-medium placeholder:text-[#150420]/40"
              />
            </div>

            {/* 2. Hyderabad Location Dropdown */}
            <div className="flex-[1.5] relative flex items-center bg-white/50 backdrop-blur-sm border border-white/60 rounded-[20px] px-6 py-4 shadow-[0_2px_8px_rgba(21,4,32,0.02)] focus-within:border-[#BA965B] focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-[#BA965B]/10 transition-all duration-300">
              <MapPin size={22} className="text-[#BA965B] mr-4 opacity-80 shrink-0" />
              <input
                type="text"
                value={value?.location || ''}
                onChange={(e) => {
                  onChange({ ...value, location: e.target.value });
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Anywhere in Hyd"
                className="w-full bg-transparent outline-none text-[#150420] text-[16px] font-medium placeholder:text-[#150420]/40"
              />
              
              {/* Elegant Dropdown Menu */}
              {showLocationDropdown && filteredLocations.length > 0 && (
                <div className="absolute top-[110%] left-0 w-full bg-white/80 backdrop-blur-lg border border-white/50 rounded-[16px] shadow-[0_10px_40px_rgba(21,4,32,0.06)] z-50 max-h-56 overflow-y-auto py-2">
                  {filteredLocations.map(loc => (
                    <div
                      key={loc}
                      onClick={() => {
                        onChange({ ...value, location: loc });
                        setShowLocationDropdown(false);
                      }}
                      className="px-6 py-3 text-[14px] font-medium text-[#5C3D6E] hover:bg-white/60 hover:text-[#150420] cursor-pointer transition-colors"
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 3. Submit Button */}
            <button
              type="submit"
              onClick={() => setShowLocationDropdown(false)}
              className="bg-[#BA965B] hover:bg-[#A67E3D] text-[#150420] px-8 py-4 rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_6px_20px_rgba(186,150,91,0.25)] hover:shadow-[0_8px_25px_rgba(186,150,91,0.35)] shrink-0 active:scale-[0.98]"
            >
              Find Artist <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Elegant Divider */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#5C3D6E] opacity-60">
              Or Upload Inspiration
            </span>
          </div>

          {/* Large Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isAuthenticated) {
                onAuthRequired?.();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`relative border-[1.5px] border-dashed rounded-[32px] p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-400 ease-out ${
              isDragging 
                ? 'bg-white/60 scale-[1.02] border-[#BA965B] shadow-[0_0_30px_rgba(186,150,91,0.15)]' 
                : 'bg-white/20 border-white/60 hover:border-[#BA965B] hover:bg-white/40'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-sm text-[#BA965B] flex items-center justify-center mb-6 border border-white/80 shadow-sm">
              <Upload size={24} strokeWidth={1.5} />
            </div>

            <h3 className="font-serif text-[28px] md:text-[32px] leading-tight text-[#150420] mb-4">
              Upload a Pinterest screenshot or Instagram save
            </h3>
            <p className="text-[13px] text-[#5C3D6E] opacity-80 tracking-wide mb-10 font-medium">
              JPG, PNG, WEBP · Max 10MB · Or drag & drop
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {SUGGESTION_PILLS.map((pill) => (
                <span key={pill} className="bg-white/40 border border-white/60 text-[#7C5916] px-5 py-2.5 rounded-full text-[12px] font-medium tracking-wide shadow-sm">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Occasion Row */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-start gap-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#5C3D6E] opacity-80">
              Occasion:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion}
                  type="button"
                  onClick={() => setActiveOccasion(occasion)}
                  className={`px-7 py-3 rounded-full text-[14px] font-medium tracking-wide transition-all duration-300 border ${
                    activeOccasion === occasion
                      ? 'bg-[#BA965B] text-[#150420] border-[#BA965B] shadow-md scale-105'
                      : 'bg-white/30 text-[#33103E] border-white/50 hover:border-[#BA965B] hover:bg-white/50'
                  }`}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

        </form>
      </motion.div>

      {/* FULL-SCREEN CINEMATIC AI SCANNING CURTAIN */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FDF3F1]/80 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-md w-full bg-white/60 backdrop-blur-md border border-white/50 rounded-[32px] p-10 text-center shadow-[0_30px_60px_rgba(21,4,32,0.06)] overflow-hidden"
            >
              <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#BA965B] to-transparent shadow-[0_0_20px_rgba(186,150,91,0.6)] z-20"
              />

              {previewUrl && (
                <div className="relative w-36 h-36 mx-auto mb-8 rounded-[20px] overflow-hidden border-2 border-white/60 shadow-inner">
                  <img src={previewUrl} alt="Inspiration Preview" className="w-full h-full object-cover filter brightness-95" />
                  <div className="absolute inset-0 bg-[#BA965B]/10 mix-blend-overlay" />
                </div>
              )}

              <div className="flex items-center justify-center gap-2.5 text-[#BA965B] mb-4">
                <Sparkles size={22} className="animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#150420]">Canvas AI Vision</span>
              </div>

              <h3 className="text-2xl font-serif text-[#150420] mb-8 leading-tight">
                Analyzing Aesthetic Match...
              </h3>

              <div className="h-8 flex items-center justify-center mb-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5C3D6E]"
                  >
                    {analysisSteps[currentStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="w-full bg-white/50 h-1.5 rounded-full mt-6 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                  className="bg-[#BA965B] h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroSearch;