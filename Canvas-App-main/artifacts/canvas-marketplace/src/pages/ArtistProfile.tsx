import { useEffect, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, MapPin, Clock, X, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { artistsData } from '@/Data/artistsData';
import { getTheme } from '@/lib/theme';

function getGoogleMapsLink(location: string) {
  const parts = location.split(',').map(p => p.trim());
  let cleanLocation = location;

  // OpenStreetMap returns massive strings with municipal filler that confuses Google Maps.
  // If it's a long string, we slice out the middle filler to keep only the Venue + City/Zip.
  if (parts.length > 6) {
    const specificVenue = parts.slice(0, 3); // Grabs Venue Name, Street, Neighborhood
    const cityStateZip = parts.slice(-4);    // Grabs City, State, Zip, Country
    cleanLocation = [...specificVenue, ...cityStateZip].join(', ');
  }

  // Uses the cleaned string to force an exact dropped pin/route
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanLocation)}`;
}

// Free venue address autocomplete using OpenStreetMap's Nominatim search API.
// No API key, no billing account — replaces react-google-autocomplete.
// Nominatim's usage policy caps public-instance traffic at ~1 request/sec,
// which the debounce below respects; fine for a project this size.
interface NominatimSuggestion {
  place_id: number;
  display_name: string;
}

function VenueAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          countrycodes: 'in',
          viewbox: '78.20,17.65,78.75,17.20', // Hyderabad bounding box — biases, doesn't restrict, results
          addressdetails: '0',
          limit: '5',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => value.trim() && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-black/40">Searching...</div>}
          {!loading &&
            suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => {
                  onChange(s.display_name);
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 border-b border-black/5 last:border-b-0"
              >
                {s.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const TIME_SLOTS = [
  { display: 'Early Morning (6:00 AM - 9:00 AM)', value: 'Early Morning (6:00 AM - 9:00 AM)', keyword: 'Early' },
  { display: 'Morning (9:00 AM - 2:00 PM)', value: 'Morning (9:00 AM - 2:00 PM)', keyword: 'Morning' },
  { display: 'Afternoon & Evening (2:00 PM - 8:00 PM)', value: 'Afternoon & Evening (2:00 PM - 8:00 PM)', keyword: 'Afternoon' },
  { display: 'Late Night (8:00 PM - 11:59 PM)', value: 'Late Night (8:00 PM - 11:59 PM)', keyword: 'Late' }
];

export default function ArtistProfile({ setAuthOpen }: { setAuthOpen?: (v: boolean) => void }) {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [venueAddress, setVenueAddress] = useState<string>('');
  const [lookDetails, setLookDetails] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

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

      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('event_date, time_slot')
        .eq('artist_id', artistId)
        .in('status', ['confirmed', 'pending']); 

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

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return window.alert("Please select a date and time.");
    if (!venueAddress.trim()) return window.alert("Please enter a venue address.");
    if (!lookDetails.trim()) return window.alert("Please describe the look you'd like.");
    setBookingLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      if (!user) {
        window.alert("Please log in as a client to book an artist.");
        setShowBookingModal(false);
        setBookingLoading(false);
        if (setAuthOpen) setAuthOpen(true);
        return;
      }

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.first_name || 'Client',
        role: 'client'
      }, { onConflict: 'id' });

      const payload = {
        artist_id: artistId,
        client_id: user.id,
        event_date: selectedDate,
        time_slot: selectedTime,
        venue_address: venueAddress.trim(),
        look_details: lookDetails.trim(),
        status: 'pending'
      };

      const { error } = await supabase.from('bookings').insert(payload);
      if (error) throw error;

      window.alert("Booking request sent successfully! The artist will confirm shortly.");
      setShowBookingModal(false);
      setBookedTimeSlots(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), selectedTime]
      }));
      setSelectedDate('');
      setSelectedTime('');
      setVenueAddress('');
      setLookDetails('');
    } catch (err: any) {
      window.alert(`Error booking: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

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

  const rawPortfolio = artist?.portfolio || [];
  const manuallyBlockedDates: string[] = Array.isArray(artist?.blocked_dates) ? artist.blocked_dates : [];
  const allImages = rawPortfolio.map((p: any) => typeof p === 'string' ? p : p?.image).filter(Boolean);
  if (allImages.length === 0 && artist?.image) allImages.push(artist.image);

  const makeupImages = allImages.filter((img: string) => !img.toLowerCase().includes('addon'));
  const addonImages = allImages.filter((img: string) => img.toLowerCase().includes('addon'));
  const hasAddonText = Array.isArray(artist?.addons) && artist?.addons.length > 0;
  const hasAddonImages = addonImages.length > 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const groupedDates = next30Days.reduce((acc, date) => {
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  return (
    <div className={`min-h-screen bg-[#FDF3F1] text-black pb-24 ${theme.fontBase}`}>
      <header className={`border-b ${theme.borderBase} bg-white/80 backdrop-blur-md px-6 py-6 sm:px-12 sticky top-0 z-50`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={`flex items-center gap-2 ${theme.navLink} !bg-transparent !border-none`}>
            <ArrowLeft size={14} /> back to directory
          </button>
          <div className="flex items-center gap-3">
            <span className={theme.badge}>verified studio</span>
          </div>
        </div>
      </header>

      <section className={`bg-white/60 border-b ${theme.borderBase} py-16 px-6 sm:px-12`}>
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`h-24 w-24 sm:h-32 sm:w-32 bg-black/10 flex items-center justify-center text-3xl font-light uppercase text-black/40 border ${theme.borderBase} overflow-hidden shrink-0 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>
              {artist.image ? (
                <img src={artist.image} alt={artist.business_name} className="h-full w-full object-cover" />
              ) : (
                artist.business_name?.charAt(0) || 'a'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className={`${theme.headingHero} !text-3xl sm:!text-5xl !leading-tight !tracking-tight`}>{artist.business_name || 'artist studio'}</h1>
                <CheckCircle2 className="text-[#6B3A7D]" size={22} />
              </div>
              <p className={`flex items-center gap-4 ${theme.formLabel} !text-black/50 mb-4`}>
                <a
                  href={getGoogleMapsLink(`${artist.city || 'Hyderabad'}, Hyderabad`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[#9D7C3A] hover:underline transition-colors"
                >
                  <MapPin size={14} /> {artist.city || 'hyderabad'}
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

        {makeupImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {makeupImages.map((img: string, i: number) => (
              <div key={i} className="group cursor-pointer">
                <div className={`relative overflow-hidden bg-white mb-4 border ${theme.borderBase} ${theme.cardRadius} shadow-sm`}>
                  <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme.formLabel}>Look N°{String(i + 1).padStart(2, '0')}</span>
                  <button onClick={() => setShowBookingModal(true)} className={theme.secondaryLink}>Enquire Look ↗</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`border border-dashed ${theme.borderBase} bg-white/40 p-12 text-center ${theme.cardRadius}`}>
            <p className={theme.bodyText}>No Portfolio Photos Uploaded Yet.</p>
          </div>
        )}

        {(hasAddonText || hasAddonImages) && (
          <div className={`mt-20 pt-16 border-t ${theme.borderBase}`}>
            <div className="flex flex-col lg:flex-row gap-16 lg:items-start">
              {hasAddonText && (
                <div className={`flex-1 ${!hasAddonImages ? 'max-w-3xl' : ''}`}>
                  <h2 className={`${theme.headingSection} mb-3`}>add-ons & <span className={theme.premiumTag}>upgrades.</span></h2>
                  <p className={`${theme.formLabel} mb-10`}>Enhance Your Booking With Specialized Services.</p>
                  
                  <div className="space-y-0">
                    {artist.addons.map((addon: string, idx: number) => {
                      if (typeof addon !== 'string') return null;
                      const parts = addon.split('(');
                      return (
                        <div key={idx} className={`flex items-center justify-between py-5 border-b ${theme.borderBase} last:border-0`}>
                          <span className={theme.bodyText}>{parts[0].trim()}</span>
                          {parts.length > 1 && <span className={theme.badge}>{parts[1].replace(')', '').trim()}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasAddonImages && (
                <div className={`w-full ${hasAddonText ? 'lg:w-1/2' : 'w-full'} flex gap-4 overflow-x-auto pb-4 custom-scrollbar`}>
                  {addonImages.map((img: string, i: number) => (
                    <div key={i} className="shrink-0 w-[280px]">
                      <img src={img} alt="Addon" className={`w-full aspect-[4/5] object-cover bg-white border ${theme.borderBase} ${theme.cardRadius}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showBookingModal && (
          <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 ${theme.fontBase}`} onClick={() => setShowBookingModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 15 }} 
              className={`bg-white border ${theme.borderBase} w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] ${theme.cardRadius}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-8 border-b ${theme.borderBase} flex justify-between items-center bg-white sticky top-0 ${theme.cardRadius === 'rounded-none' ? '' : 'rounded-t-2xl'}`}>
                <div>
                  <h3 className={theme.headingModal}>select date & time <span className={theme.premiumTag}>phase.</span></h3>
                  <p className={`${theme.bodyText} !text-xs mt-1`}>Highlighted Dates Are Unavailable Or Already Booked.</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="text-black/30 hover:text-black transition-colors"><X size={20} strokeWidth={1.5} /></button>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="max-h-[50vh] overflow-y-auto pr-4 mb-6 custom-scrollbar">
                  {Object.entries(groupedDates).map(([monthYear, dates]) => (
                    <div key={monthYear} className="mb-8">
                      <h3 className={`${theme.eyebrow} mb-4 pb-2 border-b ${theme.borderBase}`}>
                        {monthYear}
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {dates.map((d, i) => {
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          
                          const bookedForDate = bookedTimeSlots[dateStr] || [];
                          const bookedPhaseCount = TIME_SLOTS.filter(slot => bookedForDate.some(t => t?.includes(slot.keyword))).length;
                          const isBooked = bookedPhaseCount >= TIME_SLOTS.length;
                          const disabled = isBooked || manuallyBlockedDates.includes(dateStr);
                          const isSelected = selectedDate === dateStr;
                          
                          return (
                            <button
                              key={i}
                              disabled={disabled}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setSelectedTime('');
                              }}
                              className={`
                                flex flex-col items-center justify-center p-3 sm:p-4 border transition-all ${theme.cardRadius}
                                ${disabled ? 'cursor-not-allowed bg-[#B3503C]/10 border-[#B3503C]/30 line-through decoration-[#B3503C]/70' : 'cursor-pointer hover:border-black'}
                                ${isSelected ? 'border-black bg-black text-white' : disabled ? '' : `border-black/10 bg-white text-black`}
                              `}
                            >
                              <span className={`${theme.formLabel} !tracking-wider ${isSelected ? '!text-white/70' : disabled ? '!text-[#B3503C]/80' : '!text-black/50'}`}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className={`${theme.stat} !text-xl sm:!text-2xl mt-1 ${isSelected ? '!text-white' : disabled ? '!text-[#B3503C]' : ''}`}>
                                {d.getDate()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedDate && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`border-t ${theme.borderBase} pt-6`}>
                    <label className={`mb-4 block ${theme.formLabel}`}>Select Phase Of Day</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {TIME_SLOTS.map(slot => {
                        const isTimeBooked = bookedTimeSlots[selectedDate]?.some(t => t?.includes(slot.keyword));
                        
                        return (
                          <button
                            key={slot.value}
                            disabled={isTimeBooked}
                            onClick={() => setSelectedTime(slot.value)}
                            className={`py-4 ${theme.formLabel} !text-xs border ${theme.cardRadius} transition-all ${
                              isTimeBooked
                                ? 'bg-[#B3503C]/10 text-[#B3503C] border-[#B3503C]/30 cursor-not-allowed line-through decoration-[#B3503C]/70'
                                : selectedTime === slot.value 
                                  ? 'bg-black text-white border-black' 
                                  : `bg-transparent text-black ${theme.borderBase} hover:border-black`
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <label className={`mb-2 block ${theme.formLabel}`}>Venue Address</label>
                      <VenueAutocomplete
                        value={venueAddress}
                        onChange={setVenueAddress}
                        placeholder="Search Venue Address..."
                        className={`w-full ${theme.inputText}`}
                      />
                      {venueAddress.trim() && (
                        <a
                          href={getGoogleMapsLink(venueAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-2 inline-block ${theme.formLabel} !text-[#9D7C3A] hover:underline`}
                        >
                          View on Google Maps →
                        </a>
                      )}
                    </div>

                    <div className="mt-6">
                      <label className={`mb-2 block ${theme.formLabel}`}>Look Details</label>
                      <textarea
                        value={lookDetails}
                        onChange={(e) => setLookDetails(e.target.value)}
                        placeholder="Describe The Look You'd Like (Occasion, Style, References, Etc.)"
                        rows={3}
                        className={`w-full resize-none ${theme.inputText}`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className={`p-8 border-t ${theme.borderBase} bg-white sticky bottom-0 ${theme.cardRadius === 'rounded-none' ? '' : 'rounded-b-2xl'}`}>
                <button 
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || !selectedDate || !selectedTime || !venueAddress.trim() || !lookDetails.trim()}
                  className={`w-full ${theme.btnPrimary} disabled:opacity-50`}
                >
                  {bookingLoading 
                    ? 'Sending Request...' 
                    : (selectedDate && selectedTime && venueAddress.trim() && lookDetails.trim()) 
                      ? `Request Booking For ${new Date(selectedDate).toLocaleDateString()} — ${selectedTime.split(' (')[0]}`
                      : (selectedDate && selectedTime && venueAddress.trim())
                        ? 'Describe The Look To Continue'
                        : (selectedDate && selectedTime)
                          ? 'Enter A Venue Address To Continue'
                          : 'Select A Date & Phase To Continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}