import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function ArtistPhotoUpload({ artistId, onUploadComplete }: { artistId: string; onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const fileArray = Array.from(files);

      // Loop through all selected files and process them one by one
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Analyzing & Uploading (${i + 1}/${fileArray.length})...`);

        // 1. Upload image to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `portfolios/${artistId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolios')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL of the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('portfolios')
          .getPublicUrl(filePath);

        // 2. Simulate or trigger AI Vision Tag Extraction
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
      }

      alert(`${fileArray.length} portfolio photo(s) uploaded and auto-tagged successfully!`);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading portfolio photos:', error);
      alert('Failed to upload photos.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      // Reset input value so the same file selection can be triggered again if needed
      event.target.value = '';
    }
  };

  // Helper function representing the AI Vision background process
  const simulateAITagExtraction = async (url: string): Promise<string[]> => {
    return ['BRIDAL', 'SOFT GLAM', 'SATIN', 'WARM TONES', 'AIRBRUSH'];
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-stone-200">
      <h4 className="font-semibold text-stone-900 mb-2">Add New Portfolio Looks</h4>
      <p className="text-xs text-stone-500 mb-4">Upload multiple high-res looks. AI will automatically tag them for client matching.</p>
      
      <label className={`px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium cursor-pointer hover:bg-stone-800 transition inline-block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {uploading ? (uploadProgress || 'Analyzing & Uploading...') : 'Upload Looks 📸'}
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
      </label>
    </div>
  );
}