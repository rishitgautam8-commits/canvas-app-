import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistCard } from './ArtistCard';

export function Directory({ onSelectArtist }: { onSelectArtist: (artistId: string) => void }) {
  const [artists, setArtists] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      // 1. Fetch artists
      const { data: artistsData, error: artistError } = await supabase.from('artists').select('*');
      if (artistError) throw artistError;

      // 2. Fetch portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase.from('artist_portfolio').select('*');
      if (portfolioError) console.error('Portfolio fetch error:', portfolioError);

      // DEBUG: Check your browser console (F12) to see what Supabase actually contains
      console.log('RAW ARTISTS DATA:', artistsData);
      console.log('RAW PORTFOLIO DATA:', portfolioData);

      // 3. Robust mapping handling different column names and ID types
      const combined = (artistsData || []).map((artist) => {
        const matchingPortfolios = (portfolioData || []).filter(
          (p: any) => String(p.artist_id).trim() === String(artist.id).trim()
        );

        // Extract image URL checking multiple possible column names
        const portfolioImages = matchingPortfolios
          .map((p: any) => p.image_url || p.url || p.image || p.photo_url)
          .filter(Boolean);

        return {
          ...artist,
          portfolioImages,
          primaryImage: artist.image_url || artist.avatar_url || artist.url || portfolioImages[0]
        };
      });

      setArtists(combined);
    } catch (error) {
      console.error('Error fetching directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateArtistMatches = async (clientTags: string[]): Promise<any[]> => {
    try {
      const { data: portfolios } = await supabase.from('artist_portfolio').select('artist_id, tags');
      if (!portfolios) return [];

      const artistTagMap: { [artistId: string]: Set<string> } = {};
      portfolios.forEach((item) => {
        const id = String(item.artist_id);
        if (!artistTagMap[id]) artistTagMap[id] = new Set();
        item.tags?.forEach((tag: string) => artistTagMap[id].add(tag.toUpperCase()));
      });

      const clientTagsUpper = clientTags.map(t => t.toUpperCase());

      return Object.keys(artistTagMap).map((artistId) => {
        const artistTags = artistTagMap[artistId];
        const matchedTags = clientTagsUpper.filter(tag => artistTags.has(tag));
        let score = 70;
        if (clientTagsUpper.length > 0) {
          score = Math.min(Math.max(Math.round((matchedTags.length / clientTagsUpper.length) * 100), 58), 95);
        }
        return { artistId, matchPercentage: score, matchedTags };
      });
    } catch (err) {
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

      setArtists(prev => {
        const updated = prev.map(artist => {
          const match = rankedMatches.find(m => String(m.artistId) === String(artist.id));
          return { ...artist, matchPercentage: match ? match.matchPercentage : 70 };
        });
        return updated.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      });
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 bg-white min-h-screen">
      <div className="p-8 bg-stone-50 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">Upload A Pinterest Screenshot Or Instagram Save</h2>
        <p className="text-xs text-stone-500 uppercase tracking-widest">JPG, PNG, WEBP • MAX 10MB • OR DRAG & DROP</p>
        <label className="inline-block px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-stone-800 transition shadow">
          {analyzing ? 'Analyzing Aesthetic Match...' : 'Select Inspiration Photo 📸'}
          <input type="file" accept="image/*" onChange={handleImageUploadSimulation} className="hidden" />
        </label>
      </div>

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

      <div>
        <h3 className="text-lg font-bold text-stone-900 mb-6">Meet The Artists (Sorted by AI Match)</h3>
        {loading ? (
          <div className="text-stone-500 text-sm">Loading curated directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                name={artist.name}
                image={artist.primaryImage}
                portfolioImages={artist.portfolioImages}
                startingPrice={artist.starting_price || artist.price || 'Starts at ₹5,000'}
                tags={artist.tags || ['BRIDAL', 'HD MAKEUP']}
                matchPercentage={artist.matchPercentage}
                onClick={() => onSelectArtist(artist.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Directory;