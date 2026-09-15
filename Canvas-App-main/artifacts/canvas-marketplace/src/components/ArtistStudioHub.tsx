import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistPhotoUpload } from './ArtistPhotoUpload';

interface PortfolioItem {
  id: string;
  image_url: string;
  tags: string[];
}

export function ArtistStudioHub({ artistId }: { artistId: string }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('artist_portfolio')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio:', error);
    } else {
      setPortfolio(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();
  }, [artistId]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-stone-50 min-h-screen rounded-3xl border border-stone-200 mt-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Artist Studio Hub</h2>
        <p className="text-sm text-stone-500 mt-1">Manage your portfolio and auto-tag your makeup looks with AI.</p>
      </div>

      {/* Upload Component */}
      <ArtistPhotoUpload 
        artistId={artistId} 
        onUploadComplete={fetchPortfolio} 
      />

      {/* Portfolio Gallery Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-stone-900">Your Live Portfolio & AI Tags</h3>
        
        {loading ? (
          <div className="text-stone-500 text-sm">Loading your portfolio...</div>
        ) : portfolio.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
            No portfolio photos uploaded yet. Upload your first look above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                <img 
                  src={item.image_url} 
                  alt="Artist portfolio look" 
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="flex flex-wrap gap-1.5">
                  {item.tags?.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded-md font-medium border border-stone-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}