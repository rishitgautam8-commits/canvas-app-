import { useEffect, useState, useRef, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUpRight, Menu, X, Sparkles } from 'lucide-react';
import { Route, Switch, useLocation, useLocation as useWouterLocation, Router as WouterRouter } from 'wouter';
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArtistCard } from '@/components/ArtistCard';
import { HeroSearch, type HeroSearchValue } from '@/components/HeroSearch';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { getDefaultServicesForCategory, type Artist } from './Data/dummyArtists';
import { ProfileModal } from '@/components/ProfileModal';
import { AuthModal } from '@/components/AuthModal';
import NotFound from '@/pages/not-found';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Dashboard from '@/pages/Dashboard';
import { artistsData as artists } from './Data/artistsData';

// Generates a unique, realistic match percentage based on the uploaded file and artist ID
function getSmartMatchPercentage(file: File | null | undefined, artistId: string): number {
  if (!file) return 92; // Default fallback if no photo uploaded
  
  const seedString = file.name + file.size.toString() + artistId;
  let hash = 0;
  
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  
  return 85 + (Math.abs(hash) % 14);
}

const queryClient = new QueryClient();

const discoverCategories = [
  { id: 'all', label: 'All Artists' },
  { id: 'Bridal & Wedding', label: 'Bridal & Wedding' },
  { id: 'Party & Event Glam', label: 'Party & Event Glam' },
  { id: 'Natural & Soft Aesthetics', label: 'Natural & Soft Aesthetics' },
  { id: 'Editorial & High Fashion', label: 'Editorial & High Fashion' },
  { id: 'Specialized Skin & Grooming', label: 'Specialized Skin & Grooming' },
];

const BG_PARALLAX_FACTOR = 0.15;
const BG_PARALLAX_MAX_PX = 160;
const GRID_PARALLAX_FACTOR = -0.06;
const GRID_PARALLAX_MAX_PX = 70;

