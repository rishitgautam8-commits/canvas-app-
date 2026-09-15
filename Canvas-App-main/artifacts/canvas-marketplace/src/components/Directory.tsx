import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistCard } from './ArtistCard';

interface PortfolioItem {
  id?: string;
  artist_id: string;
  image_url: string;
  tags: string[];
}

interface Artist {
  id: string;
  name: string;
  studio_name?: string;
  price?: number | string;
  starting_price?: number | string;
  image_url?: string;
  avatar_url?: string;
  location?: string;
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

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      // 1. Fetch all artists from database
      const { data: artistsData, error: artistError } = await supabase
        .from('artists')
        .select('*');

      if (artistError) throw artistError;

      // 2. Fetch all portfolio items independently
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('artist_portfolio')
        .select('*');

      if (portfolioError) {
        console.error('Error fetching portfolios:', portfolioError);
      }

      // 3. Map portfolio items to their corresponding artist ID
      const combinedArtists = (artistsData || []).map((artist) => {
        const matchingPortfolios = (portfolioData || []).filter(
          (item: PortfolioItem) => item.artist_id === artist.id
        );
        return {
          ...artist,
          artist_portfolio: matchingPortfolios
        };
      });

      setArtists(combinedArtists);
    } catch (err) {
      console.error('Unexpected error fetching directory:', err);
    } finally {
      setLoading(false);
    }
  };

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
        
        let score = 70;
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

  const handleImageUploadSimulation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);

    setTimeout(async () => {
      const mockTags = ['SOFT GLAM', 'SATIN', 'EYES', 'KOOL LINER', 'LIPS SATIN NUDE', 'OCCASION', 'BRIDAL', 'WARM', 'BROWN'];
      setExtractedTags(mockTags);

      const rankedMatches = await calculateArtistMatches(mockTags);

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

      {/* Extracted Tags Bar */}
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
              // Extract portfolio image URLs
              const portfolioImages = artist.artist_portfolio?.map(item => item.image_url) || [];
              
              // Fallback chain checks image_url first (matching original schema), then avatar, then portfolio
              const primaryImage = artist.image_url || artist.avatar_url || portfolioImages[0];
              const priceDisplay = artist.starting_price || artist.price || 'Starts at ₹5,000';

              return (
                <ArtistCard
                  key={artist.id}
                  name={artist.name}
                  image={primaryImage}
                  portfolioImages={portfolioImages}
                  startingPrice={priceDisplay}
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