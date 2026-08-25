import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ChatDrawer } from '@/components/ChatDrawer';
import { ArtistOnboardingModal } from '@/components/ArtistOnboardingModal';
import { ArrowLeft, Save, Calendar, MapPin, Sparkles } from 'lucide-react';

export default function Dashboard() {
    const [portfolio, setPortfolio] = useState<string[]>([]);
const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [, setLocation] = useLocation();
  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [clientBookings, setClientBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'briefs'>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLocation('/');
        return;
      }

      // Fetch Base Profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setProfile(userData);

        if (userData.role === 'artist') {
          const { data: artistData } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!artistData || !artistData.business_name) {
            // Trigger mandatory onboarding wizard if profile details are missing
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

          // Fetch bookings for this artist. NOTE: this used to be a single
          // embedded select (`client:profiles!client_id(full_name, email)`).
          // That relies on PostgREST discovering a bookings.client_id -> profiles.id
          // relationship in its schema cache. If that relationship isn't
          // registered (or is ambiguous), the query errors out and `data`
          // comes back undefined -- previously that error was never checked,
          // so bookings silently stayed empty. Split into two plain queries
          // instead, and actually check for errors.
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('artist_id', session.user.id)
            .order('created_at', { ascending: false });

          if (bookingsError) {
            console.error('Failed to load artist bookings:', bookingsError);
          }

          if (bookingsData && bookingsData.length > 0) {
            const clientIds = [...new Set(bookingsData.map((b) => b.client_id))];
            const { data: clientsData, error: clientsError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', clientIds);

            if (clientsError) {
              console.error('Failed to load client profiles for bookings:', clientsError);
            }

            const clientsById = Object.fromEntries((clientsData || []).map((c) => [c.id, c]));
            setBookings(bookingsData.map((b) => ({ ...b, client: clientsById[b.client_id] || null })));
          } else {
            setBookings(bookingsData || []);
          }
        } else {
          // Client role: fetch bookings this client has made, then fetch the
          // relevant artist_profiles rows separately (same reasoning as above --
          // avoid depending on an embedded-join relationship existing in the
          // schema cache).
          const { data: clientBookingsData, error: clientBookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('client_id', session.user.id)
            .order('created_at', { ascending: false });

          if (clientBookingsError) {
            console.error('Failed to load client bookings:', clientBookingsError);
          }

          if (clientBookingsData && clientBookingsData.length > 0) {
            const artistIds = [...new Set(clientBookingsData.map((b) => b.artist_id))];
            const { data: artistsData, error: artistsError } = await supabase
              .from('artist_profiles')
              .select('id, business_name, city')
              .in('id', artistIds);

            if (artistsError) {
              console.error('Failed to load artist profiles for bookings:', artistsError);
            }

            const artistsById = Object.fromEntries((artistsData || []).map((a) => [a.id, a]));
            setClientBookings(
              clientBookingsData.map((b) => ({ ...b, artist: artistsById[b.artist_id] || null }))
            );
          } else {
            setClientBookings(clientBookingsData || []);
          }
        }
      }
      setLoading(false);
    }

    loadDashboard();
  }, [setLocation]);

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
  
    const { error } = await supabase
      .from('artist_profiles')
      .update({
        business_name: formData.business_name,
        category: formData.category,
        city: formData.city,
        max_travel_km: formData.max_travel_km,
        starting_price: formData.starting_price,
      })
      .eq('id', profile.id);
  
    setSaving(false);
  
    if (error) {
      window.alert(`Error saving: ${error.message}`);
    } else {
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
  
      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file, { upsert: true });
  
      if (uploadError) throw uploadError;
  
      const { data: publicUrlData } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath);
  
      const updatedPortfolio = [...portfolio, publicUrlData.publicUrl];
  
      const { error: updateError } = await supabase
        .from('artist_profiles')
        .update({ portfolio: updatedPortfolio })
        .eq('id', profile.id);
  
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
  
    const { error } = await supabase
      .from('artist_profiles')
      .update({ portfolio: updatedPortfolio })
      .eq('id', profile.id);
  
    if (error) {
      window.alert(`Failed to remove image: ${error.message}`);
    } else {
      setPortfolio(updatedPortfolio);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0118] text-white">
        <p className="eyebrow animate-pulse text-[#e0aaff]">Loading your studio...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const displayFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'declined') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      window.alert(`Failed to update booking: ${error.message}`);
    } else {
      setBookings((prevBookings) =>
        prevBookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      window.alert(`Booking successfully ${newStatus}!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0118] text-white selection:bg-[#e0aaff] selection:text-[#251037]">
      {/* Dashboard Header */}
      <header className="border-b border-white/10 bg-[#1d0938]/30 px-6 py-6 backdrop-blur-md sm:px-12">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Canvas
          </button>
          <div className="flex items-center gap-4">
            <span className="eyebrow rounded-full bg-[#e0aaff]/10 px-4 py-1.5 text-[#e0aaff]">
              {profile?.role === 'artist' ? 'Artist Studio Hub' : 'Client Hub'}
            </span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#e0aaff] to-[#251037]" />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="mx-auto max-w-[1400px] px-6 py-12 sm:px-12">
        <h1 className="serif text-5xl sm:text-7xl">Welcome, {displayFirstName}.</h1>

        {profile?.role === 'artist' ? (
          <>
            {/* Tabs */}
            <div className="mt-10 mb-8 flex gap-6 border-b border-white/10 pb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`eyebrow whitespace-nowrap pb-4 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-[#e0aaff] text-[#e0aaff]' : 'text-white/50 hover:text-white'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('briefs')}
                className={`eyebrow whitespace-nowrap pb-4 transition-colors ${activeTab === 'briefs' ? 'border-b-2 border-[#e0aaff] text-[#e0aaff]' : 'text-white/50 hover:text-white'}`}
              >
                New Bookings {bookings.length > 0 && `(${bookings.length})`}
              </button>
              <button
                onClick={() => setActiveTab('logistics')}
                className={`eyebrow whitespace-nowrap pb-4 transition-colors ${activeTab === 'logistics' ? 'border-b-2 border-[#e0aaff] text-[#e0aaff]' : 'text-white/50 hover:text-white'}`}
              >
                Profile & Logistics
              </button>
            </div>

            {/* Tab Content: Overview */}
            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="glass rounded-[2rem] p-8 bg-[#150A26] border border-white/10">
                  <p className="eyebrow text-white/50">New Bookings</p>
                  <p className="serif mt-4 text-6xl text-[#e0aaff]">{bookings.length}</p>
                  <p className="mt-4 text-sm text-white/60">
                    {bookings.length === 0 ? 'No new bookings to review.' : 'Action required on new bookings.'}
                  </p>
                </div>
                <div className="glass rounded-[2rem] p-8 bg-[#150A26] border border-white/10">
                  <p className="eyebrow text-white/50">Upcoming Bookings</p>
                  <p className="serif mt-4 text-6xl">0</p>
                  <p className="mt-4 text-sm text-white/60">Your calendar is clear.</p>
                </div>
                <div className="glass rounded-[2rem] p-8 bg-[#150A26] border border-white/10">
                  <p className="eyebrow text-white/50">Travel Radius</p>
                  <p className="serif mt-4 text-5xl">{artistProfile?.max_travel_km || 0} km</p>
                  <p className="mt-4 text-sm text-white/60">Based in {artistProfile?.city || 'Jubilee Hills'}</p>
                </div>
              </div>
            )}

            {/* Tab Content: New Bookings */}
            {activeTab === 'briefs' && (
              <div className="glass max-w-4xl rounded-[2rem] p-8 sm:p-12 bg-[#150A26] border border-white/10">
                <div className="mb-8">
                  <h3 className="serif text-3xl">New Bookings</h3>
                  <p className="mt-2 text-sm text-white/50">Review your secured client bookings and event logistics. All communication is strictly encrypted within Canvas.</p>
                </div>

                {bookings.length > 0 ? (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
                        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                          <div>
                            <span className="eyebrow rounded-full bg-[#e0aaff]/15 px-3 py-1 text-[10px] text-[#e0aaff]">
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <h4 className="serif mt-3 text-2xl">{booking.client?.full_name || 'Canvas Client'}</h4>
                            <p className="text-xs text-white/40">Secure Canvas Booking ID: {booking.id.slice(0, 8)}...</p>
                          </div>

                          <div className="flex flex-wrap gap-3 items-center">
                            {booking.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="eyebrow rounded-full border border-[#e0aaff]/40 bg-[#e0aaff]/10 px-4 py-2 text-[#e0aaff] transition-colors hover:bg-[#e0aaff]/20"
                                >
                                  Accept Brief
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'declined')}
                                  className="eyebrow rounded-full border border-white/20 bg-transparent px-4 py-2 transition-colors hover:bg-white/10"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className={`eyebrow rounded-full px-4 py-2 text-xs ${
                                booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {booking.status.toUpperCase()}
                              </span>
                            )}

                            <button
                              onClick={() => setActiveChatBooking(booking)}
                              className="eyebrow rounded-full border border-white/20 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/15"
                            >
                              Open Canvas Chat
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <Calendar className="mt-0.5 text-white/40" size={16} />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Date & Time</p>
                              <p className="mt-1 text-sm">{new Date(booking.event_date).toLocaleDateString()} · {booking.time_slot}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 text-white/40" size={16} />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Venue Address</p>
                              <p className="mt-1 text-sm">{booking.venue_address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <Sparkles className="mt-0.5 text-white/40" size={16} />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Look Details & Reference</p>
                              <p className="mt-1 text-sm leading-relaxed text-white/85">{booking.look_details}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                    <p className="serif text-3xl text-white/40">No new bookings.</p>
                    <p className="mt-3 max-w-sm text-sm text-white/40">When a client matches your filters and secures your slot, their event details and look requirements will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Logistics & Profile */}
            {activeTab === 'logistics' && (
  <>
    <form onSubmit={handleSaveLogistics} className="glass max-w-3xl rounded-[2rem] p-8 sm:p-12 bg-[#150A26] border border-white/10">
                <div className="mb-8">
                  <h3 className="serif text-3xl">Search Logistics</h3>
                  <p className="mt-2 text-sm text-white/50">These parameters control exactly when you appear in client search results.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <label className="block">
                    <span className="eyebrow text-white/55">Business / Brand Name</span>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      className="mt-3 w-full border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-[#e0aaff]"
                      placeholder="e.g. Kaushal Makeover"
                    />
                  </label>

                  <label className="block">
                    <span className="eyebrow text-white/55">Primary Category</span>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-3 w-full border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-[#e0aaff] [&>option]:bg-[#1d0938]"
                    >
                      <option value="Bridal & Wedding">Bridal & Wedding</option>
                      <option value="Party & Event Glam">Party & Event Glam</option>
                      <option value="Natural & Soft Aesthetics">Natural & Soft Aesthetics</option>
                      <option value="Editorial & High Fashion">Editorial & High Fashion</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="eyebrow text-white/55">Base City</span>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="mt-3 w-full border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-[#e0aaff]"
                      placeholder="e.g. Jubilee Hills, Hyderabad"
                    />
                  </label>

                  <label className="block">
                    <span className="eyebrow text-white/55">Max Travel Distance (KM)</span>
                    <div className="mt-3 flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="200"
                        step="5"
                        value={formData.max_travel_km}
                        onChange={(e) => setFormData({...formData, max_travel_km: parseInt(e.target.value)})}
                        className="w-full accent-[#e0aaff]"
                      />
                      <span className="serif text-xl">{formData.max_travel_km}km</span>
                    </div>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="eyebrow text-white/55">Starting Price (₹)</span>
                    <input
                      type="number"
                      value={formData.starting_price}
                      onChange={(e) => setFormData({...formData, starting_price: parseInt(e.target.value)})}
                      className="mt-3 w-full border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-[#e0aaff]"
                      placeholder="15000"
                    />
                  </label>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-[#e0aaff] px-8 py-4 text-xs font-bold tracking-[.16em] text-[#251037] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {saving ? 'SAVING...' : 'SAVE CHANGES'} {!saving && <Save size={16} />}
                  </button>
                </div>
                </form>

<div className="glass mt-8 max-w-3xl rounded-[2rem] p-8 sm:p-12 bg-[#150A26] border border-white/10">
  <div className="mb-8">
    <h3 className="serif text-3xl">Portfolio</h3>
    <p className="mt-2 text-sm text-white/50">These images are shown to clients on your public profile.</p>
  </div>

  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    {portfolio.map((url) => (
      <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
        <img src={url} alt="Portfolio piece" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => handleRemovePortfolioImage(url)}
          className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Remove
        </button>
      </div>
    ))}

    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-center transition-colors hover:border-[#e0aaff]">
      <span className="eyebrow text-white/60">
        {uploadingPortfolio ? 'Uploading...' : '+ Add Image'}
      </span>
      <input
        type="file"
        accept="image/*"
        disabled={uploadingPortfolio}
        onChange={handleAddPortfolioImage}
        className="hidden"
      />
    </label>
  </div>
  </div>
      </>
    )}
  </>
) : (
          <div className="mt-12">
            {clientBookings.length > 0 ? (
              <div className="max-w-3xl space-y-6">
                {clientBookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <span
                        className={`eyebrow rounded-full px-3 py-1 text-[10px] ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : booking.status === 'declined'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-[#e0aaff]/15 text-[#e0aaff]'
                        }`}
                      >
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <h4 className="serif mt-3 text-2xl">{booking.artist?.business_name || 'Canvas Artist'}</h4>
                      <p className="text-xs text-white/40">{booking.artist?.city}</p>
                    </div>
                
                    <button
                      onClick={() => setActiveChatBooking(booking)}
                      className="eyebrow rounded-full border border-white/20 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/15"
                    >
                      Open Canvas Chat
                    </button>
                  </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 text-white/40" size={16} />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Date & Time</p>
                          <p className="mt-1 text-sm">{new Date(booking.event_date).toLocaleDateString()} · {booking.time_slot}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 text-white/40" size={16} />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Venue Address</p>
                          <p className="mt-1 text-sm">{booking.venue_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60">Your upcoming appointments and saved artists will appear here.</p>
            )}
          </div>
        )}
      </main>

      {/* Mandatory Artist Onboarding Modal Popup */}
      <ArtistOnboardingModal
        open={showOnboarding}
        userId={profile?.id}
        onComplete={() => {
          setShowOnboarding(false);
          window.location.reload();
        }}
      />

      {activeChatBooking && (
        <ChatDrawer
          open={Boolean(activeChatBooking)}
          bookingId={activeChatBooking.id}
          currentUserId={profile.id}
          otherPartyName={profile.role === 'artist' ? (activeChatBooking.client?.full_name || 'Client') : 'Artist Studio'}
          onClose={() => setActiveChatBooking(null)}
        />
      )}
    </div>
  );
}