import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, MessageSquare, MapPin, Clock, X, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ArtistProfile() {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Calendar State
  // Booking Calendar State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [manuallyBlockedDates, setManuallyBlockedDates] = useState<string[]>([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const artistId = params?.id;

  useEffect(() => {
    async function fetchArtistAndBookings() {
      if (!artistId) return;
      
      // 1. Fetch the Artist Data (to get their manual vacation days)
      const { data: artistData, error: artistError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', artistId)
        .single();

      if (artistError) {
        console.error('Error fetching artist:', artistError.message);
        setLoading(false);
        return;
      }
      
      setArtist(artistData);
      setManuallyBlockedDates(artistData.blocked_dates || []); // Only manual vacation days go here

      // 2. Fetch all existing bookings (to block SPECIFIC times)
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('artist_id', artistId)
        .in('status', ['confirmed', 'pending']); 

      // Group booked times by their specific dates automatically!
      const slots: Record<string, string[]> = {};
      if (existingBookings) {
        existingBookings.forEach(booking => {
          if (!slots[booking.booking_date]) {
            slots[booking.booking_date] = [];
          }
          // Store the specific time that is already booked
          slots[booking.booking_date].push(booking.booking_time);
        });
      }
      setBookedTimeSlots(slots);
      setLoading(false);
    }

    fetchArtistAndBookings();
  }, [artistId]);

  // Generate the next 30 days for our custom calendar UI
  const next30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Format to YYYY-MM-DD exactly as it saves in the database
    return d.toISOString().split('T')[0]; 
  });

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return window.alert("Please select a date and time.");
    setBookingLoading(true);

    try {
      // Get the current logged-in user (the client)
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      if (!user) {
        window.alert("Please log in as a client to book an artist.");
        setBookingLoading(false);
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
        <h2 className="text-3xl font-bold lowercase tracking-tight mb-4">artist not found.</h2>
        <button onClick={() => setLocation('/')} className="border border-black bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Back to Directory
        </button>
      </div>
    );
  }

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
                <h1 className="text-3xl sm:text-5xl font-bold lowercase tracking-tight">{artist.business_name || 'Artist Studio'}</h1>
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

      {/* PORTFOLIO GRID */}
      <main className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold lowercase tracking-tight">verified portfolio.</h2>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-black/40">Real client work showcasing signature aesthetic and technical execution.</p>
        </div>

        {artist.portfolio && artist.portfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artist.portfolio.map((imgUrl: string, index: number) => (
              <div key={index} className="bg-white border border-black/10 overflow-hidden shadow-sm group">
                <div className="aspect-[4/5] bg-black/5 overflow-hidden">
                  <img src={imgUrl} alt="Portfolio work" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6 flex items-center justify-between border-t border-black/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">Look {index + 1}</span>
                  <button onClick={() => setShowBookingModal(true)} className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#B66CF2] transition-colors">
                    Enquire Look ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-black/20 bg-white p-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">No portfolio photos uploaded yet.</p>
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
                  <h3 className="text-2xl font-bold lowercase tracking-tight">select date & time.</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Gray dates are unavailable or already booked.</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="text-black/30 hover:text-black transition-colors"><X size={24} strokeWidth={1.5} /></button>
              </div>

              <div className="p-8 overflow-y-auto">
                {/* 30-DAY ROLLING CALENDAR GRID */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-8">
                  {next30Days.map(dateStr => {
                    // Only gray out the whole day if the artist manually marked it as a day off
                    const isVacation = manuallyBlockedDates.includes(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const dateObj = new Date(dateStr);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();

                    return (
                      <button
                        key={dateStr}
                        disabled={isVacation}
                        onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }} // Reset time when picking new date
                        className={`flex flex-col items-center justify-center p-3 border transition-all ${
                          isVacation 
                            ? 'bg-black/5 text-black/20 border-transparent cursor-not-allowed line-through' 
                            : isSelected 
                              ? 'bg-black text-white border-black scale-105 shadow-md' 
                              : 'bg-white text-black border-black/20 hover:border-black hover:bg-black/5'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1">{dayName}</span>
                        <span className="text-xl font-bold">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SMART TIME SELECTOR */}
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
                        // We check if the DB returned a time starting with 09:00 or 15:00
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