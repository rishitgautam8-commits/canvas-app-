import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistCard } from './ArtistCard';

// Normalize an id for comparison: stringify, strip invisible whitespace, trim, lowercase.
// This guards against UUID casing differences, stray whitespace/non-breaking-space
// characters from data entry, and number-vs-string id types.
const normalizeId = (id: unknown): string =>
  String(id ?? '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .trim()
    .toLowerCase();

// Pull a usable image URL off a portfolio row, tolerating inconsistent column naming,
// and reject empty/whitespace-only strings so they don't count as "has an image".
const getPortfolioUrl = (p: any): string | null => {
  const url = p.image_url || p.url || p.image || p.photo_url;
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : null;
};

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
      // 1. Fetch from the correct table: artist_profiles
      const { data: artistsData, error: artistError } = await supabase.from('artist_profiles').select('*');
      if (artistError) throw artistError;

      // 2. Fetch portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase.from('artist_portfolio').select('*');
      if (portfolioError) console.error('Portfolio fetch error:', portfolioError);

      // 3. Group portfolio images by normalized artist_id in a single pass.
      // A Map keyed on the normalized id is both faster (O(n) instead of an O(n*m)
      // filter per artist) and immune to the casing/whitespace/type mismatches that
      // a raw === comparison can silently fail on.
      const portfolioByArtist = new Map<string, string[]>();
      (portfolioData || []).forEach((p: any) => {
        const key = normalizeId(p.artist_id);
        if (!key) return;
        const url = getPortfolioUrl(p);
        if (!url) return;
        if (!portfolioByArtist.has(key)) portfolioByArtist.set(key, []);
        portfolioByArtist.get(key)!.push(url);
      });

      // 4. Attach each artist's portfolio images.
      const combined = (artistsData || []).map((artist) => {
        const key = normalizeId(artist.id);
        const portfolioImages = portfolioByArtist.get(key) || [];

        if (portfolioImages.length === 0) {
          // Dev-time signal: if this fires for an artist you know has uploaded photos,
          // the artist_id values in artist_portfolio don't actually match this artist.id
          // (wrong FK on upload, or an id typo/case mismatch in the data itself).
          console.warn(
            `[Directory] No portfolio images matched for "${artist.business_name}" (id: ${artist.id}).`
          );
        }

        return {
          ...artist,
          portfolioImages,
          // Real uploaded portfolio work takes priority. artist_profiles has no
          // confirmed image column, so any stray/legacy value like portfolio_url
          // is only used as a last resort, and only if it's a real, non-empty string.
          // Previously this was checked FIRST, so a stale or malformed value there
          // would silently shadow perfectly good portfolio images and break the
          // image, which is what produces the placeholder-initials fallback in
          // ArtistCard's onError handler.
          primaryImage:
            portfolioImages[0] ||
            (typeof artist.portfolio_url === 'string' && artist.portfolio_url.trim().length > 0
              ? artist.portfolio_url.trim()
              : '')
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
        const id = normalizeId(item.artist_id);
        if (!id) return;
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
          const match = rankedMatches.find(m => normalizeId(m.artistId) === normalizeId(artist.id));
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
                name={artist.business_name}
                image={artist.primaryImage}
                portfolioImages={artist.portfolioImages}
                startingPrice={artist.starting_price ? `₹${artist.starting_price.toLocaleString('en-IN')}` : 'Starts at ₹5,000'}
                tags={artist.category ? artist.category.split(',').map((t: string) => t.trim()) : ['BRIDAL', 'HD MAKEUP']}
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