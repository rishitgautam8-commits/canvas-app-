import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Premium } from '@/components/Premium';
import { getTheme } from '@/lib/theme';

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  artistId: string;
  clientId: string;
  artistName: string;
};

export function ReviewModal({ isOpen, onClose, bookingId, artistId, clientId, artistName }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read style query param for the Dynamic Theme Engine
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return window.alert("please write a short review!");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          booking_id: bookingId,
          artist_id: artistId,
          client_id: clientId,
          rating: rating,
          comment: reviewText.trim(),
        }
      ]);

      if (error) throw error;

      window.alert("thank you! your review has been published.");
      onClose();
      setReviewText('');
    } catch (err: any) {
      window.alert(`error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 ${theme.fontBase}`}>
      <div className={`relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-black/5 p-10 shadow-2xl ${theme.cardRadius}`}>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-black/30 hover:text-black transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="text-center mb-8">
          <p className={`${theme.eyebrow} mb-2`}>
            the canvas standard
          </p>
          <h2 className={`${theme.headingModal} mb-2`}>
            rate your <Premium>experience.</Premium>
          </h2>
          <p className={`${theme.bodyText} !text-xs !text-black/50`}>
            how was your booking with {artistName}?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={32} 
                  className={`transition-colors duration-200 ${
                    (hoveredRating || rating) >= star 
                      ? 'fill-[#BA965B] text-[#BA965B]' 
                      : 'fill-transparent text-black/20'
                  }`} 
                />
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="tell us about the look, the professionalism, and your overall experience..."
              rows={4}
              className={`w-full bg-black/5 border ${theme.borderBase} p-5 outline-none ${theme.bodyText} placeholder:text-black/30 focus:border-[#BA965B] transition-all resize-none ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-2xl'}`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${theme.btnPrimary} disabled:opacity-50`}
          >
            {isSubmitting ? 'publishing...' : 'publish review'}
          </button>
        </form>
      </div>
    </div>
  );
}