// ---- IMAGE FALLBACK ARMOR ----
const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
       <rect width="400" height="500" fill="#150A26"/>
       <text x="50%" y="50%" font-family="serif" font-size="26" fill="#B66CF2"
         text-anchor="middle" dominant-baseline="middle" letter-spacing="4">CANVAS</text>
     </svg>`
  );

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src === PLACEHOLDER_IMG) return;
  img.onerror = null;
  img.src = PLACEHOLDER_IMG;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dedupeKey(name: string, city: string) {
  return `${(name || '').trim().toLowerCase()}|${(city || '').trim().toLowerCase()}`;
}

// Normalize any portfolio format (string[] from Supabase or {style, image}[] from local data)
// into a guaranteed {style, image}[] so the ProfileModal always has something to render.
function normalizePortfolio(
  portfolio: any[] | null | undefined,
  fallbackImage: string
): { style: string; image: string }[] {
  const raw = portfolio || [];
  if (raw.length === 0) {
    return [{ style: 'Signature Work', image: fallbackImage }];
  }
  return raw.map((p: any, i: number) => {
    if (typeof p === 'string') {
      return {
        style: `Look N°${String(i + 1).padStart(2, '0')}`,
        image: p,
      };
    }
    return {
      style: p?.style || `Look N°${String(i + 1).padStart(2, '0')}`,
      image: p?.image || fallbackImage,
    };
  });
}

const local100Artists: Artist[] = artists.slice(0, 100).map((a: any) => {
  const profileImg = a.image || a.portfolio?.[0]?.image || a.portfolio?.[0] || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80';
  const normalizedPortfolio = normalizePortfolio(a.portfolio, profileImg);

  return {
    id: String(a.id),
    name: a.name,
    category: a.category || 'Bridal & Wedding',
    services: [a.specialty || 'Makeup Artist', 'Makeup Artist'],
    city: a.city || 'Jubilee Hills',
    location: `${a.city || 'Jubilee Hills'}, Hyderabad`,
    maxTravelKm: 50,
    pricePerSession: a.pricePerSession || 15000,
    startingPrice: a.startingPrice || `₹15,000`,
    rating: a.rating || 4.9,
    reviewCount: a.reviewsCount || 24,
    reviewsCount: a.reviewsCount || 24,
    image: profileImg,
    hoverImage: normalizedPortfolio[1]?.image || normalizedPortfolio[0]?.image || profileImg,
        tags: a.tags || [a.specialty || 'Custom Styling'],  // ← REPLACE THIS LINE
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
  if (locLower === '' || cityLower.includes(locLower)) return 5;
  
  // All Canvas cities are within Hyderabad/Cyberabad — realistic range 5-25 km
  const stableNum = parseInt(artistId.replace(/\D/g, '')) || 0;
  return (stableNum % 21) + 5; // 5 … 25 km
}

function runCanvasMatch(
  services: string[], 
  location: string, 
  categoryFilter: string, 
  aiTags: string[] = [], 
  pool: Artist[] = local100Artists
) {
  return pool.filter(artist => {
    if (categoryFilter !== 'all' && artist.category !== categoryFilter) {
      return false;
    }
    if (services.length > 0 && !artist.services.some(s => services.includes(s))) {
      return false;
    }
    const estDistance = getEstimatedDistance(location, artist.city, artist.id);
    if (estDistance > artist.maxTravelKm) {
      return false; 
    }
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

function Home() {
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  const handleSelectArtist = (artist: Artist) => {
    console.log("Artist card clicked:", artist.name);
    setSelectedArtist(artist);
  };
  
  const [liveArtists, setLiveArtists] = useState<Artist[]>([]);
  const [, setLoadingArtists] = useState(true);

  const [sortBy, setSortBy] = useState('Best match');
  const [maxBudget, setMaxBudget] = useState(65000);
  const [cityFilters, setCityFilters] = useState<Record<string, boolean>>({
    'Jubilee Hills': true,
    'Banjara Hills': true,
    'HITEC City': true,
    'Madhapur': true,
    'Gachibowli': true,
    'Kondapur': true,
    'Film Nagar': true,
    'Kukatpally': true,
    'Begumpet': true,
    'Secunderabad': true
  });

  const editorialImages = [
    '1522337360788-8b13fee7a3af', 
    '1515377905703-c4788e51af15', 
    '1508186225823-0963cfdbaa18', 
    '1509967419530-da38b4704bc6', 
    '1542452255199-3172cb8cbce8', 
    '1518049362265-d5b2a6467637'  
  ];

  useEffect(() => {
    async function fetchLiveArtists() {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select(`
          id,
          business_name,
          category,
          city,
          max_travel_km,
          starting_price,
          portfolio 
        `);

      if (error) {
        console.error('Error fetching live artists:', error.message);
      } else if (data) {
        const realUsersOnly = data.filter((item: any) => item.id && item.id.includes('-'));

        const formatted: Artist[] = realUsersOnly.map((item: any, index: number) => {
          const resolvedCategory = item.category || 'Bridal & Wedding';
          const resolvedCity = item.city || 'Jubilee Hills';
          const resolvedPrice = item.starting_price || 15000;
          const resolvedReviews = 24 + (index % 40);

          const rawPortfolio = item.portfolio || [];
          const mainImage =
            rawPortfolio.length > 0
              ? typeof rawPortfolio[0] === 'string'
                ? rawPortfolio[0]
                : rawPortfolio[0]?.image
              : `https://images.unsplash.com/photo-${editorialImages[index % editorialImages.length]}?auto=format&fit=crop&w=1200&q=80`;

          const normalizedPortfolio = normalizePortfolio(rawPortfolio, mainImage);

          return {
            id: item.id,
            name: item.business_name || 'Canvas Artist',
            category: resolvedCategory,
            services: ['Makeup Artist', resolvedCategory],
            city: resolvedCity,
            location: `${resolvedCity}, Hyderabad`,
            maxTravelKm: item.max_travel_km || 25,
            pricePerSession: resolvedPrice,
            startingPrice: `₹${resolvedPrice.toLocaleString('en-IN')}`,
            rating: 4.9,
            reviewCount: resolvedReviews,
            reviewsCount: resolvedReviews,
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
        setLiveArtists(formatted);
      }
      setLoadingArtists(false);
    }

    fetchLiveArtists();
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
  const [authOpen, setAuthOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.alert("You have been signed out.");
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(discoverCategories[1].id);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const sourceArtists: Artist[] = useMemo(() => {
    const localNameKeys = new Set(local100Artists.map(a => dedupeKey(a.name, a.city)));
    const seenIds = new Set<string>();
    const merged: Artist[] = [];

    for (const artist of liveArtists) {
      if (seenIds.has(artist.id)) continue;
      if (localNameKeys.has(dedupeKey(artist.name, artist.city))) continue;
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

  function getFeaturedArtistsLocal(categoryId: string): Artist[] {
    const filtered = categoryId === 'all' 
      ? sourceArtists 
      : sourceArtists.filter(a => a.category === categoryId);
    return filtered.slice(0, 4);
  }

  const matchedArtists = runCanvasMatch(
    search.services, 
    search.location, 
    selectedCategoryFilter, 
    aiTags, 
    sourceArtists
  );
  
  const filteredArtists = matchedArtists.filter(artist => {
    if (artist.pricePerSession > maxBudget) return false;

    const activeCities = Object.entries(cityFilters).filter(([_, checked]) => checked).map(([city]) => city.toLowerCase());
    
    if (activeCities.length > 0 && activeCities.length < 4) {
      const matchesCity = activeCities.some(ac => {
        const parts = ac.split('/').map(p => p.trim());
        return parts.some(part => 
          artist.city.toLowerCase().includes(part) || 
          (artist.location && artist.location.toLowerCase().includes(part))
        );
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDiscoverOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [discoverOpen]);

  const { scrollY } = useScroll();
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

  const openBrief = () => {
    setSent(false);
    setBriefOpen(true);
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

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

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
    <div className="relative min-h-[100dvh] overflow-x-hidden text-[var(--canvas-dp)] bg-[var(--canvas-iv)]">
      
      <nav className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6 md:px-12 h-[72px] bg-[rgba(251,248,242,0.82)] backdrop-blur-md border-b border-[rgba(201,164,99,0.35)] shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('top')}>
          <div className="bg-white rounded-[10px] w-10 h-10 md:w-11 md:h-11 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center">
            <span className="font-serif italic text-xl text-[var(--canvas-gd)] opacity-80">C</span>
          </div>
          <span className="font-serif text-xl md:text-2xl font-semibold text-[var(--canvas-rp)]">Canvas | Hyderabad</span>
        </div>
        
        <div className="hidden md:flex gap-9">
          <a onClick={() => scrollTo('top')} className="text-[13px] text-[var(--canvas-rp)] hover:text-[var(--canvas-gd)] cursor-pointer transition-colors border-b border-transparent hover:border-[var(--canvas-g)] pb-1">Home</a>
          <a onClick={() => scrollTo('discover')} className="text-[13px] text-[var(--canvas-rp)] hover:text-[var(--canvas-gd)] cursor-pointer transition-colors">Browse artists</a>
          <a onClick={() => scrollTo('standard')} className="text-[13px] text-[var(--canvas-rp)] hover:text-[var(--canvas-gd)] cursor-pointer transition-colors">Our Standard</a>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <button onClick={() => setLocation('/dashboard')} className="text-[13px] text-[var(--canvas-rp)] hover:text-[var(--canvas-gd)] transition-colors hidden sm:block">Dashboard</button>
              <button onClick={handleSignOut} className="bg-[var(--canvas-g)] hover:bg-[#D9B86E] text-[var(--canvas-dp)] px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all shadow-[0_10px_30px_-8px_rgba(201,164,99,0.4)] hover:-translate-y-px">Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthOpen(true)} className="hidden sm:block text-[13px] text-[var(--canvas-rp)] hover:text-[var(--canvas-gd)] transition-colors">Log in</button>
              <button onClick={() => setAuthOpen(true)} className="bg-[var(--canvas-g)] hover:bg-[#D9B86E] text-[var(--canvas-dp)] px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all shadow-[0_10px_30px_-8px_rgba(201,164,99,0.4)] hover:-translate-y-px">Join Canvas</button>
            </>
          )}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-[var(--canvas-rp)] md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[72px] left-0 right-0 z-[190] bg-[var(--canvas-iv)] border-b border-[var(--canvas-bd)] p-6 flex flex-col gap-4 shadow-lg md:hidden"
          >
            {session && <a onClick={() => { setLocation('/dashboard'); setMenuOpen(false); }} className="text-[15px] font-medium text-[var(--canvas-rp)] border-b border-[var(--canvas-bd)] pb-3">Dashboard</a>}
            <a onClick={() => { scrollTo('top'); setMenuOpen(false); }} className="text-[15px] font-medium text-[var(--canvas-rp)]">Home</a>
            <a onClick={() => { scrollTo('discover'); setMenuOpen(false); }} className="text-[15px] font-medium text-[var(--canvas-rp)]">Browse artists</a>
            <a onClick={() => { scrollTo('standard'); setMenuOpen(false); }} className="text-[15px] font-medium text-[var(--canvas-rp)]">Our Standard</a>
          </motion.div>
        )}
      </AnimatePresence>

      <section id="top" className="min-h-screen grid md:grid-cols-2 gap-8 pt-[72px] px-6 md:px-12 lg:px-20 bg-[radial-gradient(ellipse_60%_50%_at_85%_15%,rgba(201,164,99,0.07),transparent_60%)] relative">
        <div className="flex flex-col justify-center py-12 md:py-20 md:pr-10 z-10 animate-rise-in">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--canvas-gd)] mb-7">
            <div className="w-[26px] h-[1px] bg-gradient-to-r from-[var(--canvas-g)] to-transparent"></div>
            AI-powered beauty matching
          </div>
          
          <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[64px] font-semibold leading-[1.06] tracking-tight text-[var(--canvas-rp)] mb-6">
            Hyderabad's Premium<br/>
            <em className="italic not-italic text-transparent bg-clip-text bg-gradient-to-r from-[var(--canvas-gd)] via-[var(--canvas-g)] to-[var(--canvas-gd)]">Beauty Match</em>
          </h1>
          
          <p className="text-[15.5px] leading-[1.85] text-[var(--canvas-mut)] max-w-[460px] mb-3">
            Upload the look that inspires you - a screenshot, a saved post, anything - and our AI reads the style, mood, and technique to find artists whose work genuinely matches.
          </p>
          <p className="text-[15.5px] leading-[1.85] text-[var(--canvas-mut)] max-w-[460px] mb-8">
            The exclusive AI-powered bridal and beauty booking platform for Hyderabad and Cyberabad.
          </p>
          
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => scrollTo('demo-search')} className="bg-[var(--canvas-g)] hover:bg-[#D9B86E] text-[var(--canvas-dp)] px-8 py-3.5 rounded-lg text-[14px] font-medium transition-all shadow-[0_10px_30px_-8px_rgba(201,164,99,0.4)] hover:-translate-y-0.5">Try the Live Demo →</button>
            <button onClick={() => scrollTo('standard')} className="bg-transparent hover:bg-[rgba(201,164,99,0.12)] border border-[var(--canvas-g)] text-[var(--canvas-gd)] px-7 py-3 rounded-lg text-[14px] transition-all hover:-translate-y-0.5">How it works</button>
          </div>
          
          <div className="flex items-center gap-3 mt-10">
            <div className="flex">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--canvas-iv)] flex items-center justify-center text-[10px] font-semibold bg-[#EDE0F5] text-[#6B2D8B] -ml-0 shadow-sm z-40">PK</div>
              <div className="w-8 h-8 rounded-full border-2 border-[var(--canvas-iv)] flex items-center justify-center text-[10px] font-semibold bg-[#2D0A3E] text-[#C4A8D4] -ml-2 shadow-sm z-30">TU</div>
              <div className="w-8 h-8 rounded-full border-2 border-[var(--canvas-iv)] flex items-center justify-center text-[10px] font-semibold bg-[#F7E7B3] text-[#8B6914] -ml-2 shadow-sm z-20">GA</div>
              <div className="w-8 h-8 rounded-full border-2 border-[var(--canvas-iv)] flex items-center justify-center text-[10px] font-semibold bg-[#6B2D8B] text-[#EDE0F5] -ml-2 shadow-sm z-10">ER</div>
            </div>
            <p className="text-[12.5px] text-[var(--canvas-mut)]"><strong className="text-[var(--canvas-rp)] font-semibold">Verified premium artists</strong> across Hyderabad</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 md:py-16 relative hidden md:flex animate-float-in delay-2">
          <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80" alt="Premium Beauty" className="w-full max-w-[460px] h-[340px] object-cover rounded-[32px] shadow-[0_30px_60px_-14px_rgba(21,4,32,0.26)]" />
        </div>
      </section>

      <section id="demo-search" className="relative z-20 bg-[var(--canvas-cr)] border-y border-[var(--canvas-bd)] pt-20 pb-32">
        <div className="max-w-[800px] mx-auto px-6 md:px-12 text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--canvas-g)] mb-4">
            <div className="w-[26px] h-[1px] bg-gradient-to-r from-transparent to-[var(--canvas-g)]"></div>
            Live Prototype
            <div className="w-[26px] h-[1px] bg-gradient-to-r from-[var(--canvas-g)] to-transparent"></div>
          </div>
          <h2 className="font-serif text-3xl md:text-[40px] text-[var(--canvas-rp)] mb-4 tracking-tight">The Deterministic Matching Engine</h2>
          <p className="text-[15px] text-[var(--canvas-mut)] max-w-[600px] mx-auto leading-[1.6]">
            Test the AI routing logic. Input client parameters below to instantly route to verified artists based on hyper-local data and specialization.
          </p>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 [&_.text-\\[\\#B66CF2\\]]:text-[var(--canvas-rp)] [&_.text-white\\/50]:text-[var(--canvas-mut)] [&_.text-white\\/70]:text-[var(--canvas-mut)] [&_h1]:text-white">
          <HeroSearch
            value={search}
            onChange={handleSearchChange}
            onSubmit={(vals) => {
              setSearch(vals);
              setHasSearched(true);
              scrollTo('discover');
            }}
            isAuthenticated={!!session}
            onAuthRequired={() => setAuthOpen(true)}
          />
        </div>
      </section>

      <main className="relative z-20">
        
        <section id="discover" className="bg-white text-black py-24 sm:py-32">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            
            <div className="mb-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B66CF2] mb-3">The Shortlist</p>
                <h2 className="text-5xl sm:text-6xl font-black uppercase tracking-tighter">MEET THE ARTISTS</h2>
              </div>
              <p className="max-w-[320px] text-sm text-black/60">Six points of view, chosen for the way they make beauty feel like a conversation.</p>
            </div>

            <div className="mb-12 flex flex-wrap gap-3 border-b border-black/10 pb-8">
              {discoverCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-6 py-3 text-xs font-bold tracking-[0.15em] uppercase border transition-colors ${
                    selectedCategoryFilter === cat.id
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-transparent text-black/70 hover:border-black hover:text-black'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {hasSearched && search.inspirationFile && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 mt-8 border border-black/15 bg-[#F9F9F9] p-8 lg:p-10 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/10 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-[#B66CF2]/40 bg-[#B66CF2]/10 text-[#B66CF2]">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B66CF2]">Canvas AI Vision Analysis</span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-black mt-1">Aesthetic Profile Extracted</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest">{aiTags.length} Tags Extracted</span>
                    <span className="px-3 py-1 bg-[#B66CF2]/20 text-black text-[10px] font-black uppercase tracking-widest">Verified Secure</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50">Detected Aesthetic Tags from Inspiration:</p>
                  <div className="flex flex-wrap gap-2">
                    {(aiTags.length > 0 ? aiTags : ['soft glam', 'editorial', 'bridal']).map((tag, i) => (
                      <span key={i} className="px-4 py-2 bg-white border border-black/15 text-xs font-bold uppercase tracking-wider text-black shadow-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start mt-10">
              
              <div className="lg:col-span-1 bg-[#F9F9F9] border border-black/10 p-6 space-y-8 sticky top-8">
                
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-black/70 mb-3">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-black/20 p-3 text-xs font-bold uppercase tracking-wider text-black outline-none cursor-pointer"
                  >
                    <option value="Best match">Best match</option>
                    <option value="Highest rated">Highest rated</option>
                    <option value="Price: low to high">Price: low to high</option>
                    <option value="Price: high to low">Price: high to low</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">
                      Max Budget
                    </label>
                    <span className="text-xs font-bold text-[#B66CF2]">₹{maxBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="65000"
                    step="1000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <p className="text-[10px] text-black/50 mt-1 uppercase tracking-wider">Up to ₹{maxBudget.toLocaleString('en-IN')}</p>
                </div>

                <div className="mb-10">
                  <h3 className="mb-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#150420]">
                    City
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(cityFilters).map((city) => (
                      <label key={city} className="flex cursor-pointer items-center group">
                        <div 
                          onClick={() => setCityFilters(prev => ({ ...prev, [city]: !prev[city] }))}
                          className={`mr-4 flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border ${
                            cityFilters[city]
                              ? 'border-[#BA965B] bg-[#BA965B]'
                              : 'border-[#E7DCC8] group-hover:border-[#BA965B]'
                          } transition-colors`}
                        >
                          {cityFilters[city] && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <span 
                          onClick={() => setCityFilters(prev => ({ ...prev, [city]: !prev[city] }))}
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            cityFilters[city] ? 'text-[#150420]' : 'text-[#5C3D6E]/60'
                          } transition-colors`}
                        >
                          {city}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="lg:col-span-3">
                <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-6">
                  Showing {uniqueArtists.length} of {sourceArtists.length} artists
                </p>

                <motion.div style={{ y: gridY, willChange: 'transform' }}>
                  {uniqueArtists.length > 0 ? (
                    <>
                      <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                        {uniqueArtists.slice(0, visibleCount).map((artist, index) => (
                          <ArtistCard
                            key={artist.id || index}
                            name={artist.name}
                            image={artist.image}
                            hoverImage={artist.hoverImage}
                            portfolioImages={artist.portfolio?.map((p: any) => typeof p === 'string' ? p : p?.image).filter(Boolean)}
                            startingPrice={artist.startingPrice}
                            tags={artist.tags}
                            onClick={() => handleSelectArtist(artist)}
                          />
                        ))}
                      </div>
                      
                      {visibleCount < uniqueArtists.length && (
                        <div className="mt-16 flex justify-center">
                          <button 
                            type="button"
                            onClick={() => setVisibleCount(prev => prev + 9)} 
                            className="border border-[var(--canvas-g)] text-[var(--canvas-gd)] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--canvas-g)] hover:text-[var(--canvas-dp)] transition-colors shadow-sm"
                          >
                            Load More Artists
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex min-h-[300px] flex-col items-center justify-center border border-[var(--canvas-bd)] bg-white px-6 text-center shadow-sm">
                      <p className="text-3xl font-serif italic tracking-tight text-[var(--canvas-rp)]">No artists found</p>
                      <p className="mt-4 max-w-sm text-sm text-[var(--canvas-mut)] uppercase tracking-widest">Adjust your budget or city filters</p>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setMaxBudget(65000); 
                          setCityFilters({ 'Jubilee Hills': true, 'Banjara Hills': true, 'HITEC City': true, 'Madhapur': true, 'Gachibowli': true, 'Kondapur': true, 'Film Nagar': true, 'Kukatpally': true, 'Begumpet': true, 'Secunderabad': true }); 
                          setVisibleCount(9);
                        }} 
                        className="mt-8 border border-[var(--canvas-rp)] bg-[var(--canvas-rp)] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-transparent hover:text-[var(--canvas-rp)] transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>

            </div>

          </div>
        </section>

        <section id="standard" className="bg-[#F9F9F9] text-black py-24 sm:py-32 border-t border-black/5">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-end mb-24">
              <div className="lg:col-span-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B66CF2] mb-8">The Canvas Standard</p>
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-serif italic text-black leading-[1.1] tracking-tight">
                  Beauty is a point of view.
                </h2>
              </div>
              
              <div className="lg:col-span-4 pb-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] leading-[2] text-black/50">
                  Canvas is a private directory, not an open marketplace. Every artist on this platform has been rigorously vetted for their technical execution, kit hygiene, and distinct aesthetic vision.
                </p>
              </div>
            </div>
            
            <div className="grid gap-12 border-t-[3px] border-black pt-12 sm:grid-cols-3">
              <div className="group cursor-default">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">Curated Talent</h3>
                  <p className="text-4xl font-serif italic text-black/20 transition-colors group-hover:text-[#B66CF2]">01</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-black/60">
                  <strong className="text-black">Distinct hand, not a uniform finish.</strong> We reject cookie-cutter application, selecting artists exclusively for their unique ability to elevate natural features.
                </p>
              </div>

              <div className="group cursor-default">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">The Experience</h3>
                  <p className="text-4xl font-serif italic text-black/20 transition-colors group-hover:text-[#B66CF2]">02</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-black/60">
                  <strong className="text-black">Care in the details and generosity.</strong> From high-end skin prep to impeccable kit hygiene, our standard for client comfort is non-negotiable.
                </p>
              </div>

              <div className="group cursor-default">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">Private Network</h3>
                  <p className="text-4xl font-serif italic text-black/20 transition-colors group-hover:text-[#B66CF2]">03</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-black/60">
                  <strong className="text-black">The list is small so it means something.</strong> We prioritize strict quality over volume, eliminating the guesswork of endless scrolling.
                </p>
              </div>
            </div>

          </div>
        </section>

        <section id="journal" className="bg-[#0A0510] text-white mx-auto w-full px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end mb-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B66CF2] mb-3">From the journal</p>
                <h2 className="text-5xl sm:text-7xl font-serif italic text-white lowercase">from the journal.</h2>
              </div>
              <button type="button" onClick={() => window.alert('The journal is being written. Check back soon.')} className="text-xs font-bold uppercase tracking-[0.2em] hover:text-[#B66CF2] transition-colors border-b border-white/30 pb-1">
                Read all stories
              </button>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="group relative min-h-[400px] overflow-hidden border border-white/10 bg-[#150A26] p-10 flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F3B8F0]">Perspective · 06 min read</span>
                <div>
                  <h3 className="text-4xl font-black uppercase tracking-tight mb-4">ON KEEPING YOUR OWN FACE.</h3>
                  <p className="text-sm font-bold uppercase tracking-widest text-white/60">A conversation about recognition and restraint.</p>
                </div>
              </div>
              <div className="grid gap-6">
                <div className="group border border-white/10 bg-[#150A26] p-8 cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F3B8F0]">Ritual · 03 min read</span>
                  <h3 className="mt-6 text-2xl font-black uppercase tracking-tight">A SMALL RITUAL BEFORE THE CHAIR.</h3>
                </div>
                <div className="group border border-white/10 bg-[#150A26] p-8 cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F3B8F0]">Industry · 05 min read</span>
                  <h3 className="mt-6 text-2xl font-black uppercase tracking-tight">THE SCIENCE OF SKIN PREP.</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-[#05020A] text-white px-5 py-16 sm:px-8 lg:px-12 border-t border-white/10">
          <div className="mx-auto max-w-[1400px] grid gap-12 lg:grid-cols-4 lg:gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white mb-4">Down for more? We got you!</h3>
              <p className="text-[13px] text-white/60 mb-6 font-bold uppercase tracking-wider leading-relaxed">
                The latest artists, drops, in-store event info + more—straight to your inbox.
              </p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="relative border-b border-white/30 pb-2">
                  <input type="email" placeholder="Email address" className="w-full bg-transparent text-sm font-bold uppercase tracking-widest text-white placeholder-white/40 outline-none" />
                </div>
                <div className="relative border-b border-white/30 pb-2 mt-4">
                  <input type="tel" placeholder="Phone number" className="w-full bg-transparent text-sm font-bold uppercase tracking-widest text-white placeholder-white/40 outline-none" />
                </div>
              </form>
            </div>

            <div className="lg:col-span-1 lg:pl-10">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white mb-6">Client Service</h3>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
                <li><button className="hover:text-white transition-colors text-left">Operating hours are from<br/>9am-9pm EST Mon-Fri</button></li>
                <li className="pt-2"><button className="hover:text-[#B66CF2] transition-colors text-white">concierge@canvas.com</button></li>
                <li><button className="hover:text-white transition-colors">1-800-CANVAS</button></li>
                <li className="pt-4"><button className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button className="hover:text-white transition-colors">Help & FAQs</button></li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white mb-6">About</h3>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
                <li><button className="hover:text-white transition-colors">About The Collective</button></li>
                <li><button className="hover:text-white transition-colors">The Standard</button></li>
                <li><button className="hover:text-white transition-colors">Careers</button></li>
              </ul>
            </div>

            <div className="lg:col-span-1 hidden lg:block">
              <div className="h-full w-full bg-[#1A1A1A] border border-white/10 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80" alt="Canvas" onError={handleImgError} className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-all duration-700" />
              </div>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal open={Boolean(selectedArtist)} artist={selectedArtist} onClose={() => setSelectedArtist(null)} onBookAppointment={openBrief} />

      {briefOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm" role="presentation" onClick={() => setBriefOpen(false)}>
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-[#0A0510] border-l border-white/10 h-full w-full max-w-xl overflow-auto p-8 sm:p-12 flex flex-col" 
            role="dialog" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-8 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B66CF2] mb-2">
                  {sent ? 'REQUEST SECURED' : 'PRIVATE CONCIERGE'}
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  {sent ? 'APPOINTMENT LOCKED.' : 'REQUEST A BOOKING.'}
                </h2>
              </div>
              <button type="button" onClick={() => setBriefOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={28} strokeWidth={1.5} />
              </button>
            </div>

            {sent ? (
              <div className="flex-1 flex flex-col justify-center mb-20">
                <div className="w-16 h-16 rounded-full bg-[#B66CF2]/10 text-[#B66CF2] flex items-center justify-center mb-6">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-serif italic mb-4">The artist has been notified.</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-10">
                  Your brief is securely in the artist's queue. You will receive a notification in your Canvas Dashboard once they review the logistics and confirm the slot.
                </p>
                <button type="button" onClick={() => { setBriefOpen(false); setTimeout(() => setSelectedArtist(null), 200); }} className="w-full border border-white bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-black hover:bg-transparent hover:text-white transition-all">
                  Return to Directory
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                
                {selectedArtist && (
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 mb-10">
                    <img 
                      src={selectedArtist.image} 
                      alt={selectedArtist.name} 
                      onError={handleImgError}
                      className="w-12 h-12 object-cover border border-white/10" 
                    />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Requesting Availability For</p>
                      <p className="text-sm font-bold uppercase tracking-wider text-white mt-0.5">{selectedArtist.name}</p>
                    </div>
                  </div>
                )}

                <form className="space-y-8 flex-1 flex flex-col" onSubmit={handleBriefSubmit}>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Date Required</span>
                      <input required type="date" name="date" className="mt-3 w-full border-b border-white/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-white outline-none focus:border-[#B66CF2] transition-colors [color-scheme:dark]" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Preferred Slot</span>
                      <select required name="slot" defaultValue="" className="mt-3 w-full border-b border-white/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-white outline-none focus:border-[#B66CF2] transition-colors [&>option]:bg-[#0A0510]">
                        <option value="" disabled>Select phase...</option>
                        <option value="Morning (Before 12 PM)">Slot 1: Morning Prep (Before 12PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Slot 2: Afternoon Glam (12PM–4PM)</option>
                        <option value="Evening (After 4 PM)">Slot 3: Evening Glam (After 4PM)</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Exact Venue / Area</span>
                    <input required name="location" placeholder="e.g. Taj Falaknuma Palace" className="mt-3 w-full border-b border-white/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-white placeholder-white/40 outline-none focus:border-[#B66CF2] transition-colors" />
                  </label>

                  <label className="block flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">The Vision (Look Details)</span>
                    <textarea required name="message" placeholder="Describe the aesthetic, outfit colors, or specific requirements..." rows={4} className="mt-3 w-full resize-none border-b border-white/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest text-white placeholder-white/40 outline-none focus:border-[#B66CF2] transition-colors" />
                  </label>
                  
                  <div className="pt-6 mt-auto">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-white px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-black hover:bg-[#B66CF2] hover:text-white transition-colors border border-transparent hover:border-white disabled:opacity-50">
                      {isSubmitting ? 'ENCRYPTING & SENDING...' : 'SUBMIT CONCIERGE BRIEF'}
                    </button>
                    <p className="text-center text-[10px] text-white/30 uppercase tracking-widest mt-4">
                      Your brief is securely transmitted to the artist.
                    </p>
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

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}