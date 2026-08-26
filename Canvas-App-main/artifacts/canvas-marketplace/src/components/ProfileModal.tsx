import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, CheckCircle2, ArrowLeft, MapPin, X, ArrowUpRight } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80';

const EDITORIAL_PORTFOLIO = [
  '1522337360788-8b13fee7a3af', 
  '1515377905703-c4788e51af15', 
  '1508186225823-0963cfdbaa18', 
  '1509967419530-da38b4704bc6', 
  '1542452255199-3172cb8cbce8', 
  '1518049362265-d5b2a6467637' 
].map(id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`);

export type ProfileModalProps = {
  open: boolean;
  artist: any | null; 
  onClose: () => void;
  onBookAppointment: () => void;
};

const LOOK_NAMES = [
  "Signature Editorial Look",
  "Soft Glamour & Skin Work",
  "Creative Portraiture",
  "High-Fashion Glam",
  "Classic Canvas Aesthetic",
  "Flawless Base Execution"
];

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
    if (raw.length === 0) return EDITORIAL_PORTFOLIO;
    return raw
      .map((p: any) => (typeof p === 'string' ? p : p?.image))
      .filter(Boolean);
  })();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-[#05020A] text-white h-[100dvh] w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease }}
            role="dialog"
            aria-modal="true"
          >
            
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-12 relative border-r border-white/10">
              
              <button
                onClick={onClose}
                className="group sticky top-[72px] mt-[72px] z-20 mb-12 inline-flex items-center gap-3 bg-[#05020A]/90 py-4 pr-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/50 backdrop-blur-md transition-colors hover:text-white"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                BACK TO DIRECTORY
              </button>

              <div className="mx-auto max-w-5xl pb-24">
                
                <div className="mb-16">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B66CF2] mb-4">Portfolio</p>
                  <h2 className="text-6xl md:text-8xl font-serif italic leading-none tracking-tight">The Archive.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {portfolioImages.map((img: string, i: number) => {
                    let colSpanClass = "md:col-span-12";
                    let aspectClass = "aspect-[16/9]";
                    
                    if (i % 5 === 1) {
                      colSpanClass = "md:col-span-5";
                      aspectClass = "aspect-[4/5]";
                    } else if (i % 5 === 2) {
                      colSpanClass = "md:col-span-7";
                      aspectClass = "aspect-square";
                    } else if (i % 5 === 3 || i % 5 === 4) {
                      colSpanClass = "md:col-span-6";
                      aspectClass = "aspect-[4/5]";
                    }

                    return (
                      <div key={i} className={`${colSpanClass} group relative cursor-pointer overflow-hidden border border-white/10 bg-[#1A1A1A]`} onClick={() => setExpandedImage(img)}>
                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white border border-white/20">
                            EXPAND
                          </span>
                        </div>
                        <img 
                          src={img} 
                          alt={`${data.name} portfolio ${i}`}
                          className={`w-full ${aspectClass} object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100`}
                          onError={(e) => {
                            if (e.currentTarget.dataset.hasFailed) return;
                            e.currentTarget.dataset.hasFailed = 'true';
                            e.currentTarget.src = FALLBACK_IMG;
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">LOOK N°0{i + 1}</p>
                          <p className="text-sm font-bold tracking-widest text-[#B66CF2] mt-1 uppercase">{LOOK_NAMES[i % LOOK_NAMES.length]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-white text-black flex flex-col z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
              
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide">
                
                <div className="mb-10 flex items-start gap-6 border-b border-black/10 pb-10">
                  <div className="h-20 w-20 shrink-0 bg-[#f4f4f4] overflow-hidden">
                    <img 
                      src={data.image}
                      alt={`${data.name} Profile`}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#B66CF2] mb-2">
                      Access Verified
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/60">
                      <CheckCircle2 size={14} className="text-black" /> Professional Status
                    </span>
                  </div>
                </div>
                
                <h1 className="text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-black mb-6">
                  {data.name}
                </h1>
                
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-black/50 mb-12">
                  <MapPin size={16} className="text-black" /> {data.city} <span className="text-[#B66CF2] mx-2">/</span> {data.rating} RATING
                </p>

                <div className="border-t border-black/10 pt-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-6">Disciplines & Techniques</p>
                  <div className="flex flex-wrap gap-2">
                    {(data.tags || ["Bridal Glam", "Editorial", "Skin Work"]).map((tag: string) => (
                      <span key={tag} className="border border-black px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-black">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-12 border-t border-black/10 pt-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-4">The Standard</p>
                  <p className="text-sm font-bold uppercase tracking-widest leading-loose text-black/80">
                    {data.signature || `A master of their craft, known for elevating natural features through precise, high-fashion execution.`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 bg-[#F9F9F9] border-t border-black/10 p-8 lg:p-12">
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-2">Starting Base Rate</p>
                  <p className="text-4xl font-black text-black tracking-tight">{data.startingPrice}</p>
                </div>
                <button 
                  onClick={onBookAppointment}
                  className="group flex w-full items-center justify-center gap-4 bg-black py-6 text-xs font-black uppercase tracking-[0.3em] text-white transition-colors hover:bg-[#B66CF2]"
                >
                  SECURE YOUR SLOT 
                  <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

            </div>

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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05020A]/95 p-4 md:p-12 backdrop-blur-2xl"
            role="dialog"
            aria-label="Expanded view"
          >
            <button 
              className="absolute right-6 top-6 md:right-12 md:top-12 text-white/50 transition-colors hover:text-[#B66CF2]"
              onClick={() => setExpandedImage(null)}
            >
              <X size={40} strokeWidth={1} />
            </button>
            
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              src={expandedImage}
              alt="Expanded portfolio"
              className="max-h-[90vh] max-w-full object-contain border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
              onError={(e) => { e.currentTarget.src = EDITORIAL_PORTFOLIO[0] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProfileModal;