import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  service_name: string;
  total_amount: number;
  deposit_amount: number;
  status: string;
  created_at: string;
}

export function ArtistBookings({ artistId }: { artistId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch incoming booking requests for this artist
  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }
    fetchBookings();
  }, [artistId]);

  // Handle status update (Accept or Decline)
  const handleUpdateStatus = async (bookingId: string, newStatus: 'accepted' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state instantly for a responsive UI
      setBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      );
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-stone-500 text-center">Loading appointment requests...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6 bg-stone-50 rounded-3xl border border-stone-200">
      <div>
        <h3 className="text-xl font-bold text-stone-900">Incoming Client Bookings</h3>
        <p className="text-sm text-stone-500 mt-1">Accept requests to prompt clients for their 3% commitment deposit.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
          No booking requests found right now.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between transition hover:border-stone-300"
            >
              <div className="space-y-1">
                <h4 className="font-semibold text-stone-900 text-base">{booking.service_name}</h4>
                <div className="text-xs text-stone-500 flex gap-3">
                  <span>Total: <strong className="text-stone-800">₹{booking.total_amount}</strong></span>
                  <span>3% Deposit: <strong className="text-emerald-700">₹{booking.deposit_amount}</strong></span>
                </div>
                <div>
                  <span className={`inline-block mt-2 px-2.5 py-0.5 text-xs rounded-full font-medium ${
                    booking.status === 'requested' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    booking.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {booking.status === 'requested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                    className="px-4 py-2 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-800 shadow-sm transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                    className="px-4 py-2 bg-white text-stone-700 border border-stone-200 text-sm rounded-xl font-medium hover:bg-stone-50 transition"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}