import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, CheckCircle2, MapPin, ArrowLeft, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { getTheme } from '@/lib/theme';

const ease = [0.22, 1, 0.36, 1] as const;

const MAKEUP_NAMES = [
  "intense smokey eye bold glam",
  "silver cut-crease reception glam",
  "soft glam engagement look",
  "christian bridal with smoky elegance",
  "nizami royal festive bridal",
  "classic canvas aesthetic"
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

  // Read style query param for the Dynamic Theme Engine
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  // OPTION B: Opens the booking drawer right on the same page instead of navigating away!
  const handleBookClick = () => {
    onClose();
    onBookAppointment();
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

  const firstName = data.name ? data.name.split(' ')[0].toLowerCase() : 'artist';
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
            className={`fixed inset-0 z-[200] w-full h-[100dvh] overflow-y-auto bg-[#FDF3F1] ${theme.fontBase}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.4, ease }}
            role="dialog"
          >
            <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            
            <div className={`bg-[#150A26] w-full pt-8 pb-12 px-6 md:px-12 relative border-b ${theme.borderBase} text-white`}>
              <div className="max-w-5xl mx-auto">
                <button onClick={onClose} className={`flex items-center gap-2 text-white/70 hover:text-[#9D7C3A] transition-colors mb-8 border border-white/20 px-4 py-2 ${theme.cardRadius} ${theme.formLabel} !text-white !bg-transparent backdrop-blur-md w-fit`}>
                  <ArrowLeft size={14} /> back
                </button>
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-0">
                  <div className="shrink-0 mt-4">
                    <img src={data.image || '/fallback-avatar.jpg'} alt={data.name || 'Artist'} className={`w-24 h-24 md:w-36 md:h-36 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} object-cover border border-[#9D7C3A]/50 shadow-xl`} onError={handleImageError} />
                  </div>
                  <div className="flex-1 w-full pt-2">
                    <div className="flex flex-col items-start gap-2 mb-3">
                      <h1 className={`${theme.premiumTag} !text-5xl md:!text-7xl !leading-none drop-shadow-xl py-2`}>
                        {data.name || 'artist profile'}
                      </h1>
                      <span className={`${theme.badge} !bg-[#9D7C3A] !text-white !border-none flex items-center gap-1 shrink-0`}><CheckCircle2 size={12} strokeWidth={2.5} /> verified</span>
                    </div>
                    <p className={`${theme.formLabel} !text-white/60 mb-5 flex items-center gap-2`}><MapPin size={14} className="text-[#9D7C3A]" /> {data.location || data.city || 'hyderabad'} <span className="mx-2 text-white/20">•</span> {data.experience_years || 6} yrs experience</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(data.tags || ["bridal glam", "editorial", "skin work"]).map((tag: string) => (
                        <span key={tag} className={`px-3 py-1 border border-white/15 !text-white/80 ${theme.formLabel} bg-white/5 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-white mb-6">
                      <Star size={16} className="text-[#9D7C3A]" fill="currentColor" />
                      <span className={`${theme.stat} !text-base !text-white`}>{data.rating || '4.8'}</span>
                      <span className={`${theme.formLabel} !text-white/50`}>({data.reviewsCount || 178} reviews)</span>
                      <span className="mx-3 text-white/25">—</span>
                      <span className={`${theme.stat} !text-xl bg-gradient-to-r from-[#7A5C24] via-[#E2BE68] to-[#7A5C24] text-transparent bg-clip-text inline-block`}>{data.startingPrice || '₹22,000'}</span>
                      <span className={`${theme.formLabel} !text-white/50`}>bridal package</span>
                    </div>
                    
                    {/* UPDATED BUTTON LOGIC */}
                    <button onClick={handleBookClick} className={`w-full max-w-[280px] ${theme.btnPrimary} !bg-[#9D7C3A] !text-white hover:!bg-white hover:!text-black shadow-lg flex items-center justify-center gap-2 cursor-pointer`}>
                      view availability & book ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#FDF3F1] px-6 py-12 md:px-12">
              <div className="max-w-5xl mx-auto">
                <div className="max-w-3xl mb-16">
                  <p className={`${theme.quote} !text-black/80`}>"{data.bio || data.signature || `brings a cinematic, editorial eye to every face she works on. based in ${data.city || 'hyderabad'}.`}"</p>
                </div>
                <div className="mb-8 text-left">
                  <h2 className={`${theme.headingSection} mb-2`}>verified <span className={theme.premiumTag}>portfolio</span></h2>
                  <p className={theme.formLabel}>real client work showcasing {firstName}'s signature aesthetic.</p>
                </div>

                {makeupImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {makeupImages.map((img: string, i: number) => (
                      <div key={i} className={`bg-white ${theme.cardRadius} overflow-hidden shadow-sm border ${theme.borderBase} flex flex-col`}>
                        <div className="cursor-pointer overflow-hidden relative group" onClick={() => setExpandedImage(img)}>
                          <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" onError={handleImageError} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                          <div className="absolute top-3 left-3"><span className={`${theme.badge} !bg-[#9D7C3A] !text-white !border-none`}>look 0{i + 1}</span></div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 bg-white">
                          <h3 className={`${theme.headingModal} !text-xl !tracking-normal mb-2`}>{firstName} — {MAKEUP_NAMES[i % MAKEUP_NAMES.length]}</h3>
                          <p className={`${theme.bodyText} !text-xs !text-black/50 mb-6 flex-1`}>a verified example of the aesthetic.</p>
                          
                          {/* UPDATED BUTTON LOGIC */}
                          <button onClick={handleBookClick} className={`w-full ${theme.btnPrimary}`}>enquire look</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`${theme.bodyText} italic !text-black/40`}>portfolio images are currently being verified.</p>
                )}

                {(hasAddonText || hasAddonImages) && (
                  <div className={`mt-12 pt-12 border-t ${theme.borderBase}`}>
                    <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
                      {hasAddonText && (
                        <div className={`flex-1 ${!hasAddonImages ? 'max-w-3xl' : ''}`}>
                          <h2 className={`${theme.headingSection} mb-3`}>add-ons & <span className={theme.premiumTag}>upgrades</span></h2>
                          <p className={`${theme.formLabel} mb-8`}>enhance your booking with these specialized services.</p>
                          <div className="space-y-0">
                            {data.addons.map((addon: string, idx: number) => {
                              if (typeof addon !== 'string') return null;
                              const parts = addon.split('(');
                              return (
                                <div key={idx} className={`flex items-center justify-between py-4 border-b ${theme.borderBase} last:border-0`}>
                                  <span className={theme.bodyText}>{parts[0].trim()}</span>
                                  {parts.length > 1 && <span className={`${theme.badge} !bg-[#9D7C3A] !text-white !border-none`}>{parts[1].replace(')', '').trim()}</span>}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* UPDATED BUTTON LOGIC */}
                          <button onClick={handleBookClick} className={`mt-8 w-full sm:w-auto ${theme.btnOutline}`}>enquire about add-ons</button>
                        </div>
                      )}
                      {hasAddonImages && (
                        <div className={`w-full ${hasAddonText ? 'lg:w-1/2' : 'w-full'} flex gap-4 overflow-x-auto hide-scroll snap-x pb-4`}>
                          {addonImages.map((img: string, i: number) => (
                            <div key={i} className="shrink-0 w-[240px] md:w-[260px] snap-start cursor-pointer relative group" onClick={() => setExpandedImage(img)}>
                              <img src={img} alt="Addon" className={`w-full aspect-[3/4] object-cover ${theme.cardRadius} shadow-sm border ${theme.borderBase}`} onError={handleImageError} />
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setExpandedImage(null)} className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-xl ${theme.fontBase}`} role="dialog">
            <button className="absolute right-6 top-6 md:right-12 md:top-12 text-white transition-colors hover:text-[#9D7C3A] bg-white/10 p-2.5 rounded-full" onClick={() => setExpandedImage(null)}><X size={24} strokeWidth={1.5} /></button>
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.4, ease }} src={expandedImage} className={`max-h-[90vh] max-w-full object-contain border border-white/10 shadow-2xl ${theme.cardRadius}`} onClick={(e) => e.stopPropagation()} onError={handleImageError} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProfileModal;