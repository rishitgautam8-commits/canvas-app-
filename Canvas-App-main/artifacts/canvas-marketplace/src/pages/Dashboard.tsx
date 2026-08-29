import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ChatDrawer } from '@/components/ChatDrawer';
import { ArtistOnboardingModal } from '@/components/ArtistOnboardingModal';
import { ArrowLeft, Save, Calendar, MapPin, Sparkles, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { User, Session } from '@supabase/supabase-js';

interface DashboardProps {
  session: Session | null;
}

export default function Dashboard({ session }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'client' | 'artist' | null>(null);

  // Feature State
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [clientBookings, setClientBookings] = useState<any[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'briefs'>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRoleSwitchConfirm, setShowRoleSwitchConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'client' | 'artist' | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    city: '',
    max_travel_km: 25,
    starting_price: 15000,
  });

  useEffect(() => {
    async function loadDashboard() {
      if (!session) {
        setLocation('/');
        return;
      }

      setUser(session.user);
      const metaRole = session.user.user_metadata?.role;
      setRole(metaRole || null);

      if (!metaRole) {
        setLoading(false);
        return; 
      }

      const { data: userData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (userData) {
        setProfile(userData);

        if (metaRole === 'artist') {
          const { data: artistData } = await supabase.from('artist_profiles').select('*').eq('id', session.user.id).single();

          if (!artistData || !artistData.business_name) {
            setShowOnboarding(true);
          } else {
            setArtistProfile(artistData);
            setPortfolio(artistData.portfolio || []);
            setFormData({
              business_name: artistData.business_name || '',
              category: artistData.category || 'Bridal & Wedding',
              city: artistData.city || 'Hyderabad',
              max_travel_km: artistData.max_travel_km || 25,
              starting_price: artistData.starting_price || 15000,
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

  // ==========================================
  // ROLE SWITCHING — FIXED WITH SESSION REFRESH
  // ==========================================
  const handleRequestRoleSwitch = (targetRole: 'client' | 'artist') => {
    if (targetRole === role) return;
    setPendingRole(targetRole);
    setShowRoleSwitchConfirm(true);
  };

  const confirmRoleSwitch = async () => {
    if (!pendingRole || !user) return;
    setUpdating(true);
    try {
      // FIX: Refresh session first to ensure token is valid
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) console.warn('Session refresh warning:', refreshError.message);
      
      const { error } = await supabase.auth.updateUser({ data: { role: pendingRole } });
      if (error) throw error;
      
      await supabase.from('profiles').update({ role: pendingRole }).eq('id', user.id);
      if (pendingRole === 'artist') {
        await supabase.from('artist_profiles').upsert({ id: user.id });
      }
      
      // Update local state immediately so UI reflects change before reload
      setRole(pendingRole);
      setShowRoleSwitchConfirm(false);
      setPendingRole(null);
      
      // Force full reload to re-initialize everything with new role
      window.location.reload();
    } catch (err: any) {
      window.alert(`Failed to switch role: ${err.message}`);
      setUpdating(false);
    }
  };

  const handleSelectRole = async (selectedRole: 'client' | 'artist') => {
    if (!user) return;
    setUpdating(true);
    try {
      // FIX: Refresh session first
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) console.warn('Session refresh warning:', refreshError.message);
      
      const { error } = await supabase.auth.updateUser({ data: { role: selectedRole } });
      if (error) throw error;
      
      const fullName = session?.user.user_metadata?.name || session?.user.user_metadata?.full_name || 'User';
      await supabase.from('profiles').upsert({ id: user.id, role: selectedRole, full_name: fullName });
      
      if (selectedRole === 'artist') {
        await supabase.from('artist_profiles').upsert({ id: user.id });
      }
      
      window.location.reload();
    } catch (err: any) {
      window.alert(`Failed to set account type: ${err.message}`);
      setUpdating(false);
    }
  };

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('artist_profiles').update({
        business_name: formData.business_name, category: formData.category, city: formData.city,
        max_travel_km: formData.max_travel_km, starting_price: formData.starting_price,
      }).eq('id', profile.id);

    setSaving(false);
    if (error) { window.alert(`Error saving: ${error.message}`); } 
    else {
      window.alert('Logistics updated successfully! Your search filtering is now live.');
      setArtistProfile({ ...artistProfile, ...formData });
    }
  };

  const handleAddPortfolioImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingPortfolio(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/portfolio-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('portfolios').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('portfolios').getPublicUrl(filePath);
      const updatedPortfolio = [...portfolio, publicUrlData.publicUrl];
      const { error: updateError } = await supabase.from('artist_profiles').update({ portfolio: updatedPortfolio }).eq('id', profile.id);
      if (updateError) throw updateError;
      setPortfolio(updatedPortfolio);
    } catch (err: any) {
      window.alert(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingPortfolio(false);
      e.target.value = '';
    }
  };

  const handleRemovePortfolioImage = async (urlToRemove: string) => {
    if (!profile) return;
    const updatedPortfolio = portfolio.filter((url) => url !== urlToRemove);
    const { error } = await supabase.from('artist_profiles').update({ portfolio: updatedPortfolio }).eq('id', profile.id);
    if (error) { window.alert(`Failed to remove image: ${error.message}`); } 
    else { setPortfolio(updatedPortfolio); }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'declined') => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { window.alert(`Failed to update booking: ${error.message}`); } 
    else {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 animate-pulse">Authenticating...</p>
      </div>
    );
  }

  // ==========================================
  // 1. THE FORK IN THE ROAD (ONBOARDING)
  // ==========================================
  if (!role) {
    return (
      <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#F9F9F9]">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => !updating && handleSelectRole('client')}
          className="flex-1 relative bg-[#F9F9F9] text-black flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer group"
        >
          <div className="absolute inset-0 overflow-hidden"><img src="https://images.unsplash.com/photo-1516975080661-46bfa2c281c7?auto=format&fit=crop&w=1200&q=80" alt="Client" className="w-full h-full object-cover opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700" /></div>
          <div className="relative z-10 text-center transform group-hover:-translate-y-2 transition-transform duration-700">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#B66CF2] mb-6">For Clients</p>
            <h2 className="text-4xl md:text-6xl font-bold lowercase tracking-tight mb-6">i am looking<br/>for an artist.</h2>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-black/40 max-w-sm mx-auto mb-10 leading-relaxed">Book premium beauty services, manage appointments, and build your aesthetic profile.</p>
            <div className="inline-block border border-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] group-hover:bg-black group-hover:text-white transition-colors shadow-sm">{updating ? 'Setting up...' : 'Join as Client'}</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => !updating && handleSelectRole('artist')}
          className="flex-1 relative bg-[#05020A] text-white flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer group border-t md:border-t-0 md:border-l border-white/10"
        >
          <div className="absolute inset-0 overflow-hidden"><img src="https://images.unsplash.com/photo-1522337360788-8b13fee7a3af?auto=format&fit=crop&w=1200&q=80" alt="Artist" className="w-full h-full object-cover opacity-0 group-hover:opacity-10 transition-opacity duration-700 grayscale" /></div>
          <div className="relative z-10 text-center transform group-hover:-translate-y-2 transition-transform duration-700">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#B66CF2] mb-6">For Professionals</p>
            <h2 className="text-4xl md:text-6xl font-bold lowercase tracking-tight mb-6">i am a<br/>makeup artist.</h2>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/50 max-w-sm mx-auto mb-10 leading-relaxed">List your verified portfolio, manage bookings, and access Canvas Pro client leads.</p>
            <div className="inline-block border border-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] group-hover:bg-white group-hover:text-black transition-colors shadow-sm">{updating ? 'Setting up...' : 'Apply to Roster'}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // 2. STANDARD DASHBOARD
  // ==========================================
  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || 'User';
  const displayFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black pb-24">
      <header className="border-b border-black/10 bg-white px-6 py-6 sm:px-12 sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black">
            <ArrowLeft size={14} /> Back to Directory
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-black/5 rounded-full p-1">
              <button
                onClick={() => handleRequestRoleSwitch('client')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-all ${
                  role === 'client' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black hover:bg-black/10'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => handleRequestRoleSwitch('artist')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-all ${
                  role === 'artist' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black hover:bg-black/10'
                }`}
              >
                Artist
              </button>
            </div>

            <div className="sm:hidden">
              <button onClick={() => handleRequestRoleSwitch(role === 'client' ? 'artist' : 'client')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 hover:text-black transition-colors">
                <RefreshCw size={12} /> {role === 'client' ? 'Switch to Artist' : 'Switch to Client'}
              </button>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-black/5 px-4 py-2 text-[#B66CF2] hidden md:block">
              {role === 'artist' ? 'Artist Studio Hub' : 'Client Hub'}
            </span>
            <div className="h-8 w-8 bg-black flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest">
              {displayFirstName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* ROLE SWITCH CONFIRMATION MODAL */}
      {showRoleSwitchConfirm && pendingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleSwitchConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-black/10 p-8 sm:p-12 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B66CF2] mb-2">Switch Account Type</p>
                <h3 className="text-2xl font-bold lowercase tracking-tight">switch to {pendingRole}?</h3>
              </div>
              <button onClick={() => setShowRoleSwitchConfirm(false)} className="text-black/30 hover:text-black transition-colors"><X size={20} strokeWidth={1.5} /></button>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-8">You are about to switch from <strong className="text-black">{role}</strong> to <strong className="text-black">{pendingRole}</strong>. Your dashboard will reload with the new interface. All your data remains intact.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowRoleSwitchConfirm(false)} className="flex-1 border border-black/20 bg-transparent px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 hover:border-black hover:text-black transition-colors">Cancel</button>
              <button onClick={confirmRoleSwitch} disabled={updating} className="flex-1 border border-black bg-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#B66CF2] hover:border-[#B66CF2] transition-colors disabled:opacity-50">
                {updating ? 'Switching...' : 'Confirm Switch'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-6 py-12 sm:px-12">
        <h1 className="text-5xl sm:text-7xl font-bold lowercase tracking-tight">welcome, {displayFirstName}.</h1>

        {role === 'artist' ? (
          <>
            <div className="mt-12 mb-8 flex gap-8 border-b border-black/10 pb-px overflow-x-auto">
              <button onClick={() => setActiveTab('overview')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>Overview</button>
              <button onClick={() => setActiveTab('briefs')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'briefs' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>New Bookings {bookings.length > 0 && `(${bookings.length})`}</button>
              <button onClick={() => setActiveTab('logistics')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-4 transition-colors ${activeTab === 'logistics' ? 'border-b-2 border-black text-black' : 'text-black/40 hover:text-black'}`}>Profile & Logistics</button>
            </div>

            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">New Bookings</p>
                  <p className="mt-4 text-6xl font-bold lowercase tracking-tight text-[#B66CF2]">{bookings.length}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-black/40">{bookings.length === 0 ? 'No new bookings to review.' : 'Action required on new bookings.'}</p>
                </div>
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Upcoming Bookings</p>
                  <p className="mt-4 text-6xl font-bold lowercase tracking-tight text-black">0</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-black/40">Your calendar is clear.</p>
                </div>
                <div className="bg-white border border-black/10 p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Travel Radius</p>
                  <p className="mt-4 text-5xl font-bold lowercase tracking-tight text-black">{artistProfile?.max_travel_km || 0} km</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-black/40">Based in {artistProfile?.city || 'Jubilee Hills'}</p>
                </div>
              </div>
            )}

            {activeTab === 'briefs' && (
              <div className="max-w-4xl bg-white border border-black/10 p-8 sm:p-12 shadow-sm">
                <div className="mb-10">
                  <h3 className="text-3xl font-bold lowercase tracking-tight">new bookings.</h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black/50">Review secured client briefs. Communication is strictly encrypted within Canvas.</p>
                </div>
                {bookings.length > 0 ? (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border border-black/10 bg-[#F9F9F9] p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-center">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] bg-[#B66CF2]/10 px-3 py-1 text-[#B66CF2]">{booking.status.replace('_', ' ').toUpperCase()}</span>
                            <h4 className="mt-4 text-2xl font-bold lowercase tracking-tight">{booking.client?.full_name || 'Canvas Client'}</h4>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/30">Secure ID: {booking.id.slice(0, 8)}...</p>
                          </div>
                          <div className="flex flex-wrap gap-3 items-center">
                            {booking.status === 'pending' ? (
                              <>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className="border border-[#B66CF2] bg-[#B66CF2] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-transparent hover:text-[#B66CF2]">Accept Brief</button>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'declined')} className="border border-black/20 bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 transition-colors hover:border-black hover:text-black">Decline</button>
                              </>
                            ) : (
                              <span className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${booking.status === 'confirmed' ? 'bg-black text-white' : 'bg-black/10 text-black/50'}`}>{booking.status}</span>
                            )}
                            <button onClick={() => setActiveChatBooking(booking)} className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-transparent hover:text-black">Open Chat</button>
                          </div>
                        </div>
                        <div className="mt-6 grid gap-6 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <Calendar className="mt-0.5 text-black/40" size={16} strokeWidth={1.5} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Date & Time</p>
                              <p className="mt-1 text-sm font-bold uppercase tracking-widest">{new Date(booking.event_date).toLocaleDateString()} · {booking.time_slot}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 text-black/40" size={16} strokeWidth={1.5} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Venue Address</p>
                              <p className="mt-1 text-sm font-bold uppercase tracking-widest">{booking.venue_address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:col-span-2 border-t border-black/10 pt-6 mt-2">
                            <Sparkles className="mt-0.5 text-[#B66CF2]" size={16} strokeWidth={1.5} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B66CF2]">Look Details & Reference</p>
                              <p className="mt-2 text-sm leading-relaxed text-black/70">{booking.look_details}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[250px] flex-col items-center justify-center border border-dashed border-black/20 bg-[#F9F9F9] p-8 text-center">
                    <p className="text-2xl font-bold lowercase tracking-tight text-black/40">no new bookings.</p>
                    <p className="mt-3 max-w-sm text-[10px] font-bold uppercase tracking-widest text-black/40">When a client secures your slot, their event details will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logistics' && (
              <>
                <form onSubmit={handleSaveLogistics} className="max-w-3xl bg-white border border-black/10 p-8 sm:p-12 shadow-sm mb-8">
                  <div className="mb-10">
                    <h3 className="text-3xl font-bold lowercase tracking-tight">search logistics.</h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black/50">These parameters control exactly when you appear in client search results.</p>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Business / Brand Name</span>
                      <input type="text" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="mt-3 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-[#B66CF2]" placeholder="e.g. Kaushal Makeover" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Primary Category</span>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-3 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-[#B66CF2]">
                        <option value="Bridal & Wedding">Bridal & Wedding</option><option value="Party & Event Glam">Party & Event Glam</option><option value="Natural & Soft Aesthetics">Natural & Soft Aesthetics</option><option value="Editorial & High Fashion">Editorial & High Fashion</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Base City</span>
                      <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="mt-3 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-[#B66CF2]" placeholder="e.g. Jubilee Hills, Hyderabad" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Max Travel Distance (KM)</span>
                      <div className="mt-3 flex items-center gap-4">
                        <input type="range" min="5" max="200" step="5" value={formData.max_travel_km} onChange={(e) => setFormData({...formData, max_travel_km: parseInt(e.target.value)})} className="w-full accent-black cursor-pointer" />
                        <span className="text-xl font-bold">{formData.max_travel_km}km</span>
                      </div>
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Starting Price (₹)</span>
                      <input type="number" value={formData.starting_price} onChange={(e) => setFormData({...formData, starting_price: parseInt(e.target.value)})} className="mt-3 w-full border-b border-black/20 bg-transparent py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-[#B66CF2]" placeholder="15000" />
                    </label>
                  </div>
                  <div className="mt-12 flex justify-end">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#B66CF2] disabled:opacity-50">
                      {saving ? 'SAVING...' : 'SAVE CHANGES'} {!saving && <Save size={14} />}
                    </button>
                  </div>
                </form>
                <div className="max-w-3xl bg-white border border-black/10 p-8 sm:p-12 shadow-sm">
                  <div className="mb-10">
                    <h3 className="text-3xl font-bold lowercase tracking-tight">portfolio.</h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black/50">These images represent your aesthetic to clients.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {portfolio.map((url) => (
                      <div key={url} className="group relative aspect-square overflow-hidden border border-black/10 bg-[#F9F9F9]">
                        <img src={url} alt="Portfolio piece" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => handleRemovePortfolioImage(url)} className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100">Remove</button>
                      </div>
                    ))}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed border-black/20 bg-[#F9F9F9] text-center transition-colors hover:border-black">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">{uploadingPortfolio ? 'Uploading...' : '+ Add Image'}</span>
                      <input type="file" accept="image/*" disabled={uploadingPortfolio} onChange={handleAddPortfolioImage} className="hidden" />
                    </label>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-16 max-w-4xl">
            {clientBookings.length > 0 ? (
              <div className="space-y-6">
                {clientBookings.map((booking) => (
                  <div key={booking.id} className="bg-white border border-black/10 p-8 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-center">
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-1 ${booking.status === 'confirmed' ? 'bg-black text-white' : booking.status === 'declined' ? 'bg-red-500/10 text-red-600' : 'bg-[#B66CF2]/10 text-[#B66CF2]'}`}>{booking.status.replace('_', ' ').toUpperCase()}</span>
                        <h4 className="mt-4 text-2xl font-bold lowercase tracking-tight">{booking.artist?.business_name || 'Canvas Artist'}</h4>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/40">{booking.artist?.city}</p>
                      </div>
                      <button onClick={() => setActiveChatBooking(booking)} className="border border-black bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-transparent hover:text-black">Open Concierge Chat</button>
                    </div>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 text-black/40" size={16} strokeWidth={1.5} />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Date & Time</p>
                          <p className="mt-1 text-sm font-bold uppercase tracking-widest">{new Date(booking.event_date).toLocaleDateString()} · {booking.time_slot}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 text-black/40" size={16} strokeWidth={1.5} />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Venue Address</p>
                          <p className="mt-1 text-sm font-bold uppercase tracking-widest">{booking.venue_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-black/20 bg-white p-8 text-center shadow-sm">
                <p className="text-3xl font-bold lowercase tracking-tight text-black/30">no bookings yet.</p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-black/40">Your upcoming appointments and saved artists will appear here.</p>
                <button onClick={() => setLocation('/')} className="mt-8 border border-black bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-transparent hover:text-black">Browse Artists</button>
              </div>
            )}
          </div>
        )}
      </main>

      <ArtistOnboardingModal open={showOnboarding} userId={profile?.id} onComplete={() => { setShowOnboarding(false); window.location.reload(); }} />

      {activeChatBooking && (
        <ChatDrawer open={Boolean(activeChatBooking)} bookingId={activeChatBooking.id} currentUserId={user?.id || ''} otherPartyName={role === 'artist' ? (activeChatBooking.client?.full_name || 'Client') : 'Artist Studio'} onClose={() => setActiveChatBooking(null)} />
      )}
    </div>
  );
}