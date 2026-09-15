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
    <div className="w-full space-y-8">
      {/* Upload Component */}
      <ArtistPhotoUpload 
        artistId={artistId} 
        onUploadComplete={fetchPortfolio} 
      />

      {/* Portfolio Gallery Display */}
      <div className="space-y-4 pt-6 border-t border-black/10">
        <h3 className="text-xs font-medium uppercase tracking-widest text-black/50">Your Live Portfolio & AI Tags</h3>
        
        {loading ? (
          <div className="text-black/40 text-sm">Loading your portfolio...</div>
        ) : portfolio.length === 0 ? (
          <div className="p-8 bg-white/40 rounded-xl border border-dashed border-black/10 text-center text-black/40 text-sm">
            No portfolio photos uploaded yet. Upload your first look above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-black/5 space-y-3 shadow-sm">
                <img 
                  src={item.image_url} 
                  alt="Artist portfolio look" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="flex flex-wrap gap-1.5">
                  {item.tags?.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-0.5 bg-black/5 text-black/70 text-xs rounded-md font-medium border border-black/5"
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