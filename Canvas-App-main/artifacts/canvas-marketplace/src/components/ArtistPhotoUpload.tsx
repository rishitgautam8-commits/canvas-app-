import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function ArtistPhotoUpload({ artistId, onUploadComplete }: { artistId: string; onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `portfolios/${artistId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artist-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('artist-images')
        .getPublicUrl(filePath);

      // 2. Simulate or trigger AI Vision Tag Extraction
      // (In production, you'd call your backend function or AI API here to analyze publicUrl)
      const extractedTags = await simulateAITagExtraction(publicUrl);

      // 3. Save Image URL and Tags to Supabase Database
      const { error: dbError } = await supabase
        .from('artist_portfolio')
        .insert({
          artist_id: artistId,
          image_url: publicUrl,
          tags: extractedTags,
        });

      if (dbError) throw dbError;

      alert('Portfolio photo uploaded and auto-tagged successfully!');
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading portfolio photo:', error);
      alert('Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  // Helper function representing the AI Vision background process
  const simulateAITagExtraction = async (url: string): Promise<string[]> => {
    // This represents your AI Vision model analyzing the image pixels
    // and returning relevant aesthetic keywords for the matching engine.
    return ['BRIDAL', 'SOFT GLAM', 'SATIN', 'WARM TONES', 'AIRBRUSH'];
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-stone-200">
      <h4 className="font-semibold text-stone-900 mb-2">Add New Portfolio Look</h4>
      <p className="text-xs text-stone-500 mb-4">Upload a high-res look. AI will automatically tag it for client matching.</p>
      
      <label className={`px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium cursor-pointer hover:bg-stone-800 transition inline-block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {uploading ? 'Analyzing & Uploading...' : 'Upload Look 📸'}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </label>
    </div>
  );
}