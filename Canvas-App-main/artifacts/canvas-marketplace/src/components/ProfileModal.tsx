import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, CheckCircle2, ArrowLeft, MapPin, X, ArrowUpRight, MessageCircle } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

// specific aesthetic names requested in the design brief
const LOOK_NAMES = [
  "Intense Smokey Eye Bold Glam",
  "Silver Cut-Crease Reception Glam",
  "Soft Glam Engagement Look",
  "Christian Bridal with Smoky Elegance",
  "Nizami Royal Festive Bridal",
  "Classic Canvas Aesthetic"
];

export type ProfileModalProps = {
  open: boolean;
  artist: any | null; 
  onClose: () => void;
  onBookAppointment: () => void;
};

export function ProfileModal({ open, artist, onClose, onBookAppointment }: ProfileModalProps) {
  const displayed = useRef(artist);
  if (open && artist) displayed.current = artist;
  const data = open ? artist : displayed.current;

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setExpandedImage(null); return; }
    const timer = setTimeout(() => { document.body.style.overflow = 'hidden'; }, 10);
    return () => { clearTimeout(timer); document.body.style.overflow = 'auto'; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, expandedImage]);

  if (!data) return null;

  const portfolioImages: string[] = (() => {
    const raw = data.portfolio || [];
    if (raw.length === 0) return [data.image]; // Fallback to profile image if empty
    return raw
      .map((p: any) => (typeof p === 'string' ? p : p?.image))
      .filter(Boolean);
  })();

  // Universal Fallback Logic
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.dataset.hasFailed) return;
    e.currentTarget.dataset.hasFailed = 'true';
    const safeId = String(Math.floor(Math.random() * 5) + 1).padStart(3, '0');
    e.currentTarget.src = `/canvas-artists/artist_${safeId}/portfolio-0.jpg`;
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[200] flex justify-center items-center bg-[var(--bg-dark)]/80 backdrop-blur-sm p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            onClick={onClose}
          >
            <style>{`
              .hide-scroll::-webkit-scrollbar { display: none; }
              .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 15 }}
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-[1100px] h-[95vh] md:h-[85vh] flex flex-col bg-[var(--bg-cream)] rounded-2xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* DARK PURPLE HERO SECTION */}
              <div className="bg-[var(--bg-dark)] p-8 md:p-12 shrink-0 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-light)] hover:text-white transition-colors z-10">
                  <X size={28} strokeWidth={1.5} />
                </button>
                
                <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start text-center md:text-left relative z-0">
                  
                  {/* Circular Profile Photo */}
                  <img 
                    src={data.image} 
                    alt={data.name} 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[3px] border-[var(--gold)] shrink-0 shadow-[0_0_30px_rgba(196,163,90,0.2)]" 
                    onError={handleImageError} 
                  />
                  
                  <div className="flex-1 w-full">
                    {/* Name + Verified Badge */}
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
                      <h1 className="font-serif text-4xl md:text-5xl text-white tracking-wide">{data.name}</h1>
                      <span className="bg-[var(--gold)] text-[var(--bg-dark)] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0 mt-2 md:mt-0">
                        <CheckCircle2 size={12} strokeWidth={3} /> Verified
                      </span>
                    </div>
                    
                    {/* Location Pin & Experience */}
                    <p className="text-[var(--text-light)] text-sm mb-5 font-sans flex items-center justify-center md:justify-start gap-2">
                      <MapPin size={16} className="text-[var(--gold)]" /> {data.location || data.city} • {data.experience_years || 8} yrs experience
                    </p>
                    
                    {/* Tags in Rounded Pills */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                      {(data.tags || ["Bridal Glam", "Editorial", "Skin Work"]).map((tag: string) => (
                        <span key={tag} className="tag border-white/20 text-white/90 bg-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Rating & Price */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 border-t border-white/10 pt-6">
                      <div className="text-[var(--gold)] font-medium text-lg flex items-center justify-center gap-2">
                        <Star size={18} fill="currentColor" /> {data.rating || '4.9'} 
                        <span className="text-white/50 text-sm font-normal">({data.reviewsCount || 214} reviews)</span>
                      </div>
                      <div className="hidden md:block w-px h-6 bg-white/20"></div>
                      <div className="text-white font-medium text-lg">
                        {data.startingPrice || '₹35,000'} <span className="text-sm text-white/50 font-normal">Premium Package</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp CTA */}
                  <div className="shrink-0 flex items-center w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={onBookAppointment} 
                      className="w-full md:w-auto bg-[var(--gold)] text-[var(--bg-dark)] hover:bg-[#B08D45] transition-colors px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg"
                    >
                      <MessageCircle size={16} /> Send enquiry on WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* LIGHT CREAM BODY SECTION */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 hide-scroll bg-[var(--bg-cream)]">
                
                {/* Quote in Italic Serif */}
                <div className="max-w-4xl mx-auto text-center mb-16 px-4">
                  <p className="font-serif italic text-2xl md:text-[28px] text-[var(--text-primary)] leading-relaxed">
                    "{data.bio || data.signature || `Specializing in HD Airbrush technique and traditional bridal aesthetics, every look is crafted to photograph beautifully under intense wedding lights and feel like the best version of the bride herself.`}"
                  </p>
                </div>

                <div className="mb-10 text-center md:text-left">
                  <h2 className="font-serif text-3xl md:text-4xl text-[var(--text-primary)] mb-3">Verified Portfolio</h2>
                  <p className="text-[var(--text-secondary)] text-[15px]">Real client work showcasing {data.name}'s signature aesthetic and technical execution.</p>
                </div>

                {/* Verified Portfolio Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 pb-12">
                  {portfolioImages.map((img: string, i: number) => (
                    <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] group flex flex-col">
                      <div className="cursor-pointer overflow-hidden relative shrink-0" onClick={() => setExpandedImage(img)}>
                        <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" onError={handleImageError} />
                        <div className="absolute inset-0 bg-[var(--bg-dark)]/0 group-hover:bg-[var(--bg-dark)]/10 transition-colors"></div>
                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-[var(--bg-dark)]/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white">
                            Expand
                          </span>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 flex flex-col flex-1 text-center bg-[var(--bg-card)]">
                        <div className="inline-block self-center bg-[var(--bg-beige)] text-[var(--text-secondary)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                          Portfolio Image {i + 1}
                        </div>
                        <h3 className="font-serif text-xl text-[var(--text-primary)] leading-tight mb-2">
                          {data.name} - {LOOK_NAMES[i % LOOK_NAMES.length]}
                        </h3>
                        <p className="text-[13px] text-[var(--text-secondary)] mb-6 flex-1">A verified example of the aesthetic.</p>
                        <button 
                          onClick={onBookAppointment} 
                          className="w-full bg-[var(--bg-beige)] hover:bg-[var(--gold)] hover:text-[var(--bg-dark)] text-[var(--text-primary)] transition-colors py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em]"
                        >
                          Enquire about this look
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpandedImage(null)}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--bg-dark)]/95 p-4 md:p-12 backdrop-blur-xl"
            role="dialog"
            aria-label="Expanded view"
          >
            <button 
              className="absolute right-6 top-6 md:right-12 md:top-12 text-[var(--text-light)] transition-colors hover:text-[var(--gold)] bg-black/20 p-2 rounded-full"
              onClick={() => setExpandedImage(null)}
            >
              <X size={32} strokeWidth={1.5} />
            </button>
            
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              src={expandedImage}
              alt="Expanded portfolio"
              className="max-h-[90vh] max-w-full object-contain border border-white/10 shadow-2xl rounded-lg"
              onClick={(e) => e.stopPropagation()} 
              onError={handleImageError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProfileModal;