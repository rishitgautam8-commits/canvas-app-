import React, { useRef, useState } from 'react';
import { Search, ChevronDown, Sparkles, X, CheckCircle2, MapPin, Sliders, FileText, UploadCloud } from 'lucide-react';
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
  'Jubilee Hills',
  'Banjara Hills',
  'Hitech City',
  'Gachibowli',
  'Film Nagar',
  'Madhapur',
  'Banjara Hills Road No. 12',
  'Somajiguda',
  'Begumpet',
  'Secunderabad',
  'Kukatpally',
  'Financial District, Gachibowli'
];

const DISCIPLINES = ['Makeup Artist', 'Hair Stylist', 'Nail Artist', 'Bridal Specialist', 'Editorial Look'];
const PRICE_RANGES = ['Any Investment', '₹3,000 – ₹7,000', '₹7,000 – ₹15,000', '₹15,000+ (Luxury)'];

const analysisSteps = [
  "Isolating color palettes & lighting undertones...",
  "Mapping facial geometry & aesthetic drape...",
  "Cross-referencing 100 verified studio portfolios...",
  "Curating optimal matches based on location & style..."
];

export function HeroSearch({ value, onChange, onSubmit, onAuthRequired, isAuthenticated }: HeroSearchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentServices = value?.services || ['Makeup Artist'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  const toggleService = (service: string) => {
    const exists = currentServices.includes(service);
    const updated = exists
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    onChange({ ...value, services: updated.length ? updated : ['Makeup Artist'] });
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
      onChange({ ...value, inspirationFile: file });
      onSubmit({ ...value, inspirationFile: file });
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
    <div className="w-full mx-auto relative z-20">

      {/* Access strip - Ivory Theme Colors */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden sm:flex items-center justify-between px-4 sm:px-0 mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--canvas-mut)]"
      >
        <span>Issue N°04 · Hyderabad, IN</span>
        <span className="flex items-center gap-2 text-[var(--canvas-rp)] font-bold">
          <span className="h-1 w-1 rounded-full bg-[var(--canvas-g)]" />
          Access Verified
        </span>
      </motion.div>

      {/* Header - White Watermark Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--canvas-bd)] pb-6 mb-8 px-4 sm:px-0"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--canvas-mut)] mb-3">
            Private Directory
          </p>
          <h1 className="font-serif italic text-6xl sm:text-7xl md:text-[92px] text-white drop-shadow-sm leading-[0.92] tracking-tight">
            Find your artist.
          </h1>
        </div>
        <p className="hidden md:block text-xs font-bold uppercase tracking-widest text-[var(--canvas-mut)] max-w-[230px] text-right leading-relaxed">
          Every profile is vetted before it's listed. Max 2 bookings per artist daily to preserve absolute quality.
        </p>
      </motion.div>

      {/* Ticket card Dropzone */}
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full mx-4 sm:mx-0 relative transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
      >
        {/* GLOWING DRAG & DROP OVERLAY */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--canvas-dp)]/90 backdrop-blur-md border-2 border-dashed border-[var(--canvas-g)] shadow-[0_0_50px_rgba(201,164,99,0.3)] pointer-events-none">
            <div className="flex flex-col items-center text-white drop-shadow-2xl">
              <UploadCloud size={48} className="text-[var(--canvas-g)] mb-4 animate-bounce" />
              <h3 className="text-2xl font-black uppercase tracking-widest text-white">Drop Inspiration Here</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--canvas-g)] mt-3">Canvas AI Vision will analyze your look</p>
            </div>
          </div>
        )}

        {/* SEARCH BAR BACKGROUND: Deep Plum */}
        <div className="relative shadow-[0_30px_60px_-20px_rgba(21,4,32,0.4)] border border-[var(--canvas-bd)]/50 bg-[var(--canvas-dp)]">
          
          {/* Main Search Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/15">

            {/* 01. Multi-Select Disciplines */}
            <div className="md:col-span-3 relative p-6 border-b md:border-b-0 md:border-r border-white/15 group hover:bg-white/[0.04] transition-colors">
              <span className="absolute top-5 right-5 font-mono text-[9px] text-white/30">SEQ.01</span>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                Disciplines ({currentServices.length})
              </label>
              
              <div className="relative">
                <div 
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="flex items-center justify-between cursor-pointer py-1"
                >
                  <span className="text-sm font-black uppercase tracking-wide text-white truncate max-w-[180px]">
                    {currentServices.join(', ')}
                  </span>
                  <ChevronDown size={16} className="text-[var(--canvas-g)]" />
                </div>

                {showServiceDropdown && (
                  <div className="absolute top-full left-0 mt-3 w-64 bg-[var(--canvas-dp)] border border-[var(--canvas-bd)]/30 p-3 shadow-2xl z-50 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Select Services:</p>
                    {DISCIPLINES.map(disc => {
                      const selected = currentServices.includes(disc);
                      return (
                        <div
                          key={disc}
                          onClick={() => toggleService(disc)}
                          className={`flex items-center justify-between p-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            selected ? 'bg-[var(--canvas-g)] text-[var(--canvas-dp)]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{disc}</span>
                          {selected && <CheckCircle2 size={14} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 02. Smart Hyderabad Location Autocomplete */}
            <div className="md:col-span-3 relative p-6 border-b md:border-b-0 md:border-r border-white/15 group hover:bg-white/[0.04] transition-colors">
              <span className="absolute top-5 right-5 font-mono text-[9px] text-white/30">SEQ.02</span>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                Location (Hyd)
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[var(--canvas-g)] shrink-0" />
                  <input
                    type="text"
                    value={value?.location || ''}
                    onChange={(e) => {
                      onChange({ ...value, location: e.target.value });
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="E.G. COVIE, JUBILEE..."
                    className="w-full bg-transparent text-sm font-black uppercase tracking-wide text-white outline-none placeholder-white/30"
                  />
                </div>

                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 mt-3 w-full bg-[var(--canvas-dp)] border border-[var(--canvas-bd)]/30 shadow-2xl z-50 max-h-48 overflow-y-auto">
                    {filteredLocations.map(loc => (
                      <div
                        key={loc}
                        onClick={() => {
                          onChange({ ...value, location: loc });
                          setShowLocationDropdown(false);
                        }}
                        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-[var(--canvas-g)] hover:text-[var(--canvas-dp)] cursor-pointer transition-colors border-b border-white/5 last:border-none"
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 03. Strict 2-Slot Daily Timings */}
            <div className="md:col-span-2 relative p-6 border-b md:border-b-0 md:border-r border-white/15 group hover:bg-white/[0.04] transition-colors">
              <span className="absolute top-5 right-5 font-mono text-[9px] text-white/30">SEQ.03</span>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                Daily Slot (Max 2)
              </label>
              <select
                value={value?.timeSlot || 'Morning (08:00 - 13:00)'}
                onChange={(e) => onChange({ ...value, timeSlot: e.target.value as any })}
                className="w-full bg-transparent text-xs font-black uppercase tracking-wide text-white outline-none appearance-none cursor-pointer"
              >
                <option value="Morning (08:00 - 13:00)" className="bg-[var(--canvas-dp)]">Slot I: Morning</option>
                <option value="Evening (15:00 - 20:00)" className="bg-[var(--canvas-dp)]">Slot II: Evening</option>
              </select>
            </div>

            {/* 04. Price Range */}
            <div className="md:col-span-2 relative p-6 border-b md:border-b-0 md:border-r border-white/15 group hover:bg-white/[0.04] transition-colors">
              <span className="absolute top-5 right-5 font-mono text-[9px] text-white/30">SEQ.04</span>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                Investment Tier
              </label>
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-[var(--canvas-g)] shrink-0" />
                <select
                  value={value?.priceRange || 'Any Investment'}
                  onChange={(e) => onChange({ ...value, priceRange: e.target.value })}
                  className="w-full bg-transparent text-xs font-black uppercase tracking-wide text-white outline-none appearance-none cursor-pointer"
                >
                  {PRICE_RANGES.map(tier => (
                    <option key={tier} value={tier} className="bg-[var(--canvas-dp)]">{tier}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 05. Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="h-full w-full min-h-[90px] md:min-h-[110px] bg-white text-[var(--canvas-dp)] flex flex-row items-center justify-center gap-2 whitespace-nowrap hover:bg-[var(--canvas-g)] hover:text-[var(--canvas-dp)] transition-all duration-300 group"
              >
                <Search size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Explore</span>
              </button>
            </div>

          </div>

          {/* SEQ.05: Description / Inspiration Look Matcher */}
          <div className="bg-black/20 p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Text Area for Look Description */}
              <div className="relative flex-1 w-full">
                <div className="absolute left-3 top-3 text-[var(--canvas-g)]">
                  <FileText size={16} />
                </div>
                <input
                  type="text"
                  value={value?.lookDescription || ''}
                  onChange={(e) => onChange({ ...value, lookDescription: e.target.value })}
                  placeholder="SEQ.05 · Describe your look or occasion if you don't have a reference photo..."
                  className="w-full bg-white/[0.03] border border-white/15 pl-10 pr-4 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-white placeholder-white/40 outline-none focus:border-[var(--canvas-g)] transition-colors"
                />
              </div>

              {/* Inspiration Upload Button */}
              <div className="w-full md:w-auto shrink-0">
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

                {value?.inspirationFile ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--canvas-g)]/15 border border-[var(--canvas-g)]/40 gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white truncate max-w-[200px]">
                      {value.inspirationFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ ...value, inspirationFile: null })}
                      className="text-white/50 hover:text-white text-[9px] uppercase tracking-widest"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        onAuthRequired?.();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 border text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                      !isAuthenticated 
                        ? 'border-white/20 hover:border-[var(--canvas-g)] text-white/70 hover:text-white bg-transparent' 
                        : 'border-dashed border-white/30 hover:border-[var(--canvas-g)] bg-white/[0.02] hover:bg-[var(--canvas-g)]/10 text-white/90 hover:text-white'
                    }`}
                  >
                    <Sparkles size={14} className={isAuthenticated ? "text-[var(--canvas-g)]" : "text-white/70"} />
                    <span>
                      {isAuthenticated ? 'Upload / Drag Photo Match' : 'Sign in to Match Photo'}
                    </span>
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>
      </motion.form>

      {/* FULL-SCREEN CINEMATIC AI SCANNING CURTAIN */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[var(--canvas-iv)]/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-md w-full bg-white border border-[var(--canvas-bd)] rounded-2xl p-8 text-center shadow-[0_20px_50px_rgba(21,4,32,0.1)] overflow-hidden"
            >
              {/* Laser scanning line effect */}
              <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--canvas-g)] to-transparent shadow-[0_0_20px_var(--canvas-g)] z-20"
              />

              {/* Uploaded Image Preview Box */}
              {previewUrl && (
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-xl overflow-hidden border border-[var(--canvas-bd)] shadow-inner">
                  <img src={previewUrl} alt="Inspiration Preview" className="w-full h-full object-cover filter brightness-95" />
                  <div className="absolute inset-0 bg-[var(--canvas-g)]/20 mix-blend-overlay" />
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[var(--canvas-g)] mb-3">
                <Sparkles size={20} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--canvas-dp)]">Canvas AI Vision</span>
              </div>

              <h3 className="text-xl font-black uppercase tracking-tight text-[var(--canvas-dp)] mb-6">
                Analyzing Aesthetic Match
              </h3>

              {/* Cycling Status Text */}
              <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs font-bold uppercase tracking-widest text-[var(--canvas-mut)]"
                  >
                    {analysisSteps[currentStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[var(--canvas-bd)] h-1 rounded-full mt-6 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                  className="bg-[var(--canvas-g)] h-full"
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