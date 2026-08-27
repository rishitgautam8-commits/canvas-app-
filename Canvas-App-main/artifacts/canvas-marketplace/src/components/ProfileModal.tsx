import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, CheckCircle2, MapPin, ArrowLeft, MessageCircle, X } from 'lucide-react';

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
    if (raw.length === 0) return [data.image]; 
    return raw.map((p: any) => (typeof p === 'string' ? p : p?.image)).filter(Boolean);
  })();

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
            className="fixed inset-0 z-[200] w-full h-[100dvh] overflow-y-auto bg-[var(--bg-cream)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease }}
            role="dialog"
            aria-modal="true"
          >
            <style>{`
              .hide-scroll::-webkit-scrollbar { display: none; }
              .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* FULL WIDTH DARK HERO SECTION - SCALED DOWN */}
            <div className="bg-[var(--bg-dark)] w-full pt-8 pb-12 px-6 md:px-12 relative border-b border-[var(--gold)]/20">
              <div className="max-w-5xl mx-auto">
                
                {/* Delicate Back Button */}
                <button 
                  onClick={onClose} 
                  className="flex items-center gap-2 text-white/70 hover:text-[var(--gold)] transition-colors mb-8 border border-white/20 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-md w-fit"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-0">
                  
                  {/* Circular Profile Photo - Scaled Down */}
                  <div className="shrink-0">
                    <img 
                      src={data.image} 
                      alt={data.name} 
                      className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border border-[var(--gold)]/50 shadow-xl" 
                      onError={handleImageError} 
                    />
                  </div>
                  
                  <div className="flex-1 w-full pt-2">
                    
                    {/* Name + Verified Badge */}
                    <div className="flex items-center gap-4 mb-3">
                      <h1 className="font-serif text-3xl md:text-4xl text-white tracking-wide">{data.name}</h1>
                      <span className="bg-[var(--gold)] text-[var(--bg-dark)] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={12} strokeWidth={3} /> Verified
                      </span>
                    </div>
                    
                    {/* Location Pin & Experience */}
                    <p className="text-[var(--text-light)] text-[14px] mb-5 font-sans flex items-center gap-2">
                      <MapPin size={14} className="text-[var(--gold)]" /> 
                      {data.location || data.city} 
                      <span className="mx-2 text-white/20">•</span> 
                      {data.experience_years || 6} yrs experience
                    </p>
                    
                    {/* Tags - Scaled Down */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(data.tags || ["Bridal Glam", "Editorial", "Skin Work"]).map((tag: string) => (
                        <span key={tag} className="px-3 py-1 rounded border border-white/20 text-white/80 text-[10px] font-medium tracking-wider bg-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Rating & Price inline */}
                    <div className="flex items-center gap-3 text-white mb-6">
                      <Star size={16} className="text-[var(--gold)]" fill="currentColor" />
                      <span className="font-medium text-base">{data.rating || '4.8'}</span>
                      <span className="text-white/50 text-xs">({data.reviewsCount || 178} reviews)</span>
                      <span className="mx-3 text-white/20">—</span>
                      <span className="font-serif text-xl tracking-wide">{data.startingPrice || '₹22,000'}</span>
                      <span className="text-white/50 text-xs">Bridal Package</span>
                    </div>

                    {/* Compact WhatsApp Button */}
                    <button 
                      onClick={onBookAppointment} 
                      className="w-full max-w-[280px] bg-[var(--gold)] text-[var(--bg-dark)] hover:bg-[#B08D45] transition-colors py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg"
                    >
                      <MessageCircle size={16} /> Send enquiry on WhatsApp
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* LIGHT CREAM BODY SECTION */}
            <div className="w-full bg-[var(--bg-cream)] px-6 py-12 md:px-12">
              <div className="max-w-5xl mx-auto">
                
                {/* Quote in Italic Serif - Scaled Down */}
                <div className="max-w-3xl mb-16">
                  <p className="font-serif italic text-xl md:text-2xl text-[var(--text-primary)] leading-relaxed">
                    "{data.bio || data.signature || `Brings a cinematic, editorial eye to every face she works on. Based in ${data.city || 'Hyderabad'}, she has created looks for Tollywood celebrities, fashion editorial shoots, and high-profile weddings. Her signature bold-meets-refined aesthetic turns every bride into a headliner.`}"
                  </p>
                </div>

                <div className="mb-8 text-left">
                  <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-2">Verified Portfolio</h2>
                  <p className="text-[var(--text-secondary)] text-[14px]">Real client work showcasing {data.name}'s signature aesthetic and technical execution.</p>
                </div>

                {/* Verified Portfolio Grid - CHANGED TO 3 COLUMNS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {portfolioImages.map((img: string, i: number) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--border-light)] flex flex-col">
                      
                      <div className="cursor-pointer overflow-hidden relative" onClick={() => setExpandedImage(img)}>
                        <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" onError={handleImageError} />
                        <div className="absolute top-3 left-3">
                          <span className="bg-[var(--gold)] text-[var(--bg-dark)] px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-[0.1em]">
                            Look 0{i + 1}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1 bg-[var(--bg-cream)]">
                        <h3 className="font-serif text-lg text-[var(--text-primary)] leading-tight mb-2">
                          {data.name.split(' ')[0]} - {LOOK_NAMES[i % LOOK_NAMES.length]}
                        </h3>
                        <p className="text-[12px] text-[var(--text-secondary)] mb-6 flex-1">A verified example of the aesthetic.</p>
                        <button 
                          onClick={onBookAppointment} 
                          className="w-full bg-[#D1B88A] hover:bg-[var(--gold)] text-[var(--bg-dark)] transition-colors py-2.5 rounded text-[11px] font-bold tracking-[0.1em] uppercase"
                        >
                          Enquire Look
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Image Modal */}
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