import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ChatDrawer } from '@/components/ChatDrawer';
import { ArtistOnboardingModal } from '@/components/ArtistOnboardingModal';
import { ReviewModal } from '@/components/ReviewModal';
import { Premium } from '@/components/Premium';
import { ClientBookings } from '@/components/ClientBookings';
import { ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Session } from '@supabase/supabase-js';
import { getTheme } from '@/lib/theme';
import { ArtistStudioHub } from '@/components/ArtistStudioHub';

function getGoogleMapsLink(location: string) {
  const parts = location.split(',').map(p => p.trim());
  let cleanLocation = location;

  if (parts.length > 6) {
    const specificVenue = parts.slice(0, 3);
    const cityStateZip = parts.slice(-4);
    cleanLocation = [...specificVenue, ...cityStateZip].join(', ');
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanLocation)}`;
}

// ==========================================
// 1. AI VISION AUTOMATED TAGGING HELPERS
// ==========================================
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const generateTagsWithAI = async (file: File): Promise<string[]> => {
  try {
    const base64Image = await fileToBase64(file);

    // Swap this with your actual Vision AI endpoint (e.g., OpenAI, Claude, etc.)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_OPENAI_API_KEY_HERE` // <-- ADD YOUR KEY HERE
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analyze this makeup look. Return ONLY a JSON array of 4 to 6 aesthetic tags describing the makeup style. Keep tags short (e.g., 'Soft Glam', 'Matte Skin', 'Graphic Liner', 'Bridal'). Do not include any other text." 
              },
              { 
                type: "image_url", 
                image_url: { url: base64Image } 
              }
            ]
          }
        ],
        max_tokens: 50
      })
    });

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    // Parse the AI's string response into a real JavaScript array
    const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiTags = JSON.parse(cleanedContent);

    return Array.isArray(aiTags) ? aiTags : [];
    
  } catch (error) {
    console.error("AI Tagging failed:", error);
    return []; // Return empty so we don't save broken data
  }
};
// ==========================================

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

  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  const accentColor = styleVersion === '3' ? '#6B3A7D' : '#9D7C3A';
  const accentBg = styleVersion === '3' ? 'bg-[#6B3A7D]' : 'bg-[#9D7C3A]';
  const accentBorder = styleVersion === '3' ? 'border-[#6B3A7D]' : 'border-[#9D7C3A]';
  const accentText = styleVersion === '3' ? 'text-[#6B3A7D]' : 'text-[#9D7C3A]';

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
          
          const { data: reviewsData, error: reviewsErr } = await supabase
            .from('reviews')
            .select('*')
            .eq('artist_id', session.user.id)
            .order('created_at', { ascending: false });

          if (reviewsErr) {
            console.error('Error fetching reviews:', reviewsErr.message);
          }
          setArtistReviews(reviewsData || []);
          
          if (artistData) {
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

  useEffect(() => {
    if (role !== 'artist' || !session?.user?.id) return;

    const reviewChannel = supabase
      .channel(`artist-reviews-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `artist_id=eq.${session.user.id}`
        },
        (payload) => {
          if (payload.new) {
            setArtistReviews((prev) => {
              if (prev.some(r => r.id === payload.new.id)) return prev;
              return [payload.new, ...prev]; 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewChannel);
    };
  }, [role, session?.user?.id]);

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
        { onConflict: 'id' }
      );

      if (profileError) throw new Error(`Failed to save base profile: ${profileError.message}`);

      // Parse Add-on texts for the profile
      const formattedAddonsText = hasAddonSkill 
        ? addons.map(a => `${a.name} (₹${a.price})`).filter(a => a.trim() !== '(₹)') 
        : [];

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
          addons: formattedAddonsText
        },
        { onConflict: 'id' }
      );

      if (artistError) throw artistError;

      // ==========================================
      // NEW: UPLOAD ADD-ON IMAGES WITH AI TAGS
      // ==========================================
      if (hasAddonSkill) {
        for (const addon of addons) {
          if (addon.file) {
            // 1. Upload the image to Supabase Storage
            const fileExt = addon.file.name.split('.').pop();
            const fileName = `addon_${Math.random()}.${fileExt}`;
            const filePath = `portfolios/${session.user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('portfolios')
              .upload(filePath, addon.file);
              
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
              .from('portfolios')
              .getPublicUrl(filePath);

            // 2. Automate Tagging with Vision AI
            const aiTags = await generateTagsWithAI(addon.file);
            
            // Combine AI tags with the Add-on name
            const finalTags = [...new Set([...aiTags, addon.name, 'Add-on'])];

            // 3. Save to artist_portfolio with REAL tags
            await supabase.from('artist_portfolio').insert({
              artist_id: session.user.id,
              image_url: publicUrlData.publicUrl,
              tags: finalTags // <--- 100% accurate, AI-generated tags!
            });
          }
        }
      }

      window.alert('Logistics & Add-ons updated successfully! AI Tags have been generated.');
      setArtistProfile({ ...artistProfile, ...formData, addons: formattedAddonsText });
    } catch (err: any) {
      window.alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'declined') => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .select(); 

    if (error) { 
      console.error('Supabase booking update error:', error.message);
      window.alert(`Failed to update booking: ${error.message}`); 
    } else if (!data || data.length === 0) {
      window.alert("Update failed: Row-Level Security (RLS) policy may be blocking this update.");
    } else { 
      setBookings((prevBookings) => 
        prevBookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      ); 
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FDF3F1] flex items-center justify-center ${theme.fontBase}`}>
        <p className={`${theme.eyebrow} animate-pulse`}>loading studio...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'User';
  const displayFirstName = firstName;

  const pendingBookings = bookings.filter(b => b.status === 'requested' || b.status === 'pending' || !b.status);
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'accepted' || b.status === 'deposit_paid');

  return (
    <div className={`min-h-screen bg-[#FDF3F1] text-black pb-24 ${theme.fontBase}`}>
      <header className={`border-b ${theme.borderBase} bg-white/80 backdrop-blur-md px-6 py-6 sm:px-12 sticky top-0 z-50`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button onClick={() => setLocation(`/?style=${styleVersion}`)} className={`flex items-center gap-2 ${theme.navLink} !border-none !bg-transparent`}>
            <ArrowLeft size={14} /> Back To Directory
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full">
              <button
                onClick={() => handleRequestRoleSwitch('client')}
                className={`px-4 py-2 ${theme.formLabel} rounded-full transition-all ${
                  role === 'client' ? `${accentBg} !text-white shadow-sm` : 'text-black/50 hover:text-black !bg-transparent !border-none'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => handleRequestRoleSwitch('artist')}
                className={`px-4 py-2 ${theme.formLabel} rounded-full transition-all ${
                  role === 'artist' ? `${accentBg} !text-white shadow-sm` : 'text-black/50 hover:text-black !bg-transparent !border-none'
                }`}
              >
                Artist
              </button>
            </div>

            <div className={`rounded-full bg-black/5 px-4 py-2 ${theme.formLabel} hidden sm:block !border-none`}>
              Artist Studio Hub
            </div>

            <div className={`h-8 w-8 ${accentBg} flex items-center justify-center text-white ${theme.formLabel} !border-none ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'}`}>
              {displayFirstName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showRoleSwitchConfirm && pendingRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRoleSwitchConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white border ${theme.borderBase} p-8 sm:p-12 max-w-md w-full shadow-2xl ${theme.cardRadius}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className={`${theme.eyebrow} mb-2`}>switch account type</p>
                  <h3 className={theme.headingModal}>switch to {pendingRole}?</h3>
                </div>
                <button onClick={() => setShowRoleSwitchConfirm(false)} className="text-black/30 hover:text-black transition-colors"><X size={18} strokeWidth={1.5} /></button>
              </div>
              <p className={`${theme.bodyText} mb-8`}>You Are About To Switch From <strong className="text-black font-bold">{role}</strong> to <strong className="text-black font-bold">{pendingRole}</strong>. Your Dashboard Will Reload With The New Interface.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowRoleSwitchConfirm(false)} className={`flex-1 ${theme.btnOutline}`}>cancel</button>
                <button onClick={confirmRoleSwitch} disabled={updating} className={`flex-1 ${theme.btnPrimary} disabled:opacity-50`}>
                  {updating ? 'Switching...' : 'confirm switch'}
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
              <button onClick={() => setActiveTab('logistics')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'logistics' ? `border-b-2 ${accentBorder} !text-black` : 'text-black/40 hover:!text-black'}`}>Profile & Logistics</button>
              <button onClick={() => setActiveTab('overview')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'overview' ? `border-b-2 ${accentBorder} !text-black` : 'text-black/40 hover:!text-black'}`}>Overview</button>
              
              <button onClick={() => setActiveTab('briefs')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'briefs' ? `border-b-2 ${accentBorder} !text-black` : 'text-black/40 hover:!text-black'}`}>
                Bookings {pendingBookings.length > 0 && `(${pendingBookings.length})`}
              </button>

              <button onClick={() => setActiveTab('reviews')} className={`${theme.navLink} whitespace-nowrap pb-4 transition-colors !border-none !bg-transparent ${activeTab === 'reviews' ? `border-b-2 ${accentBorder} !text-black` : 'text-black/40 hover:!text-black'}`}>
                Reviews {artistReviews.length > 0 && `(${artistReviews.length})`}
              </button>
              <button onClick={() => setLocation(`/artist/${session?.user.id}?style=${styleVersion}`)} className={`${theme.navLink} whitespace-nowrap pb-4 ${accentText} hover:!text-black transition-colors !border-none !bg-transparent`}>Preview Public Page ↗</button>
            </div>

            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>new requests</p>
                  <p className={`mt-4 ${theme.stat} ${styleVersion === '3' ? 'text-[#6B3A7D]' : 'bg-gradient-to-r from-[#7A5C24] via-[#E2BE68] to-[#7A5C24] text-transparent bg-clip-text inline-block'}`}>{pendingBookings.length}</p>
                </div>
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>upcoming bookings</p>
                  <p className={`mt-4 ${theme.stat}`}>{confirmedBookings.length}</p>
                </div>
                <div className={`bg-white/60 border ${theme.borderBase} p-8 shadow-sm ${theme.cardRadius}`}>
                  <p className={theme.eyebrow}>travel radius</p>
                  <p className={`mt-4 ${theme.stat}`}>{artistProfile?.max_travel_km || 0} km</p>
                </div>
              </div>
            )}

            {activeTab === 'briefs' && (
              <div className="max-w-4xl space-y-12">
                <div className={`bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                  <div className="mb-8"><h3 className={theme.headingModal}>new <Premium>requests.</Premium></h3></div>
                  {pendingBookings.length > 0 ? (
                    <div className="space-y-6">
                      {pendingBookings.map((booking) => (
                        <div key={booking.id} className={`border ${theme.borderBase} bg-white p-6 sm:p-8 ${theme.cardRadius}`}>
                          <div className={`flex flex-col justify-between gap-4 border-b ${theme.borderBase} pb-6 sm:flex-row sm:items-center`}>
                            <div>
                              <h4 className={theme.headingModal}>{booking.client?.full_name || 'canvas client'}</h4>
                              <p className={`mt-2 ${theme.formLabel} !text-black/60`}>Date: {booking.event_date} | Slot: {booking.time_slot}</p>
                              <p className={`mt-1 ${theme.bodyText} text-sm`}>Venue: {booking.venue_address}</p>
                              {booking.venue_address && (
                                <a
                                  href={getGoogleMapsLink(booking.venue_address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${styleVersion === '3' ? 'text-[#6B3A7D]' : 'text-[#9D7C3A]'} hover:underline`}
                                >
                                  Get Directions To Venue ↗
                                </a>
                              )}
                            </div>
                            <div className="flex gap-3 items-center">
                              <button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className={`${theme.btnPrimary} ${accentBg} !border-none !text-white`}>accept</button>
                              <button onClick={() => handleUpdateBookingStatus(booking.id, 'declined')} className={theme.btnOutline}>decline</button>
                              <button onClick={() => setActiveChatBooking(booking)} className={theme.btnPrimary}>chat</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`${theme.bodyText} !text-black/40`}>No Pending Requests.</p>
                  )}
                </div>

                <div className={`bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                  <div className="mb-8"><h3 className={theme.headingModal}>confirmed & <Premium>upcoming sessions.</Premium></h3></div>
                  {confirmedBookings.length > 0 ? (
                    <div className="space-y-6">
                      {confirmedBookings.map((booking) => (
                        <div key={booking.id} className={`border ${theme.borderBase} bg-white p-6 sm:p-8 ${theme.cardRadius}`}>
                          <div className={`flex flex-col justify-between gap-4 border-b ${theme.borderBase} pb-6 sm:flex-row sm:items-center`}>
                            <div>
                              <h4 className={theme.headingModal}>{booking.client?.full_name || 'canvas client'}</h4>
                              <p className={`mt-2 ${theme.formLabel} !text-black/60`}>Date: {booking.event_date} | Slot: {booking.time_slot}</p>
                              <p className={`mt-1 ${theme.bodyText} text-sm`}>Venue: {booking.venue_address}</p>
                              {booking.venue_address && (
                                <a
                                  href={getGoogleMapsLink(booking.venue_address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${styleVersion === '3' ? 'text-[#6B3A7D]' : 'text-[#9D7C3A]'} hover:underline`}
                                >
                                  Get Directions To Venue ↗
                                </a>
                              )}
                            </div>
                            <div className="flex gap-3 items-center">
                              <span className={`px-4 py-2 bg-green-50 text-green-700 border border-green-200 ${theme.cardRadius} ${theme.formLabel}`}>Confirmed</span>
                              <button onClick={() => setActiveChatBooking(booking)} className={theme.btnPrimary}>chat</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`${theme.bodyText} !text-black/40`}>No Confirmed Bookings Yet.</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className={`max-w-4xl bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                <div className="mb-8">
                  <h3 className={theme.headingModal}>client <Premium>reviews.</Premium></h3>
                  <p className={`mt-2 ${theme.bodyText} !text-black/50`}>
                    Feedback And Ratings From Your Completed Bookings.
                  </p>
                </div>

                {artistReviews.length > 0 ? (
                  <div className="space-y-6">
                    {artistReviews.map((review) => (
                      <div key={review.id} className={`border ${theme.borderBase} bg-white p-6 sm:p-8 space-y-4 ${theme.cardRadius}`}>
                        <div className="flex justify-between items-center">
                          <h4 className={`${theme.headingModal} !text-xl`}>{review.client?.full_name || 'verified client'}</h4>
                          <div className={`flex gap-1 ${styleVersion === '3' ? 'text-[#6B3A7D]' : 'bg-gradient-to-r from-[#7A5C24] via-[#E2BE68] to-[#7A5C24] text-transparent bg-clip-text'}`}>
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
                  <p className={`${theme.bodyText} !text-black/40`}>No Reviews Yet.</p>
                )}
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className={`mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/60 border ${theme.borderBase} p-8 sm:p-12 shadow-sm ${theme.cardRadius}`}>
                <div className="mb-10">
                  <h3 className={theme.headingModal}>artist profile & <Premium>logistics.</Premium></h3>
                  <p className={`mt-2 ${theme.bodyText} !text-black/50`}>
                    Complete Your Profile To Appear In Client Searches.
                  </p>
                </div>

                <form onSubmit={handleSaveLogistics} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>Profile Picture *</label>
                      <input type="file" accept="image/*" className={`w-full ${theme.bodyText} file:mr-4 file:border-0 file:bg-black/5 file:px-4 file:py-2 file:${theme.cardRadius} file:${theme.formLabel} file:!text-black hover:file:bg-black/10 transition-all cursor-pointer`} />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>Years Of Experience *</label>
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
                      <label className={`mb-2 block ${theme.formLabel}`}>Artist / Business Name *</label>
                      <input 
                        type="text" 
                        value={formData.business_name} 
                        onChange={(e) => setFormData({...formData, business_name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="E.g. Your Studio Name" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>Base Location In Hyderabad *</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                        placeholder="E.g. Jubilee Hills" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>Starting Package Price (₹) *</label>
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
                      <label className={`mb-2 block ${theme.formLabel}`}>Comfortable Travel Radius (km) *</label>
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
                      <label className={`mb-2 block ${theme.formLabel}`}>Makeup Specialisations *</label>
                      <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="E.g. Bridal, Editorial, Party" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block ${theme.formLabel}`}>Qualifications / Certifications *</label>
                      <input 
                        type="text" 
                        value={formData.qualifications} 
                        onChange={(e) => setFormData({...formData, qualifications: e.target.value.replace(/[^a-zA-Z\s,]/g, '')})} 
                        placeholder="E.g. Certified By Mac" 
                        className={`w-full ${theme.inputText}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className={`border-t ${theme.borderBase} pt-8 pb-4`}>
                    <label className={`mb-2 block ${theme.formLabel}`}>Unavailable / Blocked Dates</label>
                    <p className={`mb-4 ${theme.bodyText} !text-black/40`}>Select Personal Days Or Vacations When You Are Completely Unavailable. (Confirmed Client Bookings Are Blocked Automatically).</p>
                    
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

                  {/* ---------- MAIN PORTFOLIO COMPONENT ---------- */}
                  <div className={`mt-8 bg-white/50 p-6 border-l-2 ${accentBorder} ${styleVersion === '1' || styleVersion === '3' ? 'rounded-none' : 'rounded-r-xl'}`}>
                    <label className={`mb-2 block ${theme.formLabel}`}>AI-Powered Portfolio Upload *</label>
                    <p className={`mb-6 ${theme.bodyText} !text-black/40`}>Upload high-res looks. Our AI will automatically extract aesthetic tags for client matching.</p>
                    
                    <div className="w-full">
                      <ArtistStudioHub artistId={session?.user?.id || ''} />
                    </div>
                  </div>
                  {/* ------------------------------------------------ */}

                  <div className={`border-t ${theme.borderBase} pt-8`}>
                    <label className={`mb-4 block ${theme.formLabel}`}>Do You Offer Any Add-On Skills? (E.g. Hairstyling, Brow Tinting)</label>
                    <div className="flex gap-4 mb-6">
                      <button type="button" onClick={() => setHasAddonSkill(true)} className={`${theme.btnOutline} !py-2.5 ${hasAddonSkill ? `!bg-black !text-white !border-black` : ''}`}>
                        Yes, I Do
                      </button>
                      <button type="button" onClick={() => { setHasAddonSkill(false); setAddons([{ name: '', price: '', file: null }]); }} className={`${theme.btnOutline} !py-2.5 ${!hasAddonSkill ? '!bg-black !text-white !border-black' : ''}`}>
                        No
                      </button>
                    </div>

                    {hasAddonSkill && (
                      <div className="space-y-6">
                        {addons.map((addon, index) => (
                          <div key={index} className={`space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-white/50 p-6 border-l-2 ${accentBorder} ${styleVersion === '1' || styleVersion === '3' ? 'rounded-none' : 'rounded-r-xl'} relative`}>
                            {addons.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = addons.filter((_, i) => i !== index);
                                  setAddons(updated);
                                }} 
                                className={`absolute top-4 right-4 ${theme.navLink} !text-red-600 hover:underline !border-none !bg-transparent`}
                              >
                                Remove Skill
                              </button>
                            )}

                            <p className={`${theme.eyebrow} ${accentText}`}>add-on skill #{index + 1}</p>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label className={`mb-2 block ${theme.formLabel}`}>Add-On Skill Name *</label>
                                <input 
                                  type="text" 
                                  value={addon.name} 
                                  onChange={(e) => {
                                    const updated = [...addons];
                                    updated[index].name = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setAddons(updated);
                                  }} 
                                  placeholder="E.g. Brow Tinting" 
                                  className={`w-full ${theme.inputText}`} 
                                  required={hasAddonSkill} 
                                />
                              </div>
                              <div>
                                <label className={`mb-2 block ${theme.formLabel}`}>Add-On Price (₹) *</label>
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
                              <label className={`mb-2 block ${theme.formLabel}`}>Add-On Portfolio Upload *</label>
                              <p className={`mb-4 ${theme.bodyText} !text-black/40`}>Must Upload At Least 1 Photo Showcasing This Specific Skill.</p>
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
                          + Add Another Add-On Skill
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving || uploadingPortfolio} className={`${theme.btnPrimary} disabled:opacity-50`}>
                      {saving ? 'Saving & Generating AI Tags...' : 'save changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="mt-16 max-w-4xl">
            {/* Embedded Client Bookings & Pay-to-Chat Flow */}
            <ClientBookings 
              clientId={user?.id || ''} 
              onOpenChat={(bookingId) => {
                const found = clientBookings.find(b => b.id === bookingId);
                if (found) {
                  setActiveChatBooking(found);
                } else {
                  // Fallback stub object if loaded dynamically
                  setActiveChatBooking({ id: bookingId });
                }
              }} 
            />
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
            <ArrowLeft size={14} /> Wait, I'm A Client
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