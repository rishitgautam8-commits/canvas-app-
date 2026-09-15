import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistCard } from './ArtistCard';

interface PortfolioItem {
  image_url: string;
  tags: string[];
}

interface Artist {
  id: string;
  name: string;
  studio_name: string;
  starting_price: number | string;
  avatar_url?: string;
  location: string;
  tags?: string[];
  artist_portfolio?: PortfolioItem[];
  matchPercentage?: number;
  matchReasons?: string[];
}

interface ArtistMatch {
  artistId: string;
  matchPercentage: number;
  matchedTags: string[];
}

export function Directory({ onSelectArtist }: { onSelectArtist: (artistId: string) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial artist list with joined portfolio items from Supabase on load
  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('artists')
      .select(`
        *,
        artist_portfolio (
          image_url,
          tags
        )
      `);

    if (error) {
      console.error('Error fetching artists directory:', error);
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
        ) : artists.length === 0 ? (
          <div className="text-stone-500 text-sm">No artists found in the directory.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artists.map((artist) => {
              // Map joined portfolio rows into an array of image URLs
              const portfolioImages = artist.artist_portfolio?.map(item => item.image_url) || [];
              const primaryImage = artist.avatar_url || portfolioImages[0];

              return (
                <ArtistCard
                  key={artist.id}
                  name={artist.name}
                  image={primaryImage}
                  portfolioImages={portfolioImages}
                  startingPrice={artist.starting_price || 'Starts at ₹5,000'}
                  tags={artist.tags || ['BRIDAL', 'HD MAKEUP']}
                  matchPercentage={artist.matchPercentage}
                  onClick={() => onSelectArtist(artist.id)}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Directory;