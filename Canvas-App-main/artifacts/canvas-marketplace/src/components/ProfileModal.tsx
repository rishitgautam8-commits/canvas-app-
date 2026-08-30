import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, CheckCircle2, MapPin, ArrowLeft, X } from 'lucide-react';
import { useLocation } from 'wouter';

const ease = [0.22, 1, 0.36, 1] as const;

const MAKEUP_NAMES = [
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
  onOpenChat?: () => void; 
};

export function ProfileModal({ open, artist, onClose, onBookAppointment }: ProfileModalProps) {
  const [, setLocation] = useLocation();
  const displayed = useRef(artist);
  if (open && artist) displayed.current = artist;
  const data = open ? artist : displayed.current;

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // --- THE REAL-WORLD SAFEGUARD ---
  const handleBookingRoute = () => {
    // Real Supabase UUIDs contain hyphens. Static template IDs do not.
    if (String(data?.id).includes('-')) {
      onClose();
      setLocation(`/artist/${data.id}`);
    } else {
      window.alert("This is a static template demo artist. Since your app is now 100% real-world, it cannot load a live booking calendar for fake data! Register a real artist in your Dashboard to test the calendar.");
    }
  };

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

  const allImages: string[] = (() => {
    const raw = data.portfolio || [];
    let images = Array.isArray(raw) 
      ? raw.map((p: any) => (typeof p === 'string' ? p : p?.image)).filter(Boolean)
      : [];
    if (images.length === 0 && data.image) {
      images = [typeof data.image === 'string' ? data.image : ''];
    }
    return images.filter(img => typeof img === 'string' && img.trim() !== '');
  })();

  const makeupImages = allImages.filter(img => !img.toLowerCase().includes('addon'));
  const addonImages = allImages.filter(img => img.toLowerCase().includes('addon'));

  const firstName = data.name ? data.name.split(' ')[0] : 'Artist';
  const hasAddonText = Array.isArray(data.addons) && data.addons.length > 0;
  const hasAddonImages = addonImages.length > 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.dataset.hasFailed) return;
    e.currentTarget.dataset.hasFailed = 'true';
    const originalSrc = e.currentTarget.src.toLowerCase();
    if (originalSrc.includes('addon')) {
      const fallbackAddons = [
        '/canvas-artists/artist_001/addon-saree-draping-1.jpg',
        '/canvas-artists/artist_002/addon-hairstyle-1.jpg',
        '/canvas-artists/artist_006/addon-brow-tinting-1.jpg',
        '/canvas-artists/artist_016/addon-nail-art-1.jpg'
      ];
      e.currentTarget.src = fallbackAddons[Math.floor(Math.random() * fallbackAddons.length)];
    } else {
      const safeId = String(Math.floor(Math.random() * 5) + 1).padStart(3, '0');
      e.currentTarget.src = `/canvas-artists/artist_${safeId}/portfolio-1.jpg`;
    }
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
          >
            <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            
            <div className="bg-[var(--bg-dark)] w-full pt-8 pb-12 px-6 md:px-12 relative border-b border-[var(--gold)]/20">
              <div className="max-w-5xl mx-auto">
                <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-[var(--gold)] transition-colors mb-8 border border-white/20 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-md w-fit">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-0">
                  <div className="shrink-0">
                    <img src={data.image || '/fallback-avatar.jpg'} alt={data.name || 'Artist'} className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border border-[var(--gold)]/50 shadow-xl" onError={handleImageError} />
                  </div>
                  <div className="flex-1 w-full pt-2">
                    <div className="flex items-center gap-4 mb-3">
                      <h1 className="font-serif text-3xl md:text-4xl text-white tracking-wide">{data.name || 'Artist Profile'}</h1>
                      <span className="bg-[var(--gold)] text-[var(--bg-dark)] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0"><CheckCircle2 size={12} strokeWidth={3} /> Verified</span>
                    </div>
                    <p className="text-[var(--text-light)] text-[14px] mb-5 font-sans flex items-center gap-2"><MapPin size={14} className="text-[var(--gold)]" /> {data.location || data.city || 'Hyderabad'} <span className="mx-2 text-white/20">•</span> {data.experience_years || 6} yrs experience</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(data.tags || ["Bridal Glam", "Editorial", "Skin Work"]).map((tag: string) => (
                        <span key={tag} className="px-3 py-1 rounded border border-white/20 text-white/80 text-[10px] font-medium tracking-wider bg-white/5">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-white mb-6">
                      <Star size={16} className="text-[var(--gold)]" fill="currentColor" /><span className="font-medium text-base">{data.rating || '4.8'}</span><span className="text-white/50 text-xs">({data.reviewsCount || 178} reviews)</span><span className="mx-3 text-white/20">—</span><span className="font-serif text-xl tracking-wide">{data.startingPrice || '₹22,000'}</span><span className="text-white/50 text-xs">Bridal Package</span>
                    </div>
                    
                    <button onClick={handleBookingRoute} className="w-full max-w-[280px] bg-[var(--gold)] text-[var(--bg-dark)] hover:bg-[#B08D45] transition-colors py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                      View Availability & Book ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-[var(--bg-cream)] px-6 py-12 md:px-12">
              <div className="max-w-5xl mx-auto">
                <div className="max-w-3xl mb-16">
                  <p className="font-serif italic text-xl md:text-2xl text-[var(--text-primary)] leading-relaxed">"{data.bio || data.signature || `Brings a cinematic, editorial eye to every face she works on. Based in ${data.city || 'Hyderabad'}.`}"</p>
                </div>
                <div className="mb-8 text-left"><h2 className="font-serif text-3xl text-[var(--text-primary)] mb-2">Verified Portfolio</h2><p className="text-[var(--text-secondary)] text-[14px]">Real client work showcasing {firstName}'s signature aesthetic.</p></div>

                {makeupImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {makeupImages.map((img: string, i: number) => (
                      <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--border-light)] flex flex-col">
                        <div className="cursor-pointer overflow-hidden relative group" onClick={() => setExpandedImage(img)}>
                          <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" onError={handleImageError} />
                          <div className="absolute inset-0 bg-[var(--bg-dark)]/0 group-hover:bg-[var(--bg-dark)]/10 transition-colors"></div>
                          <div className="absolute top-3 left-3"><span className="bg-[var(--gold)] text-[var(--bg-dark)] px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-[0.1em]">Look 0{i + 1}</span></div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 bg-[var(--bg-cream)]">
                          <h3 className="font-serif text-lg text-[var(--text-primary)] leading-tight mb-2">{firstName} - {MAKEUP_NAMES[i % MAKEUP_NAMES.length]}</h3>
                          <p className="text-[12px] text-[var(--text-secondary)] mb-6 flex-1">A verified example of the aesthetic.</p>
                          <button onClick={handleBookingRoute} className="w-full bg-[#D1B88A] hover:bg-[var(--gold)] text-[var(--bg-dark)] transition-colors py-2.5 rounded text-[11px] font-bold tracking-[0.1em] uppercase">Enquire Look</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">Portfolio images are currently being verified.</p>
                )}

                {(hasAddonText || hasAddonImages) && (
                  <div className="mt-12 pt-12 border-t border-[var(--border-light)]">
                    <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
                      {hasAddonText && (
                        <div className={`flex-1 ${!hasAddonImages ? 'max-w-3xl' : ''}`}>
                          <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-3">Add-ons & Upgrades</h2>
                          <p className="text-[var(--text-secondary)] text-[14px] mb-8 leading-relaxed">Enhance your booking with these specialized services.</p>
                          <div className="space-y-0">
                            {data.addons.map((addon: string, idx: number) => {
                              if (typeof addon !== 'string') return null;
                              const parts = addon.split('(');
                              return (
                                <div key={idx} className="flex items-center justify-between py-4 border-b border-[var(--border-light)] last:border-0">
                                  <span className="text-[14px] font-medium text-[var(--text-primary)]">{parts[0].trim()}</span>
                                  {parts.length > 1 && <span className="text-[11px] font-bold text-[var(--bg-dark)] tracking-widest bg-[var(--gold)] px-3 py-1 rounded-full">{parts[1].replace(')', '').trim()}</span>}
                                </div>
                              );
                            })}
                          </div>
                          <button onClick={handleBookingRoute} className="mt-8 border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--bg-dark)] transition-colors px-6 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest w-full sm:w-auto">Enquire About Add-ons</button>
                        </div>
                      )}
                      {hasAddonImages && (
                        <div className={`w-full ${hasAddonText ? 'lg:w-1/2' : 'w-full'} flex gap-4 overflow-x-auto hide-scroll snap-x pb-4`}>
                          {addonImages.map((img: string, i: number) => (
                            <div key={i} className="shrink-0 w-[240px] md:w-[260px] snap-start cursor-pointer relative group" onClick={() => setExpandedImage(img)}>
                              <img src={img} alt="Addon" className="w-full aspect-[3/4] object-cover rounded-xl shadow-sm border border-[var(--border-light)]" onError={handleImageError} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setExpandedImage(null)} className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--bg-dark)]/95 p-4 md:p-12 backdrop-blur-xl" role="dialog">
            <button className="absolute right-6 top-6 md:right-12 md:top-12 text-[var(--text-light)] transition-colors hover:text-[var(--gold)] bg-black/20 p-2 rounded-full" onClick={() => setExpandedImage(null)}><X size={32} strokeWidth={1.5} /></button>
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.4, ease }} src={expandedImage} className="max-h-[90vh] max-w-full object-contain border border-white/10 shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()} onError={handleImageError} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProfileModal;