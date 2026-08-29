import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, MessageSquare, Star, MapPin, Award, Clock } from 'lucide-react';

export default function ArtistProfile() {
  const [, params] = useRoute('/artist/:id');
  const [, setLocation] = useLocation();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const artistId = params?.id;

  useEffect(() => {
    async function fetchArtist() {
      if (!artistId) return;
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) {
        console.error('Error fetching artist:', error.message);
      } else {
        setArtist(data);
      }
      setLoading(false);
    }

    fetchArtist();
  }, [artistId]);

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
            <button onClick={() => window.alert('Booking & Chat feature coming live!')} className="flex items-center justify-center gap-2 border border-black bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#B66CF2] hover:border-[#B66CF2] transition-colors">
              <MessageSquare size={14} /> Chat & Book Live
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
                  <button onClick={() => window.alert(`Enquiring about Look ${index + 1}`)} className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#B66CF2] transition-colors">
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
    </div>
  );
}