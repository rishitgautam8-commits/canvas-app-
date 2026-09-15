import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Artist {
  id: string;
  name: string;
  studio_name: string;
  price: number;
  image_url: string;
  location: string;
  matchPercentage?: number;
}

interface ArtistMatch {
  artistId: string;
  matchPercentage: number;
  matchedTags: string[];
}

export function Directory() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial artist list from Supabase on load
  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('artists').select('*');
    if (error) {
      console.error('Error fetching artists:', error);
    } else {
      setArtists(data || []);
    }
    setLoading(false);
  };

  // 2. The Matching Algorithm Function
  const calculateArtistMatches = async (clientTags: string[]): Promise<ArtistMatch[]> => {
    try {
      const { data: portfolios, error } = await supabase
        .from('artist_portfolio')
        .select('artist_id, tags');

      if (error) throw error;
      if (!portfolios || portfolios.length === 0) return [];

      const artistTagMap: { [artistId: string]: Set<string> } = {};
      portfolios.forEach((item) => {
        if (!artistTagMap[item.artist_id]) {
          artistTagMap[item.artist_id] = new Set();
        }
        item.tags?.forEach((tag: string) => artistTagMap[item.artist_id].add(tag.toUpperCase()));
      });

      const clientTagsUpper = clientTags.map(t => t.toUpperCase());

      return Object.keys(artistTagMap).map((artistId) => {
        const artistTags = artistTagMap[artistId];
        const matchedTags = clientTagsUpper.filter(tag => artistTags.has(tag));
        
        let score = 70; // baseline fallback
        if (clientTagsUpper.length > 0) {
          const rawRatio = matchedTags.length / clientTagsUpper.length;
          score = Math.min(Math.max(Math.round(rawRatio * 100), 58), 95);
        }

        return { artistId, matchPercentage: score, matchedTags };
      });
    } catch (err) {
      console.error('Error calculating matches:', err);
      return [];
    }
  };

  // 3. Triggered when client uploads or selects an inspiration photo
  const handleImageUploadSimulation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);

    // Simulate AI Vision extracting tags from the uploaded photo
    setTimeout(async () => {
      const mockTags = ['SOFT GLAM', 'SATIN', 'EYES', 'KOOL LINER', 'LIPS SATIN NUDE', 'OCCASION', 'BRIDAL', 'WARM', 'BROWN'];
      setExtractedTags(mockTags);

      // Run matching engine against database portfolio tags
      const rankedMatches = await calculateArtistMatches(mockTags);

      // Sort and update artist cards by match percentage
      setArtists(prevArtists => {
        const updated = prevArtists.map(artist => {
          const match = rankedMatches.find(m => m.artistId === artist.id);
          return {
            ...artist,
            matchPercentage: match ? match.matchPercentage : 70
          };
        });
        return updated.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      });

      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 bg-white min-h-screen">
      
      {/* Hero Upload Section */}
      <div className="p-8 bg-stone-50 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">Upload A Pinterest Screenshot Or Instagram Save</h2>
        <p className="text-xs text-stone-500 uppercase tracking-widest">JPG, PNG, WEBP • MAX 10MB • OR DRAG & DROP</p>
        
        <label className="inline-block px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-stone-800 transition shadow">
          {analyzing ? 'Analyzing Aesthetic Match...' : 'Select Inspiration Photo 📸'}
          <input type="file" accept="image/*" onChange={handleImageUploadSimulation} className="hidden" />
        </label>
      </div>

      {/* Extracted Tags Bar (Visible after analysis) */}
      {extractedTags.length > 0 && (
        <div className="p-6 bg-stone-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs tracking-wider text-stone-400 uppercase font-semibold">Canvas AI Vision</span>
            <h4 className="text-lg font-bold">Aesthetic Profile Extracted</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {extractedTags.map((tag, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-stone-800 text-stone-200 text-xs rounded-lg border border-stone-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Artists Grid */}
      <div>
        <h3 className="text-lg font-bold text-stone-900 mb-6">Meet The Artists (Sorted by AI Match)</h3>
        
        {loading ? (
          <div className="text-stone-500 text-sm">Loading curated directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <div key={artist.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="relative h-64 bg-stone-100">
                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  {artist.matchPercentage && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-stone-900 text-xs font-bold rounded-full shadow">
                      ✨ {artist.matchPercentage}% Match
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <h4 className="font-bold text-stone-900 text-lg">{artist.name}</h4>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">{artist.location || 'Banjara Hills, Hyderabad'}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span className="text-sm font-semibold text-stone-900">₹{artist.price?.toLocaleString()}</span>
                    <button className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition">
                      View Profile & Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}