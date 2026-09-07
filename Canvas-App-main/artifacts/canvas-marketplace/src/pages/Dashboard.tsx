import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ChatDrawer } from '@/components/ChatDrawer';
import { ArtistOnboardingModal } from '@/components/ArtistOnboardingModal';
import { ReviewModal } from '@/components/ReviewModal';
import { Premium } from '@/components/Premium';
import { ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Session } from '@supabase/supabase-js';
import { getTheme } from '@/lib/theme';

interface DashboardProps {
  session: Session | null;
}

export default function Dashboard({ session }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'client' | 'artist' | null>(null);
  const [hasAddonSkill, setHasAddonSkill] = useState(false);
  const [artistReviews, setArtistReviews] = useState<any[]>([]);

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
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'briefs' | 'reviews'>('logistics');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [showRoleSwitchConfirm, setShowRoleSwitchConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'client' | 'artist' | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<any>(null);

  // Read style query param for the Dynamic Theme Engine
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

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
        setLocation(`/?style=${styleVersion}`);
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
  }, [session, setLocation, styleVersion]);

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

      if (profileError) throw new Error(`Failed to save base profile: ${profileError.message}`);

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
      <div className={`min-h-screen bg-[#FDF3F1] flex items-center justify-center ${theme.fontBase}`}>
        <p className={`${theme.eyebrow} animate-pulse`}>loading studio...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'User';
  const displayFirstName = firstName.charAt(0).toLowerCase() + firstName.slice(1);

  return (
    <div className={`min-h-screen bg-[#FDF3F1] text-black pb-24 ${theme.fontBase}`}>
      <header className={`border-b ${theme.borderBase} bg-white/80 backdrop-blur-md px-6 py-6 sm:px-12 sticky top-0 z-50`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={`flex items-center gap-2 ${theme.navLink} !border-none !bg-transparent`}>
            <ArrowLeft size={14} /> back to directory
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
              <button
                onClick={() => handleRequestRoleSwitch('client')}
                className={`px-4 py-2 ${theme.formLabel} rounded-full transition-all ${
                  role === 'client' ? 'bg-black !text-white shadow-sm' : 'text-black/50 hover:text-black !bg-transparent !border-none'
                }`}
              >
                client
              </button>
              <button
                onClick={() => handleRequestRoleSwitch('artist')}
                className={`px-4 py-2 ${theme.formLabel} rounded-full transition-all ${
                  role === 'artist' ? 'bg-black !text-white shadow-sm' : 'text-black/50 hover:text-black !bg-transparent !border-none'
                }`}
              >
                artist
              </button>
            </div>

            <div className={`rounded-full bg-black/5 px-4 py-2 ${theme.formLabel} hidden sm:block !border-none`}>
              artist studio hub
            </div>

            <div className={`h-8 w-8 bg-black flex items-center justify-center text-white ${theme.formLabel} !border-none ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>
              {displayFirstName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showRoleSwitchConfirm && pendingRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowRoleSwitchConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white border ${theme.borderBase} p-8 sm:p-12 max-w-md w-full shadow-2xl ${theme.cardRadius}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className={`${theme.eyebrow} mb-2`}>switch account type</p>
                  <h3 className={theme.headingModal}>switch to {pendingRole}?</h3>
                </div>
                <button onClick={() => setShowRoleSwitchConfirm(false)} className="text-black/30 hover:text-black transition-colors"><X size={18} strokeWidth={1.5} /></button>
              </div>
              <p className={`${theme.bodyText} mb-8`}>you are about to switch from <strong className="text-black font-bold">{role}</strong> to <strong className="text-black font-bold">{pendingRole}</strong>. your dashboard will reload with the new interface.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowRoleSwitchConfirm(false)} className={`flex-1 ${theme.btnOutline}`}>cancel</button>
                <button onClick={confirmRoleSwitch} disabled={updating} className={`flex-1 ${theme.btnPrimary} disabled:opacity-50`}>
                  {updating ? 'switching...' : 'confirm switch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1400px] px-6 py-12 sm:px-12">
        <h1 className={`${theme.headingHero} mb-4`}>
          welcome, <Premium>{displayFirstName}.</Premium>
        </h1>

        {role === 'artist' ? (
          <>
            <div className={`mt-8 mb-12 flex gap-8 border-b ${theme.borderBase} pb-px overflow-x-auto`}>
              <button onClick={() => setActiveTab('logistics')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'logistics' ? 'border-b-2 border-black !text-black' : 'text-black/40 hover:!text-black'}`}>profile & logistics</button>
              <button onClick={() => setActiveTab('overview')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'overview' ? 'border-b-2 border-black !text-black' : 'text-black/40 hover:!text-black'}`}>overview</button>
              <button onClick={() => setActiveTab('briefs')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'briefs' ? 'border-b-2 border-black !text-black' : 'text-black/40 hover:!text-black'}`}>new bookings {bookings.length > 0 && `(${bookings.length})`}</button>
              <button onClick={() => setActiveTab('reviews')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'reviews' ? 'border-b-2 border-black !text-black' : 'text-black/40 hover:!text-black'}`}>
                reviews {artistReviews.length > 0 && `(${artistReviews.length})`}
              </button>
              <button onClick={() => setLocation(`/artist/${session?.user.id}?style=${styleVersion}`)} className={`${theme.navLink} whitespace-nowrap pb-4 !text-[#BA965B] hover:!text-black transition-colors !border-none !bg-transparent`}>preview public page ↗</button>
            </div>

            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>new bookings</p>
                  <p className={`mt-4 ${theme.stat} !text-[#BA965B]`}>{bookings.length}</p>
                </div>
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>upcoming bookings</p>
                  <p className={`mt-4 ${theme.stat}`}>0</p>
                </div>
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>travel radius</p>
                  <p className={`mt-4 ${theme.stat}`}>{artistProfile?.max_travel_km || 0} km</p>
                </div>
              </div>
            )}

            {activeTab === 'briefs' && (
              <div className={`max-w-4xl bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                <div className="mb-8"><h3 className={theme.headingModal}>new <Premium>bookings.</Premium></h3></div>
                {bookings.length > 0 ? (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking.id} className={`border ${theme.borderBase} bg-white p-6 sm:p-8 ${theme.cardRadius}`}>
                        <div className={`flex flex-col justify-between gap-4 border-b ${theme.borderBase} pb-6 sm:flex-row sm:items-center`}>
                          <div><h4 className={theme.headingModal}>{booking.client?.full_name || 'canvas client'}</h4></div>
                          <div className="flex gap-3 items-center">
                            {booking.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className={`${theme.btnPrimary} !bg-[#BA965B] !border-none !text-white`}>accept</button>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'declined')} className={theme.btnOutline}>decline</button>
                              </>
                            )}
                            <button onClick={() => setActiveChatBooking(booking)} className={theme.btnPrimary}>chat</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`${theme.bodyText} !text-black/40`}>no new bookings.</p>
                )}
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className={`max-w-4xl bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                <div className="mb-8">
                  <h3 className={theme.headingModal}>client <Premium>reviews.</Premium></h3>
                  <p className={`mt-2 ${theme.bodyText} !text-black/50`}>
                    feedback and ratings from your completed bookings.
                  </p>
                </div>

                {artistReviews.length > 0 ? (
                  <div className="space-y-6">
                    {artistReviews.map((review) => (
                      <div key={review.id} className={`border ${theme.borderBase} bg-white p-6 sm:p-8 space-y-4 ${theme.cardRadius}`}>
                        <div className="flex justify-between items-center">
                          <h4 className={`${theme.headingModal} !text-xl`}>{review.client?.full_name || 'verified client'}</h4>
                          <div className="flex gap-1 text-[#BA965B]">
                            {[...Array(review.rating)].map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className={theme.quote}>"{review.comment}"</p>
                        <p className={theme.formLabel}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`${theme.bodyText} !text-black/40`}>no reviews yet.</p>
                )}
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className={`mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                <div className="mb-10">
                  <h3 className={theme.headingModal}>artist profile & <Premium>logistics.</Premium></h3>
                  <p className={`mt-2 ${theme.bodyText} !text-black/50`}>
                    complete your profile to appear in client searches.
                  </p>
                </div>

                <form onSubmit={handleSaveLogistics} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>profile picture *</label>
                      <input type="file" accept="image/*" className={`w-full ${theme.bodyText} file:mr-4 file:border-0 file:bg-black/5 file:px-4 file:py-2 file:${theme.cardRadius} file:${theme.formLabel} file:!text-black hover:file:bg-black/10 transition-all cursor-pointer`} />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>years of experience *</label>
                      <input 
                        type="text" 
                        value={formData.years_experience} 
                        onChange={(e) => setFormData({...formData, years_experience: e.target.value.replace(/\D/g, '')})} 
                        placeholder="e.g. 6" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>artist / business name *</label>
                      <input 
                        type="text" 
                        value={formData.business_name} 
                        onChange={(e) => setFormData({...formData, business_name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="e.g. kaushal makeover" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>base location in hyderabad *</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="e.g. jubilee hills" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>starting package price (₹) *</label>
                      <input 
                        type="text" 
                        value={formData.starting_price} 
                        onChange={(e) => setFormData({...formData, starting_price: e.target.value.replace(/\D/g, '')})} 
                        placeholder="15000" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>comfortable travel radius (km) *</label>
                      <input 
                        type="text" 
                        value={formData.max_travel_km} 
                        onChange={(e) => setFormData({...formData, max_travel_km: e.target.value.replace(/\D/g, '')})} 
                        placeholder="25" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>makeup specialisations *</label>
                      <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="e.g. bridal, editorial, party" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>qualifications / certifications *</label>
                      <input 
                        type="text" 
                        value={formData.qualifications} 
                        onChange={(e) => setFormData({...formData, qualifications: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="e.g. certified by mac" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className={`border-t ${theme.borderBase} pt-8 pb-4`}>
                    <label className={`mb-2 block ${theme.formLabel}`}>unavailable / blocked dates</label>
                    <p className={`mb-4 ${theme.bodyText} !text-black/40`}>select personal days or vacations when you are completely unavailable. (confirmed client bookings are blocked automatically).</p>
                    
                    <div className="flex gap-4 mb-4">
                      <input 
                        type="date" 
                        id="datePicker" 
                        className={`${theme.inputText}`} 
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
                        className={theme.btnPrimary}
                      >
                        block date
                      </button>
                    </div>

                    {formData.blocked_dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.blocked_dates.map(date => (
                           <span key={date} className={`border ${theme.borderBase} bg-white/50 px-4 py-2 ${theme.formLabel} flex items-center gap-3 ${theme.cardRadius}`}>
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

                  <div className={`bg-white/50 p-6 border-l-2 border-[#BA965B] ${styleVersion === '1' || styleVersion === '3' ? 'rounded-none' : 'rounded-r-xl'}`}>
                    <label className={`mb-2 block ${theme.formLabel}`}>primary portfolio upload *</label>
                    <p className={`mb-4 ${theme.bodyText} !text-black/40`}>must upload a minimum of 2 photos. no maximum limit.</p>
                    
                    <input type="file" multiple accept="image/*" onChange={handleAddPortfolioImage} className={`w-full ${theme.bodyText} file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:${theme.cardRadius} file:${theme.formLabel} file:!text-black hover:file:bg-black/10 transition-all cursor-pointer`} required={portfolio.length < 2} />
                    
                    {portfolio.length > 0 && (
                      <p className={`mt-4 ${theme.formLabel} !text-[#BA965B]`}>{portfolio.length} photo(s) currently in portfolio</p>
                    )}
                  </div>

                  <div className={`border-t ${theme.borderBase} pt-8`}>
                    <label className={`mb-4 block ${theme.formLabel}`}>do you offer any add-on skills? (e.g. hairstyling, brow tinting)</label>
                    <div className="flex gap-4 mb-6">
                      <button type="button" onClick={() => setHasAddonSkill(true)} className={`${theme.btnOutline} !py-2.5 ${hasAddonSkill ? '!bg-black !text-white !border-black' : ''}`}>
                        yes, i do
                      </button>
                      <button type="button" onClick={() => { setHasAddonSkill(false); setAddons([{ name: '', price: '', file: null }]); }} className={`${theme.btnOutline} !py-2.5 ${!hasAddonSkill ? '!bg-black !text-white !border-black' : ''}`}>
                        no
                      </button>
                    </div>

                    {hasAddonSkill && (
                      <div className="space-y-6">
                        {addons.map((addon, index) => (
                          <div key={index} className={`space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-white/50 p-6 border-l-2 border-[#BA965B] ${styleVersion === '1' || styleVersion === '3' ? 'rounded-none' : 'rounded-r-xl'} relative`}>
                            {addons.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = addons.filter((_, i) => i !== index);
                                  setAddons(updated);
                                }} 
                                className={`absolute top-4 right-4 ${theme.navLink} !text-red-600 hover:underline !border-none !bg-transparent`}
                              >
                                remove skill
                              </button>
                            )}

                            <p className={`${theme.eyebrow} !text-[#BA965B]`}>add-on skill #{index + 1}</p>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label className={`mb-2 block ${theme.formLabel}`}>add-on skill name *</label>
                                <input 
                                  type="text" 
                                  value={addon.name} 
                                  onChange={(e) => {
                                    const updated = [...addons];
                                    updated[index].name = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setAddons(updated);
                                  }} 
                                  placeholder="e.g. brow tinting" 
                                  className={`w-full ${theme.inputText}`} 
                                  required={hasAddonSkill} 
                                />
                              </div>
                              <div>
                                <label className={`mb-2 block ${theme.formLabel}`}>add-on price (₹) *</label>
                                <input 
                                  type="text" 
                                  value={addon.price} 
                                  onChange={(e) => {
                                    const updated = [...addons];
                                    updated[index].price = e.target.value.replace(/\D/g, '');
                                    setAddons(updated);
                                  }} 
                                  placeholder="e.g. 1200" 
                                  className={`w-full ${theme.inputText}`} 
                                  required={hasAddonSkill} 
                                />
                              </div>
                            </div>
                            <div>
                              <label className={`mb-2 block ${theme.formLabel}`}>add-on portfolio upload *</label>
                              <p className={`mb-4 ${theme.bodyText} !text-black/40`}>must upload at least 1 photo showcasing this specific skill.</p>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  const updated = [...addons];
                                  updated[index].file = file;
                                  setAddons(updated);
                                }}
                                className={`w-full ${theme.bodyText} file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:${theme.cardRadius} file:${theme.formLabel} file:!text-black hover:file:bg-black/10 transition-all cursor-pointer`} 
                                required={hasAddonSkill && !addon.file} 
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setAddons([...addons, { name: '', price: '', file: null }])}
                          className={`w-full border border-dashed ${theme.borderBase} bg-white/40 py-4 ${theme.formLabel} ${theme.cardRadius} hover:border-black transition-colors`}
                        >
                          + add another add-on skill
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving || uploadingPortfolio} className={`${theme.btnPrimary} disabled:opacity-50`}>
                      {saving ? 'saving...' : 'save changes'}
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
                  <div key={booking.id} className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm flex justify-between items-center ${theme.cardRadius}`}>
                    <div>
                      <h4 className={theme.headingModal}>{booking.artist?.business_name || 'canvas artist'}</h4>
                      <p className={theme.formLabel}>{booking.artist?.city}</p>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => {
                          setBookingToReview(booking);
                          setReviewModalOpen(true);
                        }}
                        className={`${theme.navLink} !text-[#BA965B] hover:!text-black !bg-transparent !border-none`}
                      >
                        leave a review
                      </button>
                      <button onClick={() => setActiveChatBooking(booking)} className={theme.btnPrimary}>
                        open chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex min-h-[300px] flex-col items-center justify-center border border-dashed ${theme.borderBase} bg-white/40 p-8 text-center shadow-sm ${theme.cardRadius}`}>
                <p className={`${theme.headingModal} !text-black/30`}>no bookings yet.</p>
                <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={`mt-8 ${theme.btnPrimary}`}>browse artists</button>
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
            className={`flex items-center gap-2 ${theme.btnPrimary} shadow-2xl`}
          >
            <ArrowLeft size={14} /> wait, i'm a client
          </button>
        </div>
      )}

      {activeChatBooking && (
        <ChatDrawer open={Boolean(activeChatBooking)} bookingId={activeChatBooking.id} currentUserId={user?.id || ''} otherPartyName={role === 'artist' ? (activeChatBooking.client?.full_name || 'Client') : 'Artist Studio'} onClose={() => setActiveChatBooking(null)} />
      )}

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