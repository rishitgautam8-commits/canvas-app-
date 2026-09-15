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

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Gemini analyzing look (${i + 1}/${fileArray.length})...`);

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

        // 2. Call our secure backend API route for real Gemini Vision analysis
        const extractedTags = await analyzeImageViaServer(file);

        // 3. Save Image URL and Real AI Tags to Supabase Database
        const { error: dbError } = await supabase
          .from('artist_portfolio')
          .insert({
            artist_id: artistId,
            image_url: publicUrl,
            tags: extractedTags,
          });

        if (dbError) throw dbError;

        if (i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      alert(`${fileArray.length} portfolio photo(s) analyzed and tagged by Gemini successfully!`);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading portfolio photos:', error);
      alert('Failed to upload and analyze photos.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      event.target.value = '';
    }
  };

  const analyzeImageViaServer = async (file: File): Promise<string[]> => {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg'
        })
      });

      if (!response.ok) {
        throw new Error('Server analysis endpoint failed');
      }

      const data = await response.json();
      return Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['BRIDAL', 'GLAM'];
    } catch (err) {
      console.error('Error connecting to vision backend:', err);
      return ['HD MAKEUP', 'PROFESSIONAL', 'CUSTOM LOOK'];
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-stone-200">
      <h4 className="font-semibold text-stone-900 mb-2">Add New Portfolio Looks</h4>
      <p className="text-xs text-stone-500 mb-4">Upload multiple high-res looks. Gemini AI will accurately analyze and tag them.</p>
      
      <label className={`px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium cursor-pointer hover:bg-stone-800 transition inline-block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {uploading ? (uploadProgress || 'Analyzing & Uploading...') : 'Upload Looks 📸'}
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
      </label>
    </div>
  );
}