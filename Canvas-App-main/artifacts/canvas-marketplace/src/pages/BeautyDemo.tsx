import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, MessageSquare, MapPin, Clock, X, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { artistsData } from '@/Data/artistsData';

// We added the setAuthOpen prop here so the component can trigger the login modal!
export default function ArtistProfile({ setAuthOpen }: { setAuthOpen?: (v: boolean) => void }) {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Calendar State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [manuallyBlockedDates, setManuallyBlockedDates] = useState<string[]>([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const artistId = params?.id;

  useEffect(() => {
    async function fetchArtistData() {
      if (!artistId) return;

      // 1. THE ILLUSION: Check if it's a mock static artist (ID doesn't contain a hyphen)
      const isMockId = !String(artistId).includes('-');

      if (isMockId) {
        // Silently load ALL the fake artist data into the real calendar UI
        const foundMock = artistsData.find((a: any) => String(a.id) === String(artistId));
        if (foundMock) {
          setArtist({
            business_name: foundMock.name,
            city: foundMock.location || foundMock.city || 'Hyderabad',
            years_experience: (foundMock as any).experience_years || 6,
            starting_price: parseInt(String(foundMock.startingPrice).replace(/[^0-9]/g, '')) || 25000,
            category: (foundMock.tags && foundMock.tags.join(', ')) || foundMock.category || 'Bridal & Wedding',
            
            // --- NEW: Pull in the missing rich data from the template ---
            image: foundMock.image,
            rating: foundMock.rating || 4.9,
            reviewsCount: foundMock.reviewsCount || foundMock.reviewCount || 125,
            bio: foundMock.bio || foundMock.signature || `Expert in Bridal styling. Available for bookings in ${foundMock.location || 'Hyderabad'}.`,
            
            portfolio: foundMock.portfolio || [foundMock.image],
            addons: foundMock.addons || [],
            blocked_dates: []
          });
          setBookedTimeSlots({}); // Fake artists have wide open calendars
          setLoading(false);
          return;
        }
      }

      // 2. THE REALITY: Fetch from Supabase for real registered artists
      const { data: artistData, error: artistError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', artistId)
        .single();

      if (artistError || !artistData) {
        console.error('Artist not found in database:', artistError?.message);
        setLoading(false);
        return;
      }
      
      setArtist(artistData);

      // Fetch real database bookings for double-booking prevention
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('artist_id', artistId)
        .in('status', ['confirmed', 'pending']); 

      const slots: Record<string, string[]> = {};
      if (existingBookings) {
        existingBookings.forEach(booking => {
          if (!slots[booking.booking_date]) {
            slots[booking.booking_date] = [];
          }
          slots[booking.booking_date].push(booking.booking_time);
        });
      }
      setBookedTimeSlots(slots);
      setLoading(false);
    }

    fetchArtistData();
  }, [artistId]);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return window.alert("Please select a date and time.");
    setBookingLoading(true);

    try {
      // Get the current logged-in user (the client)
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      if (!user) {
        window.alert("Please log in as a client to book an artist.");
        setShowBookingModal(false); // Closes the calendar modal
        setBookingLoading(false);   // Resets the loading state
        
        // This instantly pops the login modal over the CURRENT page instead of kicking them out
        if (setAuthOpen) {
          setAuthOpen(true);
        }
        return;
      }

      // Save the booking to the database
      const { error } = await supabase.from('bookings').insert({
        artist_id: artistId,
        client_id: user.id,
        booking_date: selectedDate,
        booking_time: selectedTime,
        status: 'pending' // Artist has to accept it on their dashboard
      });

      if (error) throw error;

      window.alert("Booking request sent successfully! The artist will confirm shortly.");
      setShowBookingModal(false);
      
      // Instantly gray out THIS specific time phase on the calendar 
      setBookedTimeSlots(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), selectedTime]
      }));
      
      setSelectedDate('');
      setSelectedTime('');

    } catch (err: any) {
      window.alert(`Error booking: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 animate-pulse">Loading Artist Profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-bold capitalize tracking-tight mb-4">Artist Not Found.</h2>
        <button onClick={() => setLocation('/')} className="border border-black bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Back to Directory
        </button>
      </div>
    );
  }

  // ==========================================
  // PORTFOLIO & ADD-ON SEPARATION
  // ==========================================
  const rawPortfolio = artist?.portfolio || [];
  const allImages = rawPortfolio.map((p: any) => typeof p === 'string' ? p : p?.image).filter(Boolean);
  if (allImages.length === 0 && artist?.image) allImages.push(artist.image);

  const makeupImages = allImages.filter((img: string) => !img.toLowerCase().includes('addon'));
  const addonImages = allImages.filter((img: string) => img.toLowerCase().includes('addon'));
  const hasAddonText = Array.isArray(artist?.addons) && artist?.addons.length > 0;
  const hasAddonImages = addonImages.length > 0;

  // ==========================================
  // SMART CALENDAR LOGIC (Grouped by Month)
  // ==========================================
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Sets time to strictly midnight so past dates are perfectly excluded

  const next30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group dates by Month & Year (e.g., "August 2026", "September 2026")
  const groupedDates = next30Days.reduce((acc, date) => {
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(date);
    return acc;
  }, {} as Record<string, Date[]>);


  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black pb-24">
      {/* HEADER NAV */}
      <header className="border-b border-black/10 bg-white px-6 py-6 sm:px-12 sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black">
            <ArrowLeft size={14} /> Back to Directory
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-black/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/70">Verified Studio</span>
          </div>
        </div>
      </header>

      {/* ARTIST HERO SECTION */}
      <section className="bg-white border-b border-black/10 py-16 px-6 sm:px-12">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-black/10 flex items-center justify-center text-3xl font-bold uppercase text-black/40 border border-black/10 overflow-hidden">
              {artist.business_name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-5xl font-bold capitalize tracking-tight">{artist.business_name || 'Artist Studio'}</h1>
                <CheckCircle2 className="text-[#B66CF2]" size={24} />
              </div>
              <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-black/50 mb-4">
                <span className="flex items-center gap-1"><MapPin size={14} /> {artist.city || 'Hyderabad'}</span>
                {artist.years_experience && <span className="flex items-center gap-1"><Clock size={14} /> {artist.years_experience} yrs experience</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {artist.category && artist.category.split(',').map((spec: string, i: number) => (
                  <span key={i} className="border border-black/20 bg-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black/70">
                    {spec.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto">
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Starting Package</p>
              <p className="text-3xl font-bold tracking-tight">₹{artist.starting_price?.toLocaleString() || '15,000'}</p>
            </div>
            <button 
              onClick={() => setShowBookingModal(true)} 
              className="flex items-center justify-center gap-2 border border-black bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#B66CF2] hover:border-[#B66CF2] transition-colors"
            >
              <Calendar size={14} /> View Availability & Book
            </button>
          </div>
        </div>
      </section>

      {/* PORTFOLIO GRID & ADD-ONS */}
      <main className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        
        {/* --- VERIFIED PORTFOLIO --- */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold capitalize tracking-tight mb-2">Verified Portfolio.</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Real client work showcasing signature aesthetic and technical execution.</p>
        </div>

        {makeupImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {makeupImages.map((img: string, i: number) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-[#F9F9F9] mb-4 border border-black/10 shadow-sm">
                  <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">Look 0{i + 1}</span>
                  <button onClick={() => setShowBookingModal(true)} className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#B66CF2] transition-colors">Enquire Look ↗</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-black/20 bg-white p-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">No portfolio photos uploaded yet.</p>
          </div>
        )}

        {/* --- ADD-ONS & UPGRADES --- */}
        {(hasAddonText || hasAddonImages) && (
          <div className="mt-20 pt-16 border-t border-black/10">
            <div className="flex flex-col lg:flex-row gap-16 lg:items-start">
              
              {hasAddonText && (
                <div className={`flex-1 ${!hasAddonImages ? 'max-w-3xl' : ''}`}>
                  <h2 className="text-3xl font-bold capitalize tracking-tight mb-4">Add-ons & Upgrades.</h2>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/50 mb-10 leading-relaxed">Enhance your booking with specialized services.</p>
                  
                  <div className="space-y-0">
                    {artist.addons.map((addon: string, idx: number) => {
                      if (typeof addon !== 'string') return null;
                      const parts = addon.split('(');
                      return (
                        <div key={idx} className="flex items-center justify-between py-5 border-b border-black/10 last:border-0">
                          <span className="text-sm font-bold uppercase tracking-widest">{parts[0].trim()}</span>
                          {parts.length > 1 && <span className="text-[10px] font-bold text-white tracking-[0.2em] bg-black px-3 py-1.5">{parts[1].replace(')', '').trim()}</span>}
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
                      <img src={img} alt="Addon" className="w-full aspect-[4/5] object-cover bg-[#F9F9F9] border border-black/10" />
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          </div>
        )}

      </main>

      {/* SMART BOOKING MODAL */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBookingModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className="bg-white border border-black/10 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" 
              onClick={(e) => e.stopPropagation()}
            >
              
              <div className="p-8 border-b border-black/10 flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h3 className="text-2xl font-bold capitalize tracking-tight">Select Date & Time.</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Gray dates are unavailable or already booked.</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="text-black/30 hover:text-black transition-colors"><X size={24} strokeWidth={1.5} /></button>
              </div>

              <div className="p-8 overflow-y-auto">
                {/* --- MONTH-GROUPED CALENDAR --- */}
                <div className="max-h-[50vh] overflow-y-auto pr-4 mb-6 custom-scrollbar">
                  {Object.entries(groupedDates).map(([monthYear, dates]) => (
                    <div key={monthYear} className="mb-8">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-black mb-4 pb-2 border-b border-black/10">
                        {monthYear}
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {dates.map((d, i) => {
                          // Format date strictly to YYYY-MM-DD to avoid timezone shifting
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          
                          const isBooked = bookedTimeSlots[dateStr]?.length >= 2;
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
                                flex flex-col items-center justify-center p-3 sm:p-4 border transition-all
                                ${disabled ? 'opacity-30 cursor-not-allowed bg-black/5 border-transparent line-through' : 'cursor-pointer hover:border-black'}
                                ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-black'}
                              `}
                            >
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className="text-xl sm:text-2xl font-bold mt-1">
                                {d.getDate()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SMART TIME SELECTOR */}
                {selectedDate && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-black/10 pt-6">
                    <label className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Select Phase of Day</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { display: 'First Half (Morning)', value: '09:00:00' },
                        { display: 'Second Half (Evening)', value: '15:00:00' }
                      ].map(slot => {
                        // Check if this specific phase is booked. 
                        const isTimeBooked = bookedTimeSlots[selectedDate]?.some(t => t.startsWith(slot.value.substring(0, 5)));
                        
                        return (
                          <button
                            key={slot.value}
                            disabled={isTimeBooked}
                            onClick={() => setSelectedTime(slot.value)}
                            className={`py-4 text-xs font-bold uppercase tracking-widest border transition-all ${
                              isTimeBooked
                                ? 'bg-black/5 text-black/20 border-transparent cursor-not-allowed line-through'
                                : selectedTime === slot.value 
                                  ? 'bg-black text-white border-black' 
                                  : 'bg-transparent text-black border-black/20 hover:border-black'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <div className="p-8 border-t border-black/10 bg-[#F9F9F9] sticky bottom-0">
                <button 
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || !selectedDate || !selectedTime}
                  className="w-full bg-black py-5 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {bookingLoading 
                    ? 'SENDING REQUEST...' 
                    : (selectedDate && selectedTime) 
                      ? `REQUEST BOOKING FOR ${new Date(selectedDate).toLocaleDateString()} — ${selectedTime === '09:00:00' ? 'FIRST HALF' : 'SECOND HALF'}` 
                      : 'SELECT A DATE & PHASE TO CONTINUE'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}