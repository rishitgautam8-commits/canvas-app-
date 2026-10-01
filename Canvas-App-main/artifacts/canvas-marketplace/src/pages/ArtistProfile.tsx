import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, MapPin, Clock, Calendar } from 'lucide-react';
import { getTheme } from '@/lib/theme';
import { BookingModal } from '@/components/BookingModal';
import {
  DEFAULT_ADDONS,
  SLOT_BLOCKING_STATUSES,
  getGoogleMapsLink,
  parseArtistAddons,
} from '@/lib/bookings';

export default function ArtistProfile({ setAuthOpen }: { setAuthOpen?: (v: boolean) => void }) {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Record<string, string[]>>({});

  const artistId = params?.id;

  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  useEffect(() => {
    async function fetchArtistData() {
      if (!artistId) return;

      const { data: artistData, error: artistError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', artistId)
        .single();

      if (artistError || !artistData) {
        setLoading(false);
        return;
      }
      
      setArtist(artistData);

      const { data: portfolioData } = await supabase
        .from('artist_portfolio')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (portfolioData) {
        setPortfolioItems(portfolioData);
      }

      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('event_date, time_slot')
        .eq('artist_id', artistId)
        .in('status', SLOT_BLOCKING_STATUSES);

      const slots: Record<string, string[]> = {};
      if (existingBookings) {
        existingBookings.forEach(booking => {
          if (!slots[booking.event_date]) slots[booking.event_date] = [];
          slots[booking.event_date].push(booking.time_slot);
        });
      }
      setBookedTimeSlots(slots);
      setLoading(false);
    }

    fetchArtistData();
  }, [artistId]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FDF3F1] flex items-center justify-center ${theme.fontBase}`}>
        <p className={`${theme.eyebrow} animate-pulse`}>loading artist profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className={`min-h-screen bg-[#FDF3F1] flex flex-col items-center justify-center p-6 text-center ${theme.fontBase}`}>
        <h2 className={`${theme.headingModal} mb-4`}>artist not found.</h2>
        <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={theme.btnPrimary}>
          back to directory
        </button>
      </div>
    );
  }

  const manuallyBlockedDates: string[] = Array.isArray(artist?.blocked_dates) ? artist.blocked_dates : [];
  
  // ── NEW CARD-BASED ADD-ON PARSING ──
  const rawAddons = Array.isArray(artist?.addons) ? artist.addons : [];
  
  const parsedAddons = rawAddons.map((addon: string) => {
    // Split the format "Skill Name (₹Price) | IMAGE: https..."
    const parts = addon.split('| IMAGE: ');
    const textPart = parts[0].trim();
    const image = parts.length > 1 ? parts[1].trim() : null;
    
    // Extract name and price
    const nameParts = textPart.split('(');
    const name = nameParts[0].trim();
    const price = nameParts.length > 1 ? nameParts[1].replace(')', '').trim() : '';

    return { name, price, image };
  });

  const parsedOptions = parseArtistAddons(artist?.addons);
  const addonOptions = parsedOptions.length > 0 ? parsedOptions : DEFAULT_ADDONS;

  return (
    <div className={`min-h-screen bg-[#FDF3F1] text-black pb-24 ${theme.fontBase}`}>
      <header className={`border-b ${theme.borderBase} bg-white/80 backdrop-blur-md px-6 py-6 sm:px-12 sticky top-0 z-50`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={`flex items-center gap-2 ${theme.navLink} !bg-transparent !border-none`}>
            <ArrowLeft size={14} /> back to directory
          </button>
          
          <div className="flex items-center gap-3">
            {artist?.is_verified && (
              <span className={theme.badge}>verified studio</span>
            )}
          </div>
        </div>
      </header>

      <section className={`bg-white/60 border-b ${theme.borderBase} py-16 px-6 sm:px-12`}>
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`relative h-24 w-24 sm:h-32 sm:w-32 bg-white flex items-center justify-center text-3xl font-light uppercase text-black/40 border-2 ${theme.borderBase} overflow-hidden shrink-0 rounded-full shadow-sm`}>
              {artist.avatar_url || artist.image ? (
                <img 
                  src={artist.avatar_url || artist.image} 
                  alt={artist.business_name} 
                  className="absolute inset-0 w-full h-full object-cover object-center scale-[1.15]" 
                />
              ) : (
                artist.business_name?.charAt(0) || 'a'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className={`${theme.headingHero} !text-3xl sm:!text-5xl !leading-tight !tracking-tight`}>{artist.business_name || 'artist studio'}</h1>
                {artist?.is_verified && (
                  <CheckCircle2 className="text-[#6B3A7D]" size={22} />
                )}
              </div>
              <p className={`flex items-center gap-4 ${theme.formLabel} !text-black/50 mb-4`}>
                <a
  href={getGoogleMapsLink(`${artist.area ? artist.area + ', ' : ''}${artist.city || 'India'}, India`)}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1 hover:text-[#9D7C3A] hover:underline transition-colors"
>
  <MapPin size={14}/> {artist.area ? `${artist.area}, ` : ''}{artist.city || 'india'}
</a>
                {artist.years_experience && <span className="flex items-center gap-1"><Clock size={14} /> {artist.years_experience} yrs experience</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {artist.category && artist.category.split(',').map((spec: string, i: number) => (
                  <span key={i} className={`${theme.formLabel} !text-black/60 bg-black/5 px-3 py-1 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>
                    {spec.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto">
            <div className="text-left md:text-right">
              <p className={`${theme.formLabel} mb-2`}>starting package</p>
              <p className={`${theme.stat} !text-3xl bg-gradient-to-r from-[#7A5C24] via-[#E2BE68] to-[#7A5C24] text-transparent bg-clip-text inline-block`}>₹{artist.starting_price?.toLocaleString() || '15,000'}</p>
            </div>
            <button 
              onClick={() => setShowBookingModal(true)} 
              className={`flex items-center justify-center gap-2 ${theme.btnPrimary} shadow-sm`}
            >
              <Calendar size={14} /> view availability & book
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="mb-12">
          <h2 className={`${theme.headingSection} mb-2`}>verified <span className={theme.premiumTag}>portfolio.</span></h2>
          <p className={theme.formLabel}>Real Client Work Showcasing Signature Aesthetic And Technical Execution.</p>
        </div>

        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioItems.map((item: any, i: number) => {
              const getWorkingImageUrl = () => {
                const raw = item.image_url || '';
                const filename = raw.split('/').pop();
                if (!filename) return raw;
                
                const { data } = supabase.storage
                  .from('portfolios')
                  .getPublicUrl(`portfolios/${artistId}/${filename}`);
                return data.publicUrl;
              };

              return (
                <div key={item.id} className="group cursor-pointer">
                  <div className={`relative overflow-hidden bg-white mb-4 border ${theme.borderBase} ${theme.cardRadius} shadow-sm aspect-[4/5] sm:aspect-[4/5]`}>
                    <img 
                      src={getWorkingImageUrl()} 
                      alt={`Look ${i + 1}`} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={theme.formLabel}>Look N°{String(i + 1).padStart(2, '0')}</span>
                      <button onClick={() => setShowBookingModal(true)} className={theme.secondaryLink}>Enquire Look ↗</button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.tags?.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-black/5 text-black/70 text-xs rounded-md font-medium border border-black/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`border border-dashed ${theme.borderBase} bg-white/40 p-12 text-center ${theme.cardRadius}`}>
            <p className={theme.bodyText}>No Portfolio Photos Uploaded Yet.</p>
          </div>
        )}

        {/* ── NEW COHESIVE ADD-ON CARDS GRID ── */}
        {parsedAddons.length > 0 && (
          <div className={`mt-20 pt-16 border-t ${theme.borderBase}`}>
            <div className="mb-10">
              <h2 className={`${theme.headingSection} mb-3`}>add-ons & <span className={theme.premiumTag}>upgrades.</span></h2>
              <p className={theme.formLabel}>Enhance Your Booking With Specialized Services.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl">
              {parsedAddons.map((addon: { name: string; price: string; image: string | null }, idx: number) => (
                <div key={idx} className={`bg-white border ${theme.borderBase} overflow-hidden shadow-sm flex flex-col ${theme.cardRadius}`}>
                  {addon.image && (
                    <div className={`relative w-full aspect-[4/5] border-b ${theme.borderBase} overflow-hidden bg-black/5`}>
                      <img src={addon.image} alt={addon.name} className="w-full h-full object-cover object-center" />
                    </div>
                  )}
                  <div className="p-5 flex items-center justify-between gap-4 bg-white">
                    <span className={`${theme.bodyText} font-medium`}>{addon.name}</span>
                    {addon.price && <span className={theme.badge}>{addon.price}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BookingModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        artistId={artistId as string}
        theme={theme}
        addonOptions={addonOptions}
        bookedTimeSlots={bookedTimeSlots}
        blockedDates={manuallyBlockedDates}
        onNeedAuth={() => setAuthOpen?.(true)}
        onBooked={(date, time) =>
          setBookedTimeSlots((prev) => ({ ...prev, [date]: [...(prev[date] || []), time] }))
        }
      />
    </div>
  );
}