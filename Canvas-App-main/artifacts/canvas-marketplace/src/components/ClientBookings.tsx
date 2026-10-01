import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Booking, PAYMENT_PERCENT, formatINR, getGoogleMapsLink } from '@/lib/bookings';

type ClientBooking = Booking & { artist_name?: string | null };

const STATUS_STYLES: Record<string, string> = {
  pending_quote: 'bg-amber-50 text-amber-700 border border-amber-200',
  quoted: 'bg-blue-50 text-blue-700 border border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declined: 'bg-stone-100 text-stone-500 border border-stone-200',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending_quote: 'AWAITING QUOTE',
  quoted: 'QUOTE READY',
  paid: 'CONFIRMED',
  declined: 'DECLINED',
  cancelled: 'CANCELLED',
};

function loadRazorpay(): Promise<boolean> {
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// supabase.functions.invoke hides the server's message inside error.context
async function readFnError(error: any, fallback: string): Promise<string> {
  try {
    const body = await error.context.json();
    return body?.error || error.message || fallback;
  } catch {
    return error?.message || fallback;
  }
}

export function ClientBookings({
  clientId,
  onOpenChat,
}: {
  clientId: string;
  onOpenChat: (bookingId: string) => void;
}) {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client bookings:', error);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Booking[];
    let artistsById: Record<string, any> = {};
    if (rows.length > 0) {
      const artistIds = [...new Set(rows.map((b) => b.artist_id))];
      const { data: artists } = await supabase
        .from('artist_profiles')
        .select('id, business_name')
        .in('id', artistIds);
      artistsById = Object.fromEntries((artists || []).map((a) => [a.id, a]));
    }

    setBookings(rows.map((b) => ({ ...b, artist_name: artistsById[b.artist_id]?.business_name || null })));
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Pay: server creates the order -> Razorpay checkout -> server verifies signature -> chat unlocks
  const handlePayNow = async (booking: ClientBooking) => {
    setBusyId(booking.id);
    try {
      const scriptReady = await loadRazorpay();
      if (!scriptReady) throw new Error('Could not load the payment window. Check your connection and try again.');

      const { data: order, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { booking_id: booking.id },
      });
      if (orderError) throw new Error(await readFnError(orderError, 'Could not start payment.'));
      if (!order?.order_id) throw new Error('Could not start payment.');

      const rzp = new (window as any).Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Canvas Beauty',
        description: `Booking with ${booking.artist_name || 'your artist'}`,
        theme: { color: '#1c1917' },
        modal: { ondismiss: () => setBusyId(null) },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: { booking_id: booking.id, ...response },
            });
            if (verifyError) throw new Error(await readFnError(verifyError, 'Verification failed.'));
            await fetchBookings(); // show the real state from the database
            window.alert('Payment verified! Your booking is confirmed and chat with your artist is now unlocked.');
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            window.alert(
              `We received your payment but could not verify it yet (${err.message}). ` +
                `Please do not pay again. Payment ID: ${response.razorpay_payment_id}. Contact support with this ID.`,
            );
          } finally {
            setBusyId(null);
          }
        },
      });

      rzp.on('payment.failed', (res: any) => {
        window.alert(res?.error?.description || 'Payment failed. You have not been charged.');
        setBusyId(null);
      });
      rzp.open();
    } catch (err: any) {
      window.alert(err.message || 'Something went wrong starting the payment.');
      setBusyId(null);
    }
  };

  const updateStatus = async (booking: ClientBooking, newStatus: 'declined' | 'cancelled', confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setBusyId(booking.id);
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id)
      .in('status', ['pending_quote', 'quoted'])
      .select();
    setBusyId(null);

    if (error) {
      window.alert(`Could not update booking: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      window.alert('This booking has changed. Please refresh.');
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b)));
  };

  if (loading) {
    return <div className="p-6 text-stone-500 text-center">Loading your bookings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6 bg-stone-50 rounded-3xl border border-stone-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-stone-900">Your Bookings</h3>
          <p className="text-sm text-stone-500 mt-1">
            Your artist sends a custom quote. Pay to confirm your date and unlock direct chat.
          </p>
        </div>
        <button onClick={fetchBookings} className="text-xs text-stone-500 hover:text-stone-900 underline shrink-0">
          Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
          You haven't requested any bookings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const busy = busyId === b.id;
            const payingLess = b.deposit_amount !== null && b.total_amount !== null && b.deposit_amount < b.total_amount;

            return (
              <div key={b.id} className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-stone-900 text-base">
                      {b.artist_name || 'Your artist'}
                    </h4>
                    <p className="text-sm text-stone-600">
                      {b.event_date} <span className="text-stone-400">|</span> {b.time_slot}
                    </p>
                    <p className="text-sm text-stone-600">
                      {b.venue_address}{' '}
                      {b.venue_address && (
                        <a
                          href={getGoogleMapsLink(b.venue_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-700 hover:underline"
                        >
                          Map ↗
                        </a>
                      )}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[b.status] || ''}`}>
                    {STATUS_LABELS[b.status] || b.status.toUpperCase()}
                  </span>
                </div>

                {(b.selected_addons?.length || b.reference_photo_url) && (
                  <div className="flex flex-wrap items-center gap-3">
                    {b.reference_photo_url && (
                      <a href={b.reference_photo_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={b.reference_photo_url}
                          alt="Your reference look"
                          className="h-16 w-16 object-cover rounded-lg border border-stone-200"
                        />
                      </a>
                    )}
                    {b.selected_addons?.map((a) => (
                      <span key={a.name} className="px-2.5 py-1 text-xs rounded-full bg-stone-50 border border-stone-200 text-stone-700">
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status-specific area */}
                {b.status === 'pending_quote' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <span className="text-sm text-stone-400 italic">Waiting for your artist to send a quote...</span>
                    <button
                      onClick={() => updateStatus(b, 'cancelled', 'Cancel this request?')}
                      disabled={busy}
                      className="text-sm text-stone-500 hover:text-stone-900 underline disabled:opacity-50"
                    >
                      Cancel request
                    </button>
                  </div>
                )}

                {b.status === 'quoted' && (
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <div className="flex flex-wrap items-end gap-x-8 gap-y-1">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-stone-400">Artist quote</p>
                        <p className="text-2xl font-bold text-stone-900">{formatINR(b.total_amount)}</p>
                      </div>
                      {payingLess && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-stone-400">Pay now to confirm ({PAYMENT_PERCENT}%)</p>
                          <p className="text-lg font-semibold text-emerald-700">{formatINR(b.deposit_amount)}</p>
                        </div>
                      )}
                    </div>
                    {payingLess && (
                      <p className="text-xs text-stone-500">
                        Balance of {formatINR((b.total_amount || 0) - (b.deposit_amount || 0))} is paid directly to your artist.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handlePayNow(b)}
                        disabled={busy}
                        className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-800 shadow-sm transition disabled:opacity-50"
                      >
                        {busy ? 'Please wait...' : `Pay ${formatINR(b.deposit_amount)} now`}
                      </button>
                      <button
                        onClick={() => updateStatus(b, 'declined', 'Decline this quote?')}
                        disabled={busy}
                        className="px-5 py-2.5 bg-white text-stone-700 border border-stone-200 text-sm rounded-xl font-medium hover:bg-stone-50 transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Lock size={12} /> Chat with your artist unlocks once payment is verified.
                    </p>
                  </div>
                )}

                {b.status === 'paid' && (
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-stone-600">
                      Paid <strong className="text-emerald-700">{formatINR(b.deposit_amount)}</strong>
                      {payingLess && <span className="text-stone-400"> of {formatINR(b.total_amount)}</span>}
                    </span>
                    {b.chat_unlocked ? (
                      <button
                        onClick={() => onOpenChat(b.id)}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-xl font-medium hover:bg-emerald-500 shadow-sm transition"
                      >
                        Open chat
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Lock size={12} /> Chat is being unlocked. Tap Refresh.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}