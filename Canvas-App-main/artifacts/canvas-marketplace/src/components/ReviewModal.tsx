import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Premium } from '@/components/Premium';

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
      window.alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Montserrat']">
      <div 
        className="relative w-full max-w-lg bg-white border border-black/10 p-8 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-black/40 hover:text-black transition-colors"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="text-center mb-8">
          <p className="font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#B66CF2] mb-2">
            The Canvas Standard
          </p>
          <h2 className="font-['Montserrat'] font-extrabold text-3xl text-black tracking-tight mb-2">
            Rate your <Premium>experience.</Premium>
          </h2>
          <p className="font-['Montserrat'] text-xs font-bold uppercase tracking-wider text-black/50">
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

          {/* Review Text Input */}
          <div className="relative">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe the look, professionalism, and overall experience..."
              rows={4}
              className="w-full font-['Montserrat'] text-sm text-black placeholder:text-black/30 border border-black/15 bg-transparent p-4 outline-none transition-colors focus:border-[#BA965B] resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black py-4 font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#BA965B] hover:text-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Review'}
          </button>
        </form>
      </div>
    </div>
  );
}