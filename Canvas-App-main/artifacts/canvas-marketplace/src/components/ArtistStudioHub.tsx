import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistPhotoUpload } from './ArtistPhotoUpload';
import { Trash2 } from 'lucide-react';

interface PortfolioItem {
  id: string;
  image_url: string;
  tags: string[];
}

export function ArtistStudioHub({ artistId }: { artistId: string }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeletePhoto = async (itemId: string, imageUrl: string) => {
    if (!window.confirm("Are you sure you want to delete this look?")) return;

    setDeletingId(itemId);
    try {
      const bucketPathIndex = imageUrl.indexOf('/public/portfolios/');
      if (bucketPathIndex !== -1) {
        const exactFilePath = decodeURIComponent(imageUrl.substring(bucketPathIndex + '/public/portfolios/'.length));
        await supabase.storage.from('portfolios').remove([exactFilePath]);
      }

      // 2. Delete row & force Supabase to return the deleted data
      const { data, error: dbError } = await supabase
        .from('artist_portfolio')
        .delete()
        .eq('id', itemId)
        .select(); // <-- This is the magic word that catches RLS failures

      if (dbError) throw dbError;

      // 3. Check if RLS silently blocked the deletion
      if (!data || data.length === 0) {
        throw new Error("Database blocked deletion (RLS Policy Missing). Please run the SQL command in Supabase.");
      }

      setPortfolio(prev => prev.filter(item => item.id !== itemId));
      
    } catch (err: any) {
      console.error('Error deleting portfolio item:', err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

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
              <div key={item.id} className="bg-white p-3 rounded-xl border border-black/5 space-y-3 shadow-sm relative group">
                {/* Delete Button overlay */}
                <button
                  onClick={() => handleDeletePhoto(item.id, item.image_url)}
                  disabled={deletingId === item.id}
                  className="absolute top-5 right-5 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50 backdrop-blur-sm z-10"
                  title="Delete photo"
                >
                  <Trash2 size={14} />
                </button>

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