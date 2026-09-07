import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Premium } from '@/components/Premium';
import { ArrowLeft, CheckCircle2, MapPin, Clock, X, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { artistsData } from '@/Data/artistsData';
import Autocomplete from "react-google-autocomplete";

export default function ArtistProfile({ setAuthOpen }: { setAuthOpen?: (v: boolean) => void }) {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [manuallyBlockedDates] = useState<string[]>([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [venueAddress, setVenueAddress] = useState<string>('');
  const [lookDetails, setLookDetails] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const artistId = params?.id;

  useEffect(() => {
    async function fetchArtistData() {
      if (!artistId) return;
      const isMockId = !String(artistId).includes('-');

      if (isMockId) {
        const foundMock = artistsData.find((a: any) => String(a.id) === String(artistId));
        if (foundMock) {
          setArtist({
            business_name: foundMock.name,
            city: foundMock.location || foundMock.city || 'Hyderabad',
            years_experience: (foundMock as any).experience_years || 6,
            starting_price: parseInt(String(foundMock.startingPrice).replace(/[^0-9]/g, '')) || 25000,
            category: (foundMock.tags && foundMock.tags.join(', ')) || foundMock.category || 'Bridal & Wedding',
            image: foundMock.image,
            rating: foundMock.rating || 4.9,
            reviewsCount: foundMock.reviewsCount || foundMock.reviewCount || 125,
            bio: foundMock.bio || foundMock.signature || `Expert in Bridal styling. Available for bookings in ${foundMock.location || 'Hyderabad'}.`,
            portfolio: foundMock.portfolio || [foundMock.image],
            addons: foundMock.addons || [],
            blocked_dates: []
          });
          setBookedTimeSlots({});
          setLoading(false);
          return;
        }
      }

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

      const isMockId = !String(artistId).includes('-');
      if (isMockId) {
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
        setBookingLoading(false);
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
      <div className="min-h-screen bg-[#FDF3F1] flex items-center justify-center font-['Manrope']">
        <p className="text-[11px] font-medium lowercase tracking-[0.25em] text-[#BA965B] animate-pulse">loading artist profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#FDF3F1] flex flex-col items-center justify-center p-6 text-center font-['Manrope']">
        <h2 className="font-['Fraunces'] font-normal text-3xl lowercase tracking-tight mb-4">artist not found.</h2>
        <button onClick={() => setLocation('/')} className="bg-[#BA965B] text-white px-8 py-3.5 rounded-full font-['Manrope'] text-xs font-semibold lowercase tracking-[0.1em] hover:bg-black transition-colors">
          back to directory
        </button>
      </div>
    );
  }

  const rawPortfolio = artist?.portfolio || [];
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
    <div className="min-h-screen bg-[#FDF3F1] text-black pb-24 font-['Manrope']">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-md px-6 py-6 sm:px-12 sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-xs font-medium lowercase text-black/50 transition-colors hover:text-black">
            <ArrowLeft size={14} /> back to directory
          </button>
          <div className="flex items-center gap-3">
            <span className="font-['Manrope'] text-[10px] font-medium lowercase tracking-[0.15em] text-[#BA965B] border border-[#BA965B]/40 rounded-full px-3 py-1">verified studio</span>
          </div>
        </div>
      </header>

      <section className="bg-white/60 border-b border-black/10 py-16 px-6 sm:px-12">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-black/10 flex items-center justify-center text-3xl font-light uppercase text-black/40 border border-black/10 overflow-hidden shrink-0">
              {artist.image ? (
                <img src={artist.image} alt={artist.business_name} className="h-full w-full object-cover" />
              ) : (
                artist.business_name?.charAt(0) || 'a'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="font-['Fraunces'] font-light text-3xl sm:text-5xl lowercase tracking-tight text-black">{artist.business_name || 'artist studio'}</h1>
                <CheckCircle2 className="text-[#B66CF2]" size={22} />
              </div>
              <p className="flex items-center gap-4 text-xs font-light lowercase tracking-wider text-black/50 mb-4">
                <span className="flex items-center gap-1"><MapPin size={14} /> {artist.city || 'hyderabad'}</span>
                {artist.years_experience && <span className="flex items-center gap-1"><Clock size={14} /> {artist.years_experience} yrs experience</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {artist.category && artist.category.split(',').map((spec: string, i: number) => (
                  <span key={i} className="font-['Manrope'] text-[10px] font-medium lowercase tracking-[0.15em] text-black/60 bg-black/5 rounded-full px-3 py-1">
                    {spec.trim().toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto">
            <div className="text-left md:text-right">
              <p className="font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.25em] text-black/40">starting package</p>
              <p className="font-['Fraunces'] font-light text-3xl tracking-tight tabular-nums">₹{artist.starting_price?.toLocaleString() || '15,000'}</p>
            </div>
            <button 
              onClick={() => setShowBookingModal(true)} 
              className="flex items-center justify-center gap-2 bg-[#BA965B] text-white px-8 py-4 rounded-full font-['Manrope'] text-xs font-semibold lowercase tracking-[0.1em] hover:bg-black transition-colors shadow-sm"
            >
              <Calendar size={14} /> view availability & book
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="mb-12">
          <h2 className="font-['Fraunces'] italic font-light text-3xl sm:text-4xl text-[#BA965B] mb-2">verified <Premium>portfolio.</Premium></h2>
          <p className="font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.25em] text-black/40">real client work showcasing signature aesthetic and technical execution.</p>
        </div>

        {makeupImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {makeupImages.map((img: string, i: number) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-white mb-4 border border-black/10 rounded-2xl shadow-sm">
                  <img src={img} alt={`Look ${i + 1}`} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Manrope'] text-xs font-light lowercase text-black/50">look n°{String(i + 1).padStart(2, '0')}</span>
                  <button onClick={() => setShowBookingModal(true)} className="font-['Manrope'] text-xs font-medium lowercase text-[#BA965B] hover:text-black transition-colors">enquire look ↗</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-black/15 bg-white/40 p-12 text-center rounded-2xl">
            <p className="font-['Manrope'] text-xs font-light lowercase text-black/40">no portfolio photos uploaded yet.</p>
          </div>
        )}

        {(hasAddonText || hasAddonImages) && (
          <div className="mt-20 pt-16 border-t border-black/10">
            <div className="flex flex-col lg:flex-row gap-16 lg:items-start">
              {hasAddonText && (
                <div className={`flex-1 ${!hasAddonImages ? 'max-w-3xl' : ''}`}>
                  <h2 className="font-['Fraunces'] italic font-light text-3xl sm:text-4xl text-[#BA965B] mb-3">add-ons & <Premium>upgrades.</Premium></h2>
                  <p className="font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.25em] text-black/40 mb-10">enhance your booking with specialized services.</p>
                  
                  <div className="space-y-0">
                    {artist.addons.map((addon: string, idx: number) => {
                      if (typeof addon !== 'string') return null;
                      const parts = addon.split('(');
                      return (
                        <div key={idx} className="flex items-center justify-between py-5 border-b border-black/10 last:border-0">
                          <span className="font-['Manrope'] text-sm font-light lowercase tracking-wider text-black">{parts[0].trim().toLowerCase()}</span>
                          {parts.length > 1 && <span className="font-['Manrope'] text-[10px] font-semibold text-white tracking-widest bg-[#BA965B] px-3 py-1 rounded-full">{parts[1].replace(')', '').trim().toLowerCase()}</span>}
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
                      <img src={img} alt="Addon" className="w-full aspect-[4/5] object-cover bg-white border border-black/10 rounded-2xl" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-['Manrope']" onClick={() => setShowBookingModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 15 }} 
              className="bg-white border border-black/10 w-full max-w-2xl shadow-2xl rounded-2xl flex flex-col max-h-[90vh]" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-black/10 flex justify-between items-center bg-white rounded-t-2xl sticky top-0">
                <div>
                  <h3 className="font-['Fraunces'] font-normal text-2xl lowercase tracking-tight text-black">select date & time <Premium>phase.</Premium></h3>
                  <p className="font-['Manrope'] text-xs font-light lowercase text-black/40 mt-1">gray dates are unavailable or already booked.</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="text-black/30 hover:text-black transition-colors"><X size={20} strokeWidth={1.5} /></button>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="max-h-[50vh] overflow-y-auto pr-4 mb-6 custom-scrollbar">
                  {Object.entries(groupedDates).map(([monthYear, dates]) => (
                    <div key={monthYear} className="mb-8">
                      <h3 className="font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.25em] text-[#BA965B] mb-4 pb-2 border-b border-black/10">
                        {monthYear.toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {dates.map((d, i) => {
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
                                flex flex-col items-center justify-center p-3 sm:p-4 border transition-all rounded-xl
                                ${disabled ? 'opacity-30 cursor-not-allowed bg-black/5 border-transparent line-through' : 'cursor-pointer hover:border-black'}
                                ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-black'}
                              `}
                            >
                              <span className={`font-['Manrope'] text-[10px] font-medium lowercase tracking-wider ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}
                              </span>
                              <span className="font-['Fraunces'] font-light text-xl sm:text-2xl mt-1">
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-black/10 pt-6">
                    <label className="mb-4 block font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.15em] text-black/40">select phase of day</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { display: 'first half (morning)', value: 'Morning (Before 12 PM)', keyword: 'Morning' },
                        { display: 'second half (evening)', value: 'Evening (After 4 PM)', keyword: 'Evening' }
                      ].map(slot => {
                        const isTimeBooked = bookedTimeSlots[selectedDate]?.some(t => t?.includes(slot.keyword));
                        
                        return (
                          <button
                            key={slot.value}
                            disabled={isTimeBooked}
                            onClick={() => setSelectedTime(slot.value)}
                            className={`py-4 font-['Manrope'] text-xs font-semibold lowercase tracking-wider border rounded-full transition-all ${
                              isTimeBooked
                                ? 'bg-black/5 text-black/20 border-transparent cursor-not-allowed line-through'
                                : selectedTime === slot.value 
                                  ? 'bg-black text-white border-black' 
                                  : 'bg-transparent text-black border-black/15 hover:border-black'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <label className="mb-2 block font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.15em] text-black/40">venue address</label>
                      <Autocomplete
                        apiKey="YOUR_GOOGLE_MAPS_API_KEY"
                        onPlaceSelected={(place) => {
                          if (place?.formatted_address) {
                            setVenueAddress(place.formatted_address);
                          } else if (place?.name) {
                            setVenueAddress(place.name);
                          }
                        }}
                        defaultValue={venueAddress}
                        onChange={(e) => setVenueAddress((e.target as HTMLInputElement).value)}
                        placeholder="search exact venue on google maps..."
                        className="w-full font-['Manrope'] text-sm font-light text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B]"
                        options={{
                          types: ["establishment", "geocode"],
                          componentRestrictions: { country: "in" },
                        }}
                      />
                    </div>

                    <div className="mt-6">
                      <label className="mb-2 block font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.15em] text-black/40">look details</label>
                      <textarea
                        value={lookDetails}
                        onChange={(e) => setLookDetails(e.target.value)}
                        placeholder="describe the look you'd like (occasion, style, references, etc.)"
                        rows={3}
                        className="w-full font-['Manrope'] text-sm font-light text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B] resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-8 border-t border-black/10 bg-white rounded-b-2xl sticky bottom-0">
                <button 
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || !selectedDate || !selectedTime || !venueAddress.trim() || !lookDetails.trim()}
                  className="w-full bg-[#BA965B] text-white py-4 rounded-full font-['Manrope'] text-xs font-semibold lowercase tracking-[0.1em] hover:bg-black transition-colors disabled:opacity-50"
                >
                  {bookingLoading 
                    ? 'sending request...' 
                    : (selectedDate && selectedTime && venueAddress.trim() && lookDetails.trim()) 
                      ? `request booking for ${new Date(selectedDate).toLocaleDateString()} — ${selectedTime.includes('Morning') ? 'first half' : 'second half'}` 
                      : (selectedDate && selectedTime && venueAddress.trim())
                        ? 'describe the look to continue'
                        : (selectedDate && selectedTime)
                          ? 'enter a venue address to continue'
                          : 'select a date & phase to continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}