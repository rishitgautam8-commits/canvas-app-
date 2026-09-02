import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ChatDrawer } from '@/components/ChatDrawer';
import { ArtistOnboardingModal } from '@/components/ArtistOnboardingModal';
import { ReviewModal } from '@/components/ReviewModal'; // Added Import
import { ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Session } from '@supabase/supabase-js';

interface DashboardProps {
  session: Session | null;
}

export default function Dashboard({ session }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'client' | 'artist' | null>(null);
  const [hasAddonSkill, setHasAddonSkill] = useState(false);

  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [clientBookings, setClientBookings] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'briefs'>('logistics');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [artistReviews, setArtistReviews] = useState<any[]>([]);
  
  const [showRoleSwitchConfirm, setShowRoleSwitchConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'client' | 'artist' | null>(null);

  // Review Modal State added correctly inside the component
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<any>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    category: '', 
    qualifications: '',
    city: '',
    max_travel_km: '',
    starting_price: '',
    years_experience: '',
    blocked_dates: [] as string[],
  });

  const [addons, setAddons] = useState<Array<{ name: string; price: string; file: File | null }>>([
    { name: '', price: '', file: null }
  ]);

  useEffect(() => {
    async function loadDashboard() {
      if (!session) {
        setLocation('/');
        return;
      }

      setUser(session.user);
      const metaRole = session.user.user_metadata?.role;
      setRole(metaRole || 'client');

      const { data: userData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (userData) {
        setProfile(userData);

        if (metaRole === 'artist') {
          const { data: artistData } = await supabase.from('artist_profiles').select('*').eq('id', session.user.id).single();
          // Fetch reviews for this artist
const { data: reviewsData } = await supabase
  .from('reviews')
  .select('*, client:profiles(full_name)')
  .eq('artist_id', session.user.id)
  .order('created_at', { ascending: false });

setArtistReviews(reviewsData || []);
          if (!artistData || !artistData.business_name) {
            setShowOnboarding(true);
          } else {
            setArtistProfile(artistData);
            setPortfolio(artistData.portfolio || []);
            setFormData({
              business_name: artistData.business_name || '',
              category: artistData.category || '',
              qualifications: artistData.qualifications || '',
              city: artistData.city || '',
              max_travel_km: artistData.max_travel_km?.toString() || '',
              starting_price: artistData.starting_price?.toString() || '',
              years_experience: artistData.years_experience?.toString() || '',
              blocked_dates: artistData.blocked_dates || [],
            });
          }

          const { data: bookingsData } = await supabase.from('bookings').select('*').eq('artist_id', session.user.id).order('created_at', { ascending: false });

          if (bookingsData && bookingsData.length > 0) {
            const clientIds = [...new Set(bookingsData.map((b) => b.client_id))];
            const { data: clientsData } = await supabase.from('profiles').select('id, full_name, email').in('id', clientIds);
            const clientsById = Object.fromEntries((clientsData || []).map((c) => [c.id, c]));
            setBookings(bookingsData.map((b) => ({ ...b, client: clientsById[b.client_id] || null })));
          } else {
            setBookings(bookingsData || []);
          }
        } else {
          const { data: clientBookingsData } = await supabase.from('bookings').select('*').eq('client_id', session.user.id).order('created_at', { ascending: false });

          if (clientBookingsData && clientBookingsData.length > 0) {
            const artistIds = [...new Set(clientBookingsData.map((b) => b.artist_id))];
            const { data: artistsData } = await supabase.from('artist_profiles').select('id, business_name, city').in('id', artistIds);
            const artistsById = Object.fromEntries((artistsData || []).map((a) => [a.id, a]));
            setClientBookings(clientBookingsData.map((b) => ({ ...b, artist: artistsById[b.artist_id] || null })));
          } else {
            setClientBookings(clientBookingsData || []);
          }
        }
      }
      setLoading(false);
    }

    loadDashboard();
  }, [session, setLocation]);

  const handleRequestRoleSwitch = (targetRole: 'client' | 'artist') => {
    if (targetRole === role) return;
    setPendingRole(targetRole);
    setShowRoleSwitchConfirm(true);
  };

  const confirmRoleSwitch = async () => {
    if (!pendingRole || !session) return;
    setUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ data: { role: pendingRole } });
      if (error) throw error;
      
      await supabase.from('profiles').update({ role: pendingRole }).eq('id', session.user.id);
      
      if (pendingRole === 'artist') {
        await supabase.from('artist_profiles').upsert({ id: session.user.id });
      }
      
      window.location.reload();
    } catch (err: any) {
      window.alert(`Failed to switch role: ${err.message}`);
      setUpdating(false);
    }
  };

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSaving(true);

    try {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: session.user.id,
          email: session.user.email,
          role: 'artist',
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.first_name ||
            'Artist',
        },
        { onConflict: 'email' }
      );

      if (profileError) {
        throw new Error(`Failed to save base profile: ${profileError.message}`);
      }

      const { error: artistError } = await supabase.from('artist_profiles').upsert(
        {
          id: session.user.id,
          business_name: formData.business_name,
          category: formData.category,
          qualifications: formData.qualifications,
          city: formData.city,
          max_travel_km: parseInt(formData.max_travel_km) || 0,
          starting_price: parseInt(formData.starting_price) || 0,
          years_experience: parseInt(formData.years_experience) || 0,
          blocked_dates: formData.blocked_dates,
        },
        { onConflict: 'id' }
      );

      if (artistError) throw artistError;

      window.alert('Logistics updated successfully! Your search filtering is now live.');
      setArtistProfile({ ...artistProfile, ...formData });
    } catch (err: any) {
      window.alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolioImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    setUploadingPortfolio(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/portfolio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('portfolios').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('portfolios').getPublicUrl(filePath);
      const updatedPortfolio = [...portfolio, publicUrlData.publicUrl];
      const { error: updateError } = await supabase.from('artist_profiles').update({ portfolio: updatedPortfolio }).eq('id', session.user.id);

      if (updateError) throw updateError;
      setPortfolio(updatedPortfolio);
    } catch (err: any) { window.alert(`Failed to upload image: ${err.message}`); } 
    finally { setUploadingPortfolio(false); e.target.value = ''; }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'declined') => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { window.alert(`Failed to update booking: ${error.message}`); } 
    else { setBookings((prevBookings) => prevBookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B66CF2] animate-pulse">Loading Studio...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'User';
  const displayFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black pb-24">
      <header className="border-b border-black/10 bg-white px-6 py-6 sm:px-12 sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black">
            <ArrowLeft size={14} /> Back to Directory
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
              <button
                onClick={() => handleRequestRoleSwitch('client')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-all ${
                  role === 'client' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => handleRequestRoleSwitch('artist')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-all ${
                  role === 'artist' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black'
                }`}
              >
                Artist
              </button>
            </div>

            <div className="rounded-full bg-black/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/70">
              Artist Studio Hub
            </div>

            <div className="h-8 w-8 bg-black flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest">
              {displayFirstName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showRoleSwitchConfirm && pendingRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleSwitchConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-black/10 p-8 sm:p-12 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B66CF2] mb-2">Switch Account Type</p>
                  <h3 className="text-2xl font-bold capitalize tracking-tight">Switch to {pendingRole}?</h3>
                </div>
                <button onClick={() => setShowRoleSwitchConfirm(false)} className="text-black/30 hover:text-black transition-colors"><X size={20} strokeWidth={1.5} /></button>
              </div>
              <p className="text-sm text-black/60 leading-relaxed mb-8">You are about to switch from <strong className="text-black">{role}</strong> to <strong className="text-black">{pendingRole}</strong>. Your dashboard will reload with the new interface.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowRoleSwitchConfirm(false)} className="flex-1 border border-black/20 bg-transparent px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 hover:border-black hover:text-black transition-colors">Cancel</button>
                <button onClick={confirmRoleSwitch} disabled={updating} className="flex-1 border border-black bg-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#B66CF2] hover:border-[#B66CF2] transition-colors disabled:opacity-50">
                  {updating ? 'Switching...' : 'Confirm Switch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1400px] px-6 py-12 sm:px-12">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">Welcome, {displayFirstName}.</h1>

        {role === 'artist' ? (
          <>
            <div className="mt-12 mb-8 flex gap-8 border-b border-black/10 pb-px overflow-x-auto">
              <button onClick={() => setActiveTab('logistics')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'logistics' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>Profile & Logistics</button>
              <button onClick={() => setActiveTab('overview')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>Overview</button>
              <button onClick={() => setActiveTab('briefs')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'briefs' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>New Bookings {bookings.length > 0 && `(${bookings.length})`}</button>
              <button onClick={() => setLocation(`/artist/${session?.user.id}`)} className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 text-[#B66CF2] hover:text-black transition-colors">Preview Public Page ↗</button>
            </div>

            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">New Bookings</p>
                  <p className="mt-4 text-6xl font-bold tracking-tight text-[#B66CF2]">{bookings.length}</p>
                </div>
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Upcoming Bookings</p>
                  <p className="mt-4 text-6xl font-bold tracking-tight text-black">0</p>
                </div>
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Travel Radius</p>
                  <p className="mt-4 text-5xl font-bold tracking-tight text-black">{artistProfile?.max_travel_km || 0} km</p>
                </div>
              </div>
            )}

            {activeTab === 'briefs' && (
              <div className="max-w-4xl bg-white border border-black/10 p-8 sm:p-12 shadow-sm">
                <div className="mb-10"><h3 className="text-3xl font-bold capitalize tracking-tight">New Bookings.</h3></div>
                {bookings.length > 0 ? (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border border-black/10 bg-[#F9F9F9] p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-center">
                          <div><h4 className="mt-4 text-2xl font-bold capitalize tracking-tight">{booking.client?.full_name || 'Canvas Client'}</h4></div>
                          <div className="flex gap-3 items-center">
                            {booking.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className="border border-[#B66CF2] bg-[#B66CF2] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Accept</button>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'declined')} className="border border-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">Decline</button>
                              </>
                            )}
                            <button onClick={() => setActiveChatBooking(booking)} className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Chat</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40">No new bookings.</p>
                )}
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-black/10 p-8 sm:p-12 shadow-sm">
                <div className="mb-10">
                  <h3 className="text-3xl font-bold capitalize tracking-tight">Artist Profile & Logistics.</h3>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
                    Complete your profile to appear in client searches.
                  </p>
                </div>

                <form onSubmit={handleSaveLogistics} className="space-y-8">
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Profile Picture *</label>
                      <input type="file" accept="image/*" className="w-full text-sm text-black/70 file:mr-4 file:border-0 file:bg-black/5 file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-black hover:file:bg-black/10 transition-all cursor-pointer" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Years of Experience *</label>
                      <input 
                        type="text" 
                        value={formData.years_experience} 
                        onChange={(e) => setFormData({...formData, years_experience: e.target.value.replace(/\D/g, '')})} 
                        placeholder="e.g. 6" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Artist / Business Name *</label>
                      <input 
                        type="text" 
                        value={formData.business_name} 
                        onChange={(e) => setFormData({...formData, business_name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="e.g. Kaushal Makeover" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Base Location in Hyderabad *</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="e.g. Jubilee Hills" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Starting Package Price (₹) *</label>
                      <input 
                        type="text" 
                        value={formData.starting_price} 
                        onChange={(e) => setFormData({...formData, starting_price: e.target.value.replace(/\D/g, '')})} 
                        placeholder="15000" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Comfortable Travel Radius (km) *</label>
                      <input 
                        type="text" 
                        value={formData.max_travel_km} 
                        onChange={(e) => setFormData({...formData, max_travel_km: e.target.value.replace(/\D/g, '')})} 
                        placeholder="25" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Makeup Specialisations *</label>
                      <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="e.g. Bridal, Editorial, Party" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Qualifications / Certifications *</label>
                      <input 
                        type="text" 
                        value={formData.qualifications} 
                        onChange={(e) => setFormData({...formData, qualifications: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="e.g. Certified by MAC" 
                        className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="border-t border-black/10 pt-8 pb-4">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Unavailable / Blocked Dates</label>
                    <p className="mb-4 text-[10px] font-bold tracking-widest text-black/50 uppercase">Select personal days or vacations when you are completely unavailable. (Confirmed client bookings are blocked automatically).</p>
                    
                    <div className="flex gap-4 mb-4">
                      <input 
                        type="date" 
                        id="datePicker" 
                        className="border-b border-black/20 bg-transparent py-2 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const dateInput = document.getElementById('datePicker') as HTMLInputElement;
                          const dateVal = dateInput.value;
                          if (dateVal && !formData.blocked_dates.includes(dateVal)) {
                            setFormData({...formData, blocked_dates: [...formData.blocked_dates, dateVal]});
                            dateInput.value = '';
                          }
                        }} 
                        className="bg-black px-6 py-2 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-[#B66CF2] transition-colors"
                      >
                        Block Date
                      </button>
                    </div>

                    {formData.blocked_dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.blocked_dates.map(date => (
                           <span key={date} className="border border-black/20 bg-black/5 px-4 py-2 text-xs font-bold tracking-widest flex items-center gap-3">
                             {new Date(date).toLocaleDateString('en-GB')} 
                             <button 
                               type="button" 
                               onClick={() => setFormData({...formData, blocked_dates: formData.blocked_dates.filter(d => d !== date)})} 
                               className="text-red-500 hover:text-red-700 text-sm"
                             >
                               ✕
                             </button>
                           </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-black/5 p-6 border-l-2 border-black">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Primary Portfolio Upload *</label>
                    <p className="mb-4 text-[10px] font-bold tracking-widest text-black/50 uppercase">Must upload a minimum of 2 photos. No maximum limit.</p>
                    
                    <input type="file" multiple accept="image/*" onChange={handleAddPortfolioImage} className="w-full text-sm text-black/70 file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-black hover:file:bg-black/10 transition-all cursor-pointer" required={portfolio.length < 2} />
                    
                    {portfolio.length > 0 && (
                      <p className="mt-4 text-[10px] font-bold text-[#B66CF2] uppercase">{portfolio.length} photo(s) currently in portfolio</p>
                    )}
                  </div>

                  <div className="border-t border-black/10 pt-8">
                    <label className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Do you offer any add-on skills? (e.g. Hairstyling, Brow Tinting)</label>
                    <div className="flex gap-4 mb-6">
                      <button type="button" onClick={() => setHasAddonSkill(true)} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${hasAddonSkill ? 'bg-black text-white shadow-sm' : 'bg-black/5 text-black/50 hover:text-black'}`}>
                        Yes, I do
                      </button>
                      <button type="button" onClick={() => { setHasAddonSkill(false); setAddons([{ name: '', price: '', file: null }]); }} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${!hasAddonSkill ? 'bg-black text-white shadow-sm' : 'bg-black/5 text-black/50 hover:text-black'}`}>
                        No
                      </button>
                    </div>

                    {hasAddonSkill && (
                      <div className="space-y-6">
                        {addons.map((addon, index) => (
                          <div key={index} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-black/5 p-6 border-l-2 border-[#B66CF2] relative">
                            
                            {addons.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = addons.filter((_, i) => i !== index);
                                  setAddons(updated);
                                }} 
                                className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:underline"
                              >
                                Remove Skill
                              </button>
                            )}

                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B66CF2]">Add-on Skill #{index + 1}</p>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Add-on Skill Name *</label>
                                <input 
                                  type="text" 
                                  value={addon.name} 
                                  onChange={(e) => {
                                    const updated = [...addons];
                                    updated[index].name = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setAddons(updated);
                                  }} 
                                  placeholder="e.g. Brow Tinting" 
                                  className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                                  required={hasAddonSkill} 
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Add-on Price (₹) *</label>
                                <input 
                                  type="text" 
                                  value={addon.price} 
                                  onChange={(e) => {
                                    const updated = [...addons];
                                    updated[index].price = e.target.value.replace(/\D/g, '');
                                    setAddons(updated);
                                  }} 
                                  placeholder="e.g. 1200" 
                                  className="w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold tracking-widest outline-none transition-colors focus:border-black" 
                                  required={hasAddonSkill} 
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-black">Add-on Portfolio Upload *</label>
                              <p className="mb-4 text-[10px] font-bold tracking-widest text-black/50 uppercase">Must upload at least 1 photo showcasing this specific skill.</p>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  const updated = [...addons];
                                  updated[index].file = file;
                                  setAddons(updated);
                                }}
                                className="w-full text-sm text-black/70 file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-black hover:file:bg-black/10 transition-all cursor-pointer" 
                                required={hasAddonSkill && !addon.file} 
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setAddons([...addons, { name: '', price: '', file: null }])}
                          className="w-full border border-dashed border-black/30 bg-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black hover:border-black transition-colors"
                        >
                          + Add Another Add-on Skill
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving || uploadingPortfolio} className="bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                      {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="mt-16 max-w-4xl">
            {clientBookings.length > 0 ? (
              <div className="space-y-6">
                {clientBookings.map((booking) => (
                  <div key={booking.id} className="bg-white border border-black/10 p-8 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="text-2xl font-bold capitalize tracking-tight">{booking.artist?.business_name || 'Canvas Artist'}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">{booking.artist?.city}</p>
                    </div>
                    
                    {/* The new button section for the Client side! */}
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => {
                          setBookingToReview(booking);
                          setReviewModalOpen(true);
                        }}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B66CF2] hover:text-black transition-colors"
                      >
                        Leave a Review
                      </button>
                      <button onClick={() => setActiveChatBooking(booking)} className="border border-black bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#B66CF2] hover:border-[#B66CF2] transition-colors">
                        Open Chat
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-black/20 bg-white p-8 text-center shadow-sm">
                <p className="text-3xl font-bold tracking-tight text-black/30">No bookings yet.</p>
                <button onClick={() => setLocation('/')} className="mt-8 border border-black bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Browse Artists</button>
              </div>
            )}
          </div>
        )}
      </main>

      <ArtistOnboardingModal open={showOnboarding} userId={profile?.id} onComplete={() => window.location.reload()} />
      
      {showOnboarding && (
        <div className="fixed top-6 left-6 z-[9999]">
          <button 
            onClick={async () => {
              if (!user) return;
              await supabase.auth.updateUser({ data: { role: 'client' } });
              await supabase.from('profiles').update({ role: 'client' }).eq('id', user.id);
              window.location.reload();
            }}
            className="flex items-center gap-2 border border-black bg-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-2xl transition-colors hover:bg-[#B66CF2] hover:border-[#B66CF2]"
          >
            <ArrowLeft size={14} /> Wait, I'm a Client
          </button>
        </div>
      )}

      {activeChatBooking && (
        <ChatDrawer open={Boolean(activeChatBooking)} bookingId={activeChatBooking.id} currentUserId={user?.id || ''} otherPartyName={role === 'artist' ? (activeChatBooking.client?.full_name || 'Client') : 'Artist Studio'} onClose={() => setActiveChatBooking(null)} />
      )}

      {/* The Review Modal renders here safely at the bottom! */}
      {reviewModalOpen && bookingToReview && (
        <ReviewModal 
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          bookingId={bookingToReview.id}
          artistId={bookingToReview.artist_id}
          clientId={bookingToReview.client_id}
          artistName={bookingToReview.artist?.business_name || "your artist"}
        />
      )}
    </div>
  );
}