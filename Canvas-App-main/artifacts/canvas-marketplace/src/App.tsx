import { useEffect, useState, useRef, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Menu, X, Sparkles } from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent } from 'framer-motion';
import { ArtistCard } from '@/components/ArtistCard';
import { HeroSearch, type HeroSearchValue } from '@/components/HeroSearch';
import { type Artist } from './Data/dummyArtists';
import { ProfileModal } from '@/components/ProfileModal';
import { AuthModal } from '@/components/AuthModal';
import NotFound from '@/pages/not-found';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Dashboard from './pages/Dashboard';
import { artistsData as artists } from './Data/artistsData';
import BeautyDemo from '@/pages/ArtistProfile';
import { ChatDrawer } from '@/components/ChatDrawer';
import { Reveal } from '@/components/Reveal';
import { Premium } from '@/components/Premium';
import { getTheme } from '@/lib/theme';

// ==========================================
// PERFORMANCE OPTIMIZED SCROLL WRAPPERS
// ==========================================
function ScrollZoom({ children, className }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}
function ScrollZoomIn({ children, className }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}

const queryClient = new QueryClient();

const discoverCategories = [
  { id: 'all', label: 'all artists' },
  { id: 'Bridal & Wedding', label: 'bridal & wedding' },
  { id: 'Party & Event Glam', label: 'party & event glam' },
  { id: 'Natural & Soft Aesthetics', label: 'natural & soft aesthetics' },
  { id: 'Editorial & High Fashion', label: 'editorial & high fashion' },
  { id: 'Specialized Skin & Grooming', label: 'specialized skin & grooming' },
];

