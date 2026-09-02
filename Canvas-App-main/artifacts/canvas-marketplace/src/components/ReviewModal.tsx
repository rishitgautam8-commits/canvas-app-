import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return window.alert("Please write a short review!");
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

      window.alert("Thank you! Your review has been published.");
      onClose();
      setReviewText('');
    } catch (err: any) {
      console.error("Error submitting review:", err);
      window.alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#FDF3F1]/80 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-lg bg-white/60 backdrop-blur-xl border border-white/50 rounded-[32px] p-8 shadow-[0_20px_50px_-12px_rgba(21,4,32,0.06)]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[#150420]/40 hover:text-[#150420] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#BA965B] mb-2">
            The Canvas Standard
          </p>
          <h2 className="text-3xl font-serif text-[#150420] mb-2">
            Rate your experience
          </h2>
          <p className="text-sm text-[#150420]/60">
            How was your booking with {artistName}?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Interactive Star Rating */}
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
                  size={36} 
                  className={`transition-colors duration-200 ${
                    (hoveredRating || rating) >= star 
                      ? 'fill-[#BA965B] text-[#BA965B]' 
                      : 'fill-transparent text-[#150420]/20'
                  }`} 
                />
              </button>
            ))}
          </div>

          {/* Review Text Input */}
          <div className="relative">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about the look, the professionalism, and your overall experience..."
              rows={4}
              className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-[20px] p-5 outline-none text-[#150420] text-[15px] placeholder:text-[#150420]/40 focus:border-[#BA965B] focus:bg-white/70 focus:ring-4 focus:ring-[#BA965B]/10 transition-all duration-300 resize-none custom-scrollbar"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#BA965B] hover:bg-[#A67E3D] text-[#150420] py-4 rounded-[20px] font-bold text-[15px] transition-all duration-300 shadow-[0_6px_20px_rgba(186,150,91,0.25)] hover:shadow-[0_8px_25px_rgba(186,150,91,0.35)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Review'}
          </button>
        </form>
      </div>
    </div>
  );
}