import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: string;
  artist_id: string;
  service_name: string;
  total_amount: number;
  deposit_amount: number;
  status: string;
  chat_unlocked: boolean;
  created_at: string;
}

export function ClientBookings({ clientId, onOpenChat }: { clientId: string; onOpenChat: (bookingId: string) => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings for this client
  useEffect(() => {
    async function fetchClientBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }
    fetchClientBookings();
  }, [clientId]);

  // Handle the Razorpay Payment Flow for the 3% Deposit
  const handlePayDeposit = async (bookingId: string, depositAmount: number) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyHere", // Replace with your test/live Razorpay Key
      amount: Math.round(depositAmount * 100), // Convert rupees to paise
      currency: "INR",
      name: "Canvas Marketplace",
      description: "3% Commitment Deposit to Unlock Chat",
      handler: async function (response: any) {
        try {
          // Call the Supabase SQL function we created earlier to unlock chat
          const { error } = await supabase.rpc('unlock_chat_after_deposit', {
            p_booking_id: bookingId
          });

          if (error) throw error;

          // Update local state instantly so the UI reflects unlocked chat
          setBookings(prev =>
            prev.map(b => b.id === bookingId ? { ...b, chat_unlocked: true, status: 'deposit_paid' } : b)
          );

          alert('Payment successful! Direct chat with your artist is now unlocked.');
        } catch (err) {
          console.error('Failed to update chat unlock status:', err);
          alert('Payment received, but chat unlock failed. Please contact support.');
        }
      },
      prefill: {
        name: "Client",
      },
      theme: {
        color: "#1c1917", // Sleek minimalist dark tone
      },
    };

    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return <div className="p-6 text-stone-500 text-center">Loading your bookings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6 bg-stone-50 rounded-3xl border border-stone-200">
      <div>
        <h3 className="text-xl font-bold text-stone-900">Your Booking Requests</h3>
        <p className="text-sm text-stone-500 mt-1">Pay the 3% commitment deposit once accepted to unlock direct chat with your artist.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
          You haven't requested any bookings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
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
                    booking.status === 'accepted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    booking.chat_unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {booking.chat_unlocked ? 'CHAT UNLOCKED' : booking.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Dynamic Contextual Action Buttons */}
              <div>
                {booking.status === 'requested' && (
                  <span className="text-xs text-stone-400 italic">Waiting for artist to accept...</span>
                )}

                {booking.status === 'accepted' && !booking.chat_unlocked && (
                  <button
                    onClick={() => handlePayDeposit(booking.id, booking.deposit_amount)}
                    className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-800 shadow-sm transition flex items-center gap-2"
                  >
                    <span>Pay ₹{booking.deposit_amount} Deposit</span>
                  </button>
                )}

                {booking.chat_unlocked && (
                  <button
                    onClick={() => onOpenChat(booking.id)}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-xl font-medium hover:bg-emerald-500 shadow-sm transition"
                  >
                    Open Live Chat 💬
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}