const BG_PARALLAX_FACTOR = 0.15;
const BG_PARALLAX_MAX_PX = 160;
const GRID_PARALLAX_FACTOR = -0.06;
const GRID_PARALLAX_MAX_PX = 70;

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
       <rect width="400" height="500" fill="#150A26"/>
       <text x="50%" y="50%" font-family="serif" font-size="26" fill="#6B3C9C"
         text-anchor="middle" dominant-baseline="middle" letter-spacing="4">CANVAS</text>
     </svg>`
  );

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src === PLACEHOLDER_IMG) return;
  img.onerror = null;
  img.src = PLACEHOLDER_IMG;
}

function normalizePortfolio(
  portfolio: any[] | null | undefined,
  fallbackImage: string
): { style: string; image: string }[] {
  const raw = portfolio || [];
  if (raw.length === 0) {
    return [{ style: 'signature work', image: fallbackImage }];
  }
  return raw.map((p: any, i: number) => {
    if (typeof p === 'string') {
      return { style: `look n°${String(i + 1).padStart(2, '0')}`, image: p };
    }
    return {
      style: p?.style || `look n°${String(i + 1).padStart(2, '0')}`,
      image: p?.image || fallbackImage,
    };
  });
}

const HYDERABAD_LOCATIONS = [
  'Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Madhapur',
  'Gachibowli', 'Kondapur', 'Film Nagar', 'Kukatpally',
  'Begumpet', 'Secunderabad'
];

const local100Artists: Artist[] = artists.slice(0, 100).map((a: any, index: number) => {
  const profileImg = a.image || a.portfolio?.[0]?.image || a.portfolio?.[0] || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80';
  const normalizedPortfolio = normalizePortfolio(a.portfolio, profileImg);
  const assignedCity = HYDERABAD_LOCATIONS[(index * 7) % HYDERABAD_LOCATIONS.length];
  return {
    id: String(a.id),
    name: a.name,
    category: a.category || 'Bridal & Wedding',
    services: [a.specialty || 'Makeup Artist', 'Makeup Artist'],
    city: assignedCity,
    location: `${assignedCity}, Hyderabad`,
    maxTravelKm: 50,
    pricePerSession: a.pricePerSession || 15000,
    startingPrice: a.startingPrice || `₹15,000`,
    rating: a.rating || 4.9,
    reviewCount: a.reviewsCount || 24,
    reviewsCount: a.reviewsCount || 24,
    image: profileImg,
    hoverImage: normalizedPortfolio[1]?.image || normalizedPortfolio[0]?.image || profileImg,
    tags: a.tags || [a.specialty || 'Custom Styling'],
    bio: a.bio || `Expert in ${a.specialty}. Available for bookings.`,
    signature: a.specialty || 'Signature Aesthetic',
    portfolio: normalizedPortfolio,
    addons: a.addons || [],
    isVerified: true,
  };
});

function getEstimatedDistance(clientLoc: string, artistCity: string, artistId: string): number {
  const locLower = clientLoc.toLowerCase();
  const cityLower = artistCity.toLowerCase();
  if (locLower === '' || cityLower.includes(locLower) || locLower.includes(cityLower)) return 5;
  const stableNum = parseInt(artistId.replace(/\D/g, '')) || 0;
  return (stableNum % 21) + 5;
}

function runCanvasMatch(
  services: string[],
  location: string,
  categoryFilter: string,
  aiTags: string[] = [],
  pool: Artist[] = local100Artists
) {
  return pool.filter(artist => {
    if (categoryFilter !== 'all') {
      const artistCat = (artist.category || '').toLowerCase();
      const filterCat = categoryFilter.toLowerCase();
      if (!artistCat.includes(filterCat) && !filterCat.includes(artistCat)) return false;
    }
    if (services.length > 0 && !artist.services.some(s => services.includes(s))) return false;
    
    const estDistance = getEstimatedDistance(location, artist.city, artist.id);
    if (!(artist as any).isLiveDb && estDistance > artist.maxTravelKm) return false;
    
    return true;
  }).map(artist => {
    let matchScore = 78;
    const artistDataString = `${artist.category} ${artist.tags?.join(' ')} ${artist.bio} ${artist.signature}`.toLowerCase();
    if (aiTags.length > 0) {
      const matchCount = aiTags.filter(tag => artistDataString.includes(tag.toLowerCase())).length;
      matchScore = Math.min(99, 75 + (matchCount * 6));
    }
    const finalScore = (artist as any).isLiveDb ? Math.min(matchScore + 4, 99) : matchScore;
    return {
      ...artist,
      match: finalScore,
      matchReasons: aiTags.length > 0 ? aiTags : ['Based on location & style']
    };
  });
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

async function analyzeLookWithAI(file: File): Promise<string[]> {
  try {
    const base64Image = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('vision-match', {
      body: { imageBase64: base64Image }
    });
    if (error) throw error;
    return data.tags || ['soft glam', 'natural', 'bridal'];
  } catch (error) {
    console.error("Secure Vision API Error:", error);
    return ['soft glam', 'natural', 'bridal'];
  }
}

// ==========================================
// MAGAZINE BLEED HERO VISUAL
// ==========================================
function CanvasVisualEditorial({ theme }: { theme: any }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
      <div className="absolute -top-10 right-0 w-[420px] h-[420px] bg-[#C9A463]/25 rounded-full blur-[110px]" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-[#4A2A6B]/30 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -12, 0] }}
        transition={{
          opacity: { duration: 1 },
          y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <img
          src="/logo.png"
          alt="Canvas"
          className="w-[280px] md:w-[380px] lg:w-[440px] object-contain drop-shadow-[0_30px_60px_rgba(74,42,107,0.25)]"
        />
        
        <div className="flex flex-col items-center mt-6">
          <span className={`${theme.eyebrow} mb-3 text-center`}>
            the canvas standard
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-black/20 to-transparent mb-3" />
          <p className={`${theme.premiumTag} text-sm md:text-base text-center`}>
            curated private roster
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// HOME COMPONENT
// ==========================================
function Home({ session, setAuthOpen, styleVersion }: { session: Session | null; setAuthOpen: (v: boolean) => void; styleVersion: string }) {
  const theme = getTheme(styleVersion);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 80) {
      setIsHeaderHidden(true);
    } else {
      setIsHeaderHidden(false);
    }
    lastScrollY.current = latest;
  });

  const [platformStats, setPlatformStats] = useState({
    avgBookingValue: 21700,
    totalBookings: 1250,
    avgRating: 4.8
  });

  const handleSelectArtist = (artist: Artist) => {
    if ((artist as any).isLiveDb || String(artist.id).includes('-')) {
      setLocation(`/artist/${artist.id}?style=${styleVersion}`);
    } else {
      setSelectedArtist(artist);
    }
  };

  const editorialImages = [
    '1522337360788-8b13fee7a3af', '1515377905703-c4788e51af15', '1508186225823-0963cfdbaa18',
    '1509967419530-da38b4704bc6', '1542452255199-3172cb8cbce8', '1518049362265-d5b2a6467637'
  ];

  const { data: liveArtists = [] } = useQuery({
    queryKey: ['liveArtists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select(`id, business_name, category, city, max_travel_km, starting_price, portfolio`);
      
      if (error) {
        console.error('Error fetching live artists:', error.message);
        return [];
      }
      
      if (data) {
        return data.map((item: any, index: number) => {
          const rawPortfolio = item.portfolio || [];
          const mainImage = rawPortfolio.length > 0
            ? typeof rawPortfolio[0] === 'string' ? rawPortfolio[0] : rawPortfolio[0]?.image
            : `https://images.unsplash.com/photo-${editorialImages[index % editorialImages.length]}?auto=format&fit=crop&w=1200&q=80`;
          const normalizedPortfolio = normalizePortfolio(rawPortfolio, mainImage);
          return {
            id: item.id,
            name: item.business_name || 'Canvas Artist',
            category: item.category || 'Bridal & Wedding',
            services: ['Makeup Artist', item.category || 'Bridal & Wedding'],
            city: item.city || 'Jubilee Hills',
            location: `${item.city || 'Jubilee Hills'}, Hyderabad`,
            maxTravelKm: item.max_travel_km || 25,
            pricePerSession: item.starting_price || 15000,
            startingPrice: `₹${(item.starting_price || 15000).toLocaleString('en-IN')}`,
            rating: 4.9,
            reviewCount: 24 + (index % 40),
            reviewsCount: 24 + (index % 40),
            image: mainImage,
            hoverImage: normalizedPortfolio[1]?.image || mainImage,
            tags: ['HD Airbrush', 'Bridal Specialist', 'Custom Styling'],
            bio: 'Signature luxury aesthetic tailored to high-end events in Hyderabad.',
            signature: 'Signature luxury aesthetic tailored to high-end events in Hyderabad.',
            portfolio: normalizedPortfolio,
            addons: [],
            isVerified: true,
            isLiveDb: true,
          } as Artist & { isLiveDb?: boolean };
        });
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, 
  });

  const [sortBy, setSortBy] = useState('Best match');
  const [maxBudget, setMaxBudget] = useState(65000);
  const [cityFilters, setCityFilters] = useState<Record<string, boolean>>({
    'Jubilee Hills': true, 'Banjara Hills': true, 'HITEC City': true, 'Madhapur': true,
    'Gachibowli': true, 'Kondapur': true, 'Film Nagar': true, 'Kukatpally': true,
    'Begumpet': true, 'Secunderabad': true
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: artists } = await supabase.from('artist_profiles').select('starting_price');
        let avgPrice = 21700;
        if (artists && artists.length > 0) {
          const validPrices = artists.map((a: any) => a.starting_price).filter((p: number) => p > 0);
          if (validPrices.length > 0) {
            avgPrice = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
          }
        }
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('status', ['confirmed', 'completed', 'successful']);
        setPlatformStats(prev => ({
          ...prev,
          avgBookingValue: avgPrice || prev.avgBookingValue,
          totalBookings: (bookingCount || 0) + 1250,
        }));
      } catch (error) {
        console.error("Could not fetch live stats:", error);
      }
    }
    fetchStats();
  }, []);

  const [search, setSearch] = useState<HeroSearchValue>({
    services: ['Makeup Artist'],
    location: 'Jubilee Hills',
    date: 'this weekend',
    timeSlot: 'Morning (08:00 - 13:00)',
    priceRange: 'Any Investment',
    lookDescription: '',
    inspirationFile: null
  });

  const handleSearchChange = async (newVal: HeroSearchValue) => {
    if (newVal.inspirationFile && !session) {
      window.alert("Please Sign In or Create an Account to use AI Vision Look Matching.");
      setAuthOpen(true);
      return;
    }
    setSearch(newVal);
    if (newVal.inspirationFile) {
      const tags = await analyzeLookWithAI(newVal.inspirationFile);
      setAiTags(tags);
    } else {
      setAiTags([]);
    }
  };

  const [hasSearched, setHasSearched] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const openBrief = () => { setSent(false); setBriefOpen(true); };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.alert("You have been signed out.");
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const sourceArtists: Artist[] = useMemo(() => {
    const seenIds = new Set<string>();
    const merged: Artist[] = [];
    
    for (const artist of liveArtists) {
      if (seenIds.has(artist.id)) continue;
      seenIds.add(artist.id);
      merged.push(artist);
    }
    
    for (const artist of local100Artists) {
      if (seenIds.has(artist.id)) continue;
      seenIds.add(artist.id);
      merged.push(artist);
    }
    
    return merged;
  }, [liveArtists]);

  const matchedArtists = runCanvasMatch(
    search.services, search.location, selectedCategoryFilter, aiTags, sourceArtists
  );

  const filteredArtists = matchedArtists.filter(artist => {
    if (artist.pricePerSession > maxBudget) return false;
    
    const activeCities = Object.entries(cityFilters)
      .filter(([_, isChecked]) => isChecked)
      .map(([city]) => city.toLowerCase());

    if (activeCities.length > 0 && activeCities.length < 10) {
      const matchesCity = activeCities.some(ac => {
        const parts = ac.split('/').map(p => p.trim());
        return parts.some(part => {
          const aCity = (artist.city || '').toLowerCase();
          const aLoc = (artist.location || '').toLowerCase();
          return aCity.includes(part) || part.includes(aCity) || aLoc.includes(part) || part.includes(aLoc);
        });
      });
      if (!matchesCity) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Highest rated') return b.rating - a.rating;
    if (sortBy === 'Price: low to high') return a.pricePerSession - b.pricePerSession;
    if (sortBy === 'Price: high to low') return b.pricePerSession - a.pricePerSession;
    return (b.match || 0) - (a.match || 0);
  });

  const uniqueArtists = Array.from(new Map(filteredArtists.map(item => [item.id, item])).values());

  useEffect(() => {
    if (!discoverOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDiscoverOpen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [discoverOpen]);

  const prefersReducedMotion = useReducedMotion();

  const [, setBgY] = useState(0);
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setBgY(prefersReducedMotion ? 0 : Math.min(latest * BG_PARALLAX_FACTOR, BG_PARALLAX_MAX_PX));
    });
  }, [scrollY, prefersReducedMotion]);

  const gridY = useTransform(scrollY, (latest) =>
    prefersReducedMotion ? 0 : Math.max(latest * GRID_PARALLAX_FACTOR, -GRID_PARALLAX_MAX_PX)
  );

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setDiscoverOpen(false);
    setSelectedArtist(null);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBriefSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      window.alert("Please Sign In or Create an Account to secure a booking.");
      setBriefOpen(false);
      setAuthOpen(true);
      return;
    }
    if (!selectedArtist?.id || !(selectedArtist as any).isLiveDb) {
      window.alert("This artist is a demo profile and isn't available for live bookings yet. Please choose a registered Canvas artist.");
      return;
    }
    setIsSubmitting(true);
    const formData = event.currentTarget;
    try {
      const dataElements = new FormData(formData);
      const bookingData = {
        client_id: session.user.id,
        artist_id: selectedArtist.id,
        event_date: dataElements.get('date'),
        time_slot: dataElements.get('slot'),
        venue_address: dataElements.get('location'),
        look_details: dataElements.get('message'),
        status: 'pending'
      };
      const { error } = await supabase.from('bookings').insert([bookingData]);
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      console.error("Error sending booking:", error);
      window.alert(`Booking failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative min-h-[100dvh] overflow-x-hidden text-[var(--canvas-dp)] bg-[#FDF3F1] ${theme.fontBase}`}>
      <motion.nav 
        animate={{ y: (isChatOpen || isHeaderHidden) ? -120 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[200] grid grid-cols-3 items-center px-6 md:px-12 h-[100px] bg-[#FDF3F1]/90 backdrop-blur-md border-b border-black/5"
      >
        <div className="hidden md:flex items-center gap-8 justify-start">
          <a onClick={() => scrollTo('discover')} className={`${theme.navLink} cursor-pointer`}>directory</a>
          <a onClick={() => scrollTo('standard')} className={`${theme.navLink} cursor-pointer`}>the standard</a>
        </div>
        <div className="flex items-center justify-center cursor-pointer group" onClick={() => scrollTo('top')}>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Canvas Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:drop-shadow-[0_4px_12px_rgba(107,58,125,0.3)]" />
<span className={`${theme.headingSection} !text-2xl md:!text-3xl tracking-tight transition-colors duration-500 group-hover:text-[#6B3A7D]`}>canvas</span>
          </div>
        </div>
        <div className="flex items-center gap-6 justify-end">
          {session ? (
            <>
              <button onClick={() => setLocation(`/dashboard?style=${styleVersion}`)} className={`${theme.navLink} hidden sm:block`}>dashboard</button>
              <button onClick={handleSignOut} className={`${theme.navLink} hidden sm:block`}>sign out</button>
            </>
          ) : (
            <button onClick={() => setAuthOpen(true)} className={`hidden sm:block ${theme.navLink}`}>account</button>
          )}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-black md:hidden">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`fixed top-[72px] left-0 right-0 z-[190] bg-[#FDF3F1] border-b ${theme.borderBase} p-6 flex flex-col gap-4 shadow-lg md:hidden`}>
            {session && <a onClick={() => { setLocation(`/dashboard?style=${styleVersion}`); setMenuOpen(false); }} className={`${theme.navLink} border-b ${theme.borderBase} pb-3`}>dashboard</a>}
            <a onClick={() => { scrollTo('top'); setMenuOpen(false); }} className={theme.navLink}>home</a>
            <a onClick={() => { scrollTo('discover'); setMenuOpen(false); }} className={theme.navLink}>browse artists</a>
            <a onClick={() => { scrollTo('standard'); setMenuOpen(false); }} className={theme.navLink}>for artists</a>
            {!session && <a onClick={() => { setAuthOpen(true); setMenuOpen(false); }} className={`${theme.navLink} border-t ${theme.borderBase} pt-3`}>my account</a>}
          </motion.div>
        )}
      </AnimatePresence>

      <section id="top" className="min-h-screen grid md:grid-cols-2 gap-8 pt-[100px] px-6 md:px-12 lg:px-20 bg-[radial-gradient(ellipse_60%_50%_at_85%_15%,rgba(201,164,99,0.07),transparent_60%)] relative">
        <ScrollZoomIn>
          <div className="flex flex-col justify-center py-12 md:py-20 md:pr-10 z-10 animate-rise-in">
            <div className="flex flex-col items-start pt-4 mb-8">
  {/* 1. EYEBROW TAG */}
  <div className="flex items-center gap-3 font-['Montserrat'] text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B3C9C] mb-6">
    <div className="w-[26px] h-[1px] bg-[#6B3C9C]"></div>
    ai-powered beauty matching
  </div>

  {/* 2. THE CLEAN EDITORIAL LOCKUP WITH A DEDICATED MIDDLE WINDOW */}
  <h1 className="flex flex-col items-start text-black select-none mb-12 relative w-full pt-4 pb-4">
    
    {/* Line 1: Moura Font */}
    <span className="font-['Moura'] text-[4.5rem] md:text-[6.5rem] tracking-normal leading-[1] z-10 lowercase">
      hyderabad's
    </span>
    
    {/* Middle Script: Beau Rivage floating cleanly in the middle gap */}
    <span className="font-['Beau_Rivage'] text-[#6B3C9C] text-[6rem] md:text-[9rem] absolute top-[28px] md:top-[38px] left-[2%] md:left-[6%] z-30 pointer-events-none drop-shadow-sm lowercase">
      premium
    </span>
    
    {/* Line 2: Moura Font (Pushed down with spacing so it never crashes) */}
    <span className="font-['Moura'] text-[4.5rem] md:text-[6.5rem] tracking-normal leading-[1] z-10 mt-6 md:mt-8 lowercase">
      beauty match.
    </span>
    
  </h1>
</div>
            <p className={`${theme.bodyText} max-w-[460px] mb-3`}>upload the look that inspires you - a screenshot, a saved post, anything - and our AI reads the style, mood, and technique to find artists whose work genuinely matches.</p>
            <p className={`${theme.bodyText} max-w-[460px] mb-8`}>the exclusive ai-powered bridal and beauty booking platform for hyderabad and cyberabad.</p>
            <div className="flex gap-4 flex-wrap">
              <button onClick={() => scrollTo('demo-search')} className={theme.btnPrimary}>try the live demo →</button>
            </div>
          </div>
        </ScrollZoomIn>

        <ScrollZoom>
          <div className="flex flex-col items-center justify-center py-10 md:py-16 relative hidden md:flex">
            <CanvasVisualEditorial theme={theme} />
          </div>
        </ScrollZoom>
      </section>

      <section id="demo-search" className="relative z-20 bg-[#FDF3F1] py-24 border-b border-black/5">
        <ScrollZoomIn>
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
            <HeroSearch value={search} onChange={handleSearchChange} onSubmit={(vals) => { setSearch(vals); setHasSearched(true); scrollTo('discover'); }} isAuthenticated={!!session} onAuthRequired={() => setAuthOpen(true)} />
          </div>
        </ScrollZoomIn>
      </section>

      <main className="relative z-20">
        <ScrollZoomIn className="stats-bar">
          <div className="stat">
            <ScrollZoom><div className={theme.stat}>{sourceArtists.length}</div></ScrollZoom>
            <ScrollZoomIn delay={100}>
              <div className={`${theme.eyebrow} !text-black/80`}>verified artists</div>
            </ScrollZoomIn>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <ScrollZoom><div className={theme.stat}>₹{platformStats.avgBookingValue.toLocaleString('en-IN')}</div></ScrollZoom>
            <ScrollZoomIn delay={100}>
              <div className={`${theme.eyebrow} !text-black/80`}>avg booking value</div>
            </ScrollZoomIn>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <ScrollZoom><div className={theme.stat}>{platformStats.totalBookings.toLocaleString('en-US')}+</div></ScrollZoom>
            <ScrollZoomIn delay={100}>
              <div className={`${theme.eyebrow} !text-black/80`}>successful bookings</div>
            </ScrollZoomIn>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <ScrollZoom><div className={theme.stat}>{platformStats.avgRating}★</div></ScrollZoom>
            <ScrollZoomIn delay={100}>
              <div className={`${theme.eyebrow} !text-black/80`}>platform avg rating</div>
            </ScrollZoomIn>
          </div>
        </ScrollZoomIn>

        <section id="discover" className="bg-[#FDF3F1] text-black py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <ScrollZoomIn>
              <div className="mb-12 flex flex-col gap-5">
                <div>
                  <p className={`${theme.eyebrow} mb-3`}>the shortlist</p>
                  <h2 className={theme.headingSection}>meet the <span className={theme.premiumTag}>artists</span></h2>
                </div>
                <p className={`${theme.bodyText} max-w-[500px]`}>a private directory of hyderabad&apos;s most sought-after talent, rigorously vetted for their technical execution and distinct aesthetic vision.</p>
              </div>
            </ScrollZoomIn>

            <ScrollZoomIn>
              <div className={`mb-12 flex flex-wrap gap-3 border-b ${theme.borderBase} pb-8`}>
                {discoverCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategoryFilter(cat.id)} className={`px-6 py-3 transition-colors border ${theme.cardRadius} ${theme.formLabel} ${selectedCategoryFilter === cat.id ? 'border-black bg-black text-white' : `${theme.borderBase} bg-transparent text-black/60 hover:border-black hover:text-black`}`}>{cat.label}</button>
                ))}
              </div>
            </ScrollZoomIn>

            {hasSearched && search.inspirationFile && (
              <ScrollZoomIn>
                <div className={`mb-12 mt-8 border ${theme.borderBase} bg-white/50 backdrop-blur-sm p-8 lg:p-10 shadow-sm ${theme.cardRadius}`}>
                  <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b ${theme.borderBase} pb-6 mb-6`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center border border-[#6B3A7D]/40 bg-[#6B3A7D]/10 text-[#6B3A7D] ${theme.cardRadius}`}><Sparkles size={20} /></div>
                      <div>
                        <span className={theme.eyebrow}>canvas ai vision analysis</span>
                        <h3 className={`${theme.headingModal} mt-1`}>aesthetic profile extracted</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={theme.badge}>{aiTags.length} tags extracted</span>
                      <span className={theme.badge}>verified secure</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className={theme.formLabel}>detected aesthetic tags from inspiration:</p>
                    <div className="flex flex-wrap gap-2">
                      {(aiTags.length > 0 ? aiTags : ['soft glam', 'editorial', 'bridal']).map((tag, i) => (
                        <span key={i} className={`py-2 bg-white border ${theme.borderBase} ${theme.cardRadius} ${theme.formLabel} !text-black`}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollZoomIn>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start mt-10">
              <ScrollZoomIn className={`lg:col-span-1 bg-white/40 backdrop-blur-md border ${theme.borderBase} p-6 space-y-8 sticky top-8 ${theme.cardRadius}`}>
                <div>
                  <label className={`block mb-3 ${theme.formLabel}`}>sort by</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`w-full bg-transparent border-b ${theme.borderBase} p-3 ${theme.inputText} cursor-pointer`}>
                    <option value="Best match">best match</option><option value="Highest rated">highest rated</option><option value="Price: low to high">price: low to high</option><option value="Price: high to low">price: high to low</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className={theme.formLabel}>max budget</label>
                    <span className={`${theme.formLabel} !text-[#BA965B]`}>₹{maxBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <input type="range" min="5000" max="65000" step="1000" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} className="w-full accent-[#BA965B] cursor-pointer" />
                  <p className={`${theme.formLabel} mt-1`}>up to ₹{maxBudget.toLocaleString('en-IN')}</p>
                </div>
                <div className="mb-10">
                  <h3 className={`mb-5 ${theme.formLabel}`}>city</h3>
                  <div className="space-y-4">
                    {Object.keys(cityFilters).map((city) => (
                      <label key={city} className="flex cursor-pointer items-center group">
                        <div onClick={() => setCityFilters(prev => ({ ...prev, [city]: !prev[city] }))} className={`mr-4 flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border ${cityFilters[city] ? 'border-[#BA965B] bg-[#BA965B]' : 'border-black/20 group-hover:border-[#BA965B]'} transition-colors`}>
                          {cityFilters[city] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span onClick={() => setCityFilters(prev => ({ ...prev, [city]: !prev[city] }))} className={`${theme.formLabel} ${cityFilters[city] ? '!text-black' : '!text-black/50'} transition-colors`}>{city.toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </ScrollZoomIn>

              <div className="lg:col-span-3">
                <ScrollZoomIn>
                  <p className={`${theme.formLabel} mb-6`}>showing {uniqueArtists.length} of {sourceArtists.length} artists</p>
                </ScrollZoomIn>

                <div>
                  {uniqueArtists.length > 0 ? (
                    <>
                      <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                        {uniqueArtists.slice(0, visibleCount).map((artist, index) => (
                          <ScrollZoom key={artist.id || index} delay={index * 80}>
                            <ArtistCard 
                              name={artist.name} 
                              image={artist.image} 
                              hoverImage={artist.hoverImage} 
                              portfolioImages={artist.portfolio?.map((p: any) => typeof p === 'string' ? p : p?.image).filter(Boolean)} 
                              startingPrice={artist.startingPrice} 
                              tags={artist.tags} 
                              matchPercentage={aiTags.length > 0 ? artist.match : undefined} 
                              onClick={() => handleSelectArtist(artist)} 
                            />
                          </ScrollZoom>
                        ))}
                      </div>
                      {visibleCount < uniqueArtists.length && (
                        <ScrollZoomIn>
                          <div className="mt-16 flex justify-center">
                            <button type="button" onClick={() => setVisibleCount(prev => prev + 9)} className={theme.btnOutline}>load more artists</button>
                          </div>
                        </ScrollZoomIn>
                      )}
                    </>
                  ) : (
                    <ScrollZoomIn>
                      <div className={`flex min-h-[300px] flex-col items-center justify-center border ${theme.borderBase} bg-white px-6 text-center shadow-sm ${theme.cardRadius}`}>
                        <p className={theme.headingModal}>no artists found</p>
                        <p className={`mt-4 max-w-sm ${theme.bodyText}`}>adjust your budget or city filters</p>
                        <button type="button" onClick={() => { setMaxBudget(65000); setCityFilters({ 'Jubilee Hills': true, 'Banjara Hills': true, 'HITEC City': true, 'Madhapur': true, 'Gachibowli': true, 'Kondapur': true, 'Film Nagar': true, 'Kukatpally': true, 'Begumpet': true, 'Secunderabad': true }); setVisibleCount(9); }} className={`mt-8 ${theme.btnPrimary}`}>reset filters</button>
                      </div>
                    </ScrollZoomIn>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="standard" className="bg-[#F9EBE8] text-black py-24 sm:py-32 border-t border-black/5">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-end mb-24">
              <ScrollZoomIn className="lg:col-span-8">
                <p className={`${theme.eyebrow} mb-8`}>the canvas standard</p>
                <h2 className={theme.headingHero}>beauty is a <span className={theme.premiumTag}>point of view.</span></h2>
              </ScrollZoomIn>
              <ScrollZoomIn className="lg:col-span-4 pb-3" delay={150}>
                <p className={theme.bodyText}>canvas is a private directory, not an open marketplace. every artist on this platform has been rigorously vetted for their technical execution, kit hygiene, and distinct aesthetic vision.</p>
              </ScrollZoomIn>
            </div>
            <div className={`grid gap-12 border-t ${theme.borderBase} pt-12 sm:grid-cols-3`}>
              <ScrollZoomIn delay={0}>
                <div className="group cursor-default">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={theme.eyebrow}>curated talent</h3>
                    <p className={`${theme.stat} !text-black/20 transition-colors group-hover:!text-[#BA965B]`}>01</p>
                  </div>
                  <p className={theme.bodyText}><strong className="text-black font-bold">distinct hand, not a uniform finish.</strong> we reject cookie-cutter application, selecting artists exclusively for their unique ability to elevate natural features.</p>
                </div>
              </ScrollZoomIn>
              <ScrollZoomIn delay={120}>
                <div className="group cursor-default">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={theme.eyebrow}>the experience</h3>
                    <p className={`${theme.stat} !text-black/20 transition-colors group-hover:!text-[#BA965B]`}>02</p>
                  </div>
                  <p className={theme.bodyText}><strong className="text-black font-bold">care in the details and generosity.</strong> from high-end skin prep to impeccable kit hygiene, our standard for client comfort is non-negotiable.</p>
                </div>
              </ScrollZoomIn>
              <ScrollZoomIn delay={240}>
                <div className="group cursor-default">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={theme.eyebrow}>private network</h3>
                    <p className={`${theme.stat} !text-black/20 transition-colors group-hover:!text-[#BA965B]`}>03</p>
                  </div>
                  <p className={theme.bodyText}><strong className="text-black font-bold">the list is small so it means something.</strong> we prioritize strict quality over volume, eliminating the guesswork of endless scrolling.</p>
                </div>
              </ScrollZoomIn>
            </div>
          </div>
        </section>

        <section className="testimonials py-24 bg-[#FDF3F1]">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            <ScrollZoom>
              <div className={`flex items-center justify-center gap-3 ${theme.eyebrow} mb-3`}><span className="h-[1px] w-12 bg-black/10"></span>love from our users<span className="h-[1px] w-12 bg-black/10"></span></div>
              <h2 className={`${theme.headingSection} text-center mb-16`}>what people are saying</h2>
            </ScrollZoom>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ScrollZoomIn delay={0}>
                <div className={`bg-white/60 p-8 border ${theme.borderBase} ${theme.cardRadius} flex flex-col justify-between`}>
                  <div className="text-[#BA965B] mb-4">★★★★★</div>
                  <p className={`${theme.quote} mb-6`}>&quot;I uploaded a picture from Pinterest and Canvas found me an artist who had done almost the exact same look. Honestly shocked at how accurate the match was.&quot;</p>
                  <div className={`flex items-center gap-3 pt-4 border-t ${theme.borderBase}`}>
                    <div className="w-10 h-10 rounded-full bg-[#E8D5F2] text-[#2D1B4E] flex items-center justify-center font-bold text-xs">SR</div>
                    <div><div className={theme.formLabel}>sneha r.</div><div className={`${theme.formLabel} !text-black/40`}>bridal • jubilee hills</div></div>
                  </div>
                </div>
              </ScrollZoomIn>
              <ScrollZoomIn delay={120}>
                <div className={`bg-white/60 p-8 border ${theme.borderBase} ${theme.cardRadius} flex flex-col justify-between`}>
                  <div className="text-[#BA965B] mb-4">★★★★★</div>
                  <p className={`${theme.quote} mb-6`}>&quot;As a model, finding artists who understand editorial work is hard. Canvas filtered out the noise immediately. The match score is genuinely useful.&quot;</p>
                  <div className={`flex items-center gap-3 pt-4 border-t ${theme.borderBase}`}>
                    <div className="w-10 h-10 rounded-full bg-[#1A0B2E] text-[#C4A35A] flex items-center justify-center font-bold text-xs">KM</div>
                    <div><div className={theme.formLabel}>kavya m.</div><div className={`${theme.formLabel} !text-black/40`}>editorial • hitec city</div></div>
                  </div>
                </div>
              </ScrollZoomIn>
              <ScrollZoomIn delay={240}>
                <div className={`bg-white/60 p-8 border ${theme.borderBase} ${theme.cardRadius} flex flex-col justify-between`}>
                  <div className="text-[#BA965B] mb-4">★★★★★</div>
                  <p className={`${theme.quote} mb-6`}>&quot;Described the look in two lines, got artists who could do it sorted by price. Booked in ten minutes. This is exactly how it should work.&quot;</p>
                  <div className={`flex items-center gap-3 pt-4 border-t ${theme.borderBase}`}>
                    <div className="w-10 h-10 rounded-full bg-[#F5E6C8] text-[#2D1B4E] flex items-center justify-center font-bold text-xs">TP</div>
                    <div><div className={theme.formLabel}>tara p.</div><div className={`${theme.formLabel} !text-black/40`}>glam • gachibowli</div></div>
                  </div>
                </div>
              </ScrollZoomIn>
            </div>
          </div>
        </section>

        <ScrollZoomIn>
          <section className="bg-[#150A26] py-24 sm:py-32 px-5 border-t border-white/10 text-center">
            <div className="max-w-[800px] mx-auto">
              <div className={`flex items-center justify-center gap-3 ${theme.eyebrow} mb-3`}><span className="h-[1px] w-12 bg-white/20"></span>for makeup artists<span className="h-[1px] w-12 bg-white/20"></span></div>
              <h2 className={`${theme.headingHero} !text-white mb-8`}>are you a makeup artist?</h2>
              <p className={`${theme.bodyText} !text-white/70 mb-12 max-w-[680px] mx-auto`}>it is completely free to list your verified portfolio on canvas. when our ai matches you with a bride, you will receive a blurred notification. to unlock the client&apos;s whatsapp number and inspiration photo (a high-intent lead), you simply pay a micro-fee of ₹99. you can also upgrade to canvas pro for a flat monthly subscription to unlock unlimited leads and priority placement in our ai search results.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => window.alert('Canvas Pro features are launching soon! Create a free account today to get early access.')} 
                className={`${theme.btnOutline} !border-[#BA965B] !text-[#BA965B] hover:!bg-[#BA965B] hover:!text-white`}
              >
                explore pro features
              </button>
              <button 
                onClick={() => setAuthOpen(true)} 
                className={theme.btnPrimary}
              >
                apply to join canvas
              </button>
            </div>
            </div>
          </section>
        </ScrollZoomIn>

        <section id="journal" className="bg-[#0A0510] text-white mx-auto w-full px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="max-w-[1400px] mx-auto">
            <ScrollZoomIn>
              <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end mb-16">
                <div>
                  <p className={`${theme.eyebrow} mb-3`}>from the journal</p>
                  <h2 className={`${theme.headingHero} !text-white`}>from the <span className={theme.premiumTag}>journal.</span></h2>
                </div>
                <button type="button" onClick={() => window.alert('The journal is being written. Check back soon.')} className={`${theme.secondaryLink} border-b border-white/30 pb-1 !text-white`}>read all stories</button>
              </div>
            </ScrollZoomIn>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <ScrollZoom>
                <div className={`group relative min-h-[400px] overflow-hidden border border-white/10 bg-[#150A26] p-10 flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors ${theme.cardRadius}`}>
                  <ScrollZoomIn delay={150}>
                    <span className={theme.eyebrow}>perspective · 06 min read</span>
                    <div>
                      <h3 className={`${theme.headingModal} !text-white mt-4`}>on keeping your own face.</h3>
                      <p className={`${theme.bodyText} !text-white/60 mt-2`}>a conversation about recognition and restraint.</p>
                    </div>
                  </ScrollZoomIn>
                </div>
              </ScrollZoom>
              <div className="grid gap-6">
                <ScrollZoomIn delay={100}>
                  <div className={`group border border-white/10 bg-[#150A26] p-8 cursor-pointer hover:bg-white/5 transition-colors ${theme.cardRadius}`}>
                    <span className={theme.eyebrow}>ritual · 03 min read</span>
                    <h3 className={`${theme.headingModal} !text-white mt-4`}>a small ritual before the chair.</h3>
                  </div>
                </ScrollZoomIn>
                <ScrollZoomIn delay={200}>
                  <div className={`group border border-white/10 bg-[#150A26] p-8 cursor-pointer hover:bg-white/5 transition-colors ${theme.cardRadius}`}>
                    <span className={theme.eyebrow}>industry · 05 min read</span>
                    <h3 className={`${theme.headingModal} !text-white mt-4`}>the science of skin prep.</h3>
                  </div>
                </ScrollZoomIn>
              </div>
            </div>
          </div>
        </section>

        <ScrollZoomIn>
          <footer className={`bg-[#05020A] text-white px-5 py-16 sm:px-8 lg:px-12 border-t border-white/10 ${theme.fontBase}`}>
            <div className="mx-auto max-w-[1400px] grid gap-12 lg:grid-cols-4 lg:gap-8">
              <div className="lg:col-span-1">
                <h3 className={`${theme.formLabel} !text-white mb-4`}>down for more? we got you!</h3>
                <p className={`${theme.bodyText} !text-white/50 mb-6 leading-relaxed`}>the latest artists, drops, in-store event info + more—straight to your inbox.</p>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative border-b border-white/20 pb-2">
                    <input type="email" placeholder="email address" className={`w-full bg-transparent ${theme.inputText} !border-none !text-white`} />
                  </div>
                  <div className="relative border-b border-white/20 pb-2 mt-4">
                    <input type="tel" placeholder="phone number" className={`w-full bg-transparent ${theme.inputText} !border-none !text-white`} />
                  </div>
                </form>
              </div>
              <div className="lg:col-span-1 lg:pl-10">
                <h3 className={`${theme.formLabel} !text-white mb-6`}>client service</h3>
                <ul className={`space-y-3 ${theme.formLabel} !text-white/50`}>
                  <li><button className="hover:text-white transition-colors text-left">operating hours are from<br/>9am-9pm est mon-fri</button></li>
                  <li className="pt-2"><button className="hover:text-[#6B3C9C] transition-colors text-white">thecanvasbeauty@gmail.com</button></li>
                  <li><button className="hover:text-white transition-colors">1-800-canvas</button></li>
                  <li className="pt-4"><button className="hover:text-white transition-colors">contact us</button></li>
                  <li><button className="hover:text-white transition-colors">help & faqs</button></li>
                </ul>
              </div>
              <div className="lg:col-span-1">
                <h3 className={`${theme.formLabel} !text-white mb-6`}>about</h3>
                <ul className={`space-y-3 ${theme.formLabel} !text-white/50`}>
                  <li><button className="hover:text-white transition-colors">about the collective</button></li>
                  <li><button className="hover:text-white transition-colors">the standard</button></li>
                  <li><button className="hover:text-white transition-colors">careers</button></li>
                </ul>
              </div>
              <div className="lg:col-span-1 hidden lg:block">
                <ScrollZoom>
                  <div className={`h-full w-full bg-[#1A1A1A] border border-white/10 overflow-hidden ${theme.cardRadius}`}>
                    <img src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80" alt="Canvas" onError={handleImgError} className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-all duration-700" />
                  </div>
                </ScrollZoom>
              </div>
            </div>
          </footer>
        </ScrollZoomIn>
      </main>

      <ProfileModal open={Boolean(selectedArtist)} artist={selectedArtist} onClose={() => setSelectedArtist(null)} onBookAppointment={openBrief} onOpenChat={() => { setSelectedArtist(null); setIsChatOpen(true); }} />
      <ChatDrawer open={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {briefOpen && (
        <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${theme.fontBase}`} role="presentation" onClick={() => setBriefOpen(false)}>
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`bg-white border-l border-black/10 h-full w-full max-w-xl overflow-auto p-8 sm:p-12 flex flex-col shadow-2xl`} role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-black/10 pb-8 mb-8">
              <div><p className={`${theme.eyebrow} mb-2`}>{sent ? 'request secured' : 'private concierge'}</p><h2 className={theme.headingModal}>{sent ? 'appointment locked.' : 'request a booking.'}</h2></div>
              <button type="button" onClick={() => setBriefOpen(false)} className="text-black/40 hover:text-black transition-colors"><X size={24} strokeWidth={1.5} /></button>
            </div>
            {sent ? (
              <div className="flex-1 flex flex-col justify-center mb-20 text-center">
                <div className="w-16 h-16 rounded-full bg-[#BA965B]/10 text-[#BA965B] flex items-center justify-center mx-auto mb-6"><Sparkles size={32} /></div>
                <h3 className={`${theme.headingModal} mb-4`}>the artist has been notified.</h3>
                <p className={`${theme.bodyText} mb-10 max-w-md mx-auto`}>your brief is securely in the artist&apos;s queue. you will receive a notification in your dashboard once they review the logistics and confirm the slot.</p>
                <button type="button" onClick={() => { setBriefOpen(false); setTimeout(() => setSelectedArtist(null), 200); }} className={`w-full ${theme.btnPrimary}`}>return to directory</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {selectedArtist && (
                  <div className={`flex items-center gap-4 bg-black/5 border border-black/10 p-4 mb-10 ${theme.cardRadius}`}>
                    <img src={selectedArtist.image} alt={selectedArtist.name} onError={handleImgError} className="w-12 h-12 object-cover rounded-full border border-black/10" />
                    <div><p className={theme.formLabel}>requesting availability for</p><p className={`${theme.headingModal} !text-base mt-0.5`}>{selectedArtist.name}</p></div>
                  </div>
                )}
                <form className="space-y-8 flex-1 flex flex-col" onSubmit={handleBriefSubmit}>
                  <div className="grid grid-cols-2 gap-8">
                    <label className="block"><span className={theme.formLabel}>date required</span><input required type="date" name="date" className={`mt-3 w-full ${theme.inputText}`} /></label>
                    <label className="block"><span className={theme.formLabel}>preferred slot</span><select required name="slot" defaultValue="" className={`mt-3 w-full ${theme.inputText} [&>option]:bg-white`}><option value="" disabled>select phase...</option><option value="Morning (Before 12 PM)">slot 1: morning prep (before 12pm)</option><option value="Afternoon (12 PM - 4 PM)">slot 2: afternoon glam (12pm-4pm)</option><option value="Evening (After 4 PM)">slot 3: evening glam (after 4pm)</option></select></label>
                  </div>
                  <label className="block"><span className={theme.formLabel}>exact venue / area</span><input required name="location" placeholder="e.g. taj falaknuma palace" className={`mt-3 w-full ${theme.inputText}`} /></label>
                  <label className="block flex-1"><span className={theme.formLabel}>the vision (look details)</span><textarea required name="message" placeholder="describe the aesthetic, outfit colors, or specific requirements..." rows={4} className={`mt-3 w-full resize-none ${theme.inputText}`} /></label>
                  <div className="pt-6 mt-auto">
                    <button type="submit" disabled={isSubmitting} className={`w-full ${theme.btnPrimary} disabled:opacity-50`}>{isSubmitting ? 'processing...' : 'submit concierge brief'}</button>
                    <p className={`text-center ${theme.formLabel} mt-4`}>your brief is securely transmitted to the artist.</p>
                  </div>
                </form>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROUTER
// ==========================================
function Router({ session, styleVersion }: { session: Session | null; styleVersion: string }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/">
          <Home session={session} setAuthOpen={setAuthOpen} styleVersion={styleVersion} />
        </Route>
        <Route path="/dashboard">
          {() => <Dashboard session={session} />}
        </Route>
        <Route path="/beauty-demo">
          {() => <BeautyDemo setAuthOpen={setAuthOpen} />}
        </Route>
        <Route path="/artist/:id">
          {() => <BeautyDemo setAuthOpen={setAuthOpen} />}
        </Route>
        <Route component={NotFound} />
      </Switch>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </ErrorBoundary>
  );
}

// ==========================================
// APP ROOT
// ==========================================
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Still parsing for backwards compatibility with any remaining style queries,
  // but theme is now locked strictly to Option 4
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  useEffect(() => {
    const checkSession = async () => {
      const isOAuth = window.location.hash.includes('access_token=') || window.location.search.includes('code=');
      const { data: { session } } = await supabase.auth.getSession();
      
      setSession(session);
      
      if (!isOAuth) {
        setLoadingSession(false);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      const isOAuth = window.location.hash.includes('access_token=') || window.location.search.includes('code=');
      
      if (isOAuth) {
        if (event === 'SIGNED_IN') setLoadingSession(false);
      } else {
        setLoadingSession(false); 
      }
    });

    const fallbackTimer = setTimeout(() => setLoadingSession(false), 3000);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleGlobalSelectRole = async (selectedRole: 'client' | 'artist') => {
    if (!session?.user) return;
    setUpdatingRole(true);

    try {
      const { error } = await supabase.auth.updateUser({ data: { role: selectedRole } });
      if (error) throw error;
      
      const fullName = session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User';
      await supabase.from('profiles').upsert({ id: session.user.id, role: selectedRole, full_name: fullName });
      
      if (selectedRole === 'artist') {
        await supabase.from('artist_profiles').upsert({ id: session.user.id });
      }
      
      window.location.href = `/dashboard?style=${styleVersion}`;
    } catch (err: any) {
      window.alert(`Failed to switch role: ${err.message}`);
      setUpdatingRole(false);
    }
  };

  if (loadingSession) {
    return (
      <div className={`h-screen w-full bg-[#FDF3F1] flex items-center justify-center fixed inset-0 z-[9999] ${theme.fontBase}`}>
        <p className={`${theme.eyebrow} animate-pulse`}>authenticating...</p>
      </div>
    );
  }

  const userRole = session?.user?.user_metadata?.role;
  const needsRole = session && (!userRole || (userRole !== 'client' && userRole !== 'artist'));

  if (needsRole) {
    return (
      <div className={`h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#FDF3F1] fixed inset-0 z-[9999] ${theme.fontBase}`}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          onClick={() => !updatingRole && handleGlobalSelectRole('client')} 
          className="flex-1 relative bg-[#FDF3F1] text-black flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer group"
        >
          <div className="absolute inset-0 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1516975080661-46bfa2c281c7?auto=format&fit=crop&w=1200&q=80" alt="Client" className="w-full h-full object-cover opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700" />
          </div>
          <div className="relative z-10 text-center transform group-hover:-translate-y-2 transition-transform duration-700">
            <p className={`${theme.eyebrow} mb-6`}>for clients</p>
            <h2 className={`${theme.headingHero} mb-6`}>
              i am looking<br />for an artist
            </h2>
            <div className={theme.btnPrimary}>
              {updatingRole ? 'setting up...' : 'join as client'}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          onClick={() => !updatingRole && handleGlobalSelectRole('artist')} 
          className="flex-1 relative bg-[#05020A] text-white flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer group border-t md:border-t-0 md:border-l border-white/10"
        >
          <div className="absolute inset-0 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1522337360788-8b13fee7a3af?auto=format&fit=crop&w=1200&q=80" alt="Artist" className="w-full h-full object-cover opacity-0 group-hover:opacity-10 transition-opacity duration-700 grayscale" />
          </div>
          <div className="relative z-10 text-center transform group-hover:-translate-y-2 transition-transform duration-700">
            <p className={`${theme.eyebrow} mb-6`}>for professionals</p>
            <h2 className={`${theme.headingHero} !text-white mb-6`}>
              i am a<br />makeup artist
            </h2>
            <div className={theme.btnPrimary}>
              {updatingRole ? 'setting up...' : 'apply to roster'}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router session={session} styleVersion={styleVersion} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}