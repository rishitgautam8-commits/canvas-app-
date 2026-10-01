import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  type Booking,
  PAYMENT_PERCENT,
  addonsTotal,
  amountDueFor,
  formatINR,
  getGoogleMapsLink,
} from '@/lib/bookings';

export type ArtistBooking = Booking & {
  client?: { id: string; full_name: string | null; email: string | null } | null;
};

interface Props {
  artistId: string;
  onOpenChat: (booking: ArtistBooking) => void;
  onBookingChange?: (bookingId: string, patch: Partial<Booking>) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending_quote: 'bg-amber-50 text-amber-700 border border-amber-200',
  quoted: 'bg-blue-50 text-blue-700 border border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declined: 'bg-stone-100 text-stone-500 border border-stone-200',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending_quote: 'NEEDS QUOTE',
  quoted: 'QUOTE SENT',
  paid: 'PAID & CONFIRMED',
  declined: 'DECLINED',
  cancelled: 'CANCELLED BY CLIENT',
};

export function ArtistBookings({ artistId, onOpenChat, onBookingChange }: Props) {
  const [bookings, setBookings] = useState<ArtistBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteInputs, setQuoteInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
        return;
      }

      const rows = (data || []) as Booking[];
      let clientsById: Record<string, any> = {};
      if (rows.length > 0) {
        const clientIds = [...new Set(rows.map((b) => b.client_id))];
        const { data: clients } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', clientIds);
        clientsById = Object.fromEntries((clients || []).map((c) => [c.id, c]));
      }

      setBookings(rows.map((b) => ({ ...b, client: clientsById[b.client_id] || null })));
      setLoading(false);
    }
    fetchBookings();
  }, [artistId]);

  const applyPatch = (bookingId: string, patch: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...patch } : b)));
    onBookingChange?.(bookingId, patch);
  };

  const handleSendQuote = async (booking: ArtistBooking) => {
    const total = Math.round(Number(quoteInputs[booking.id]));
    if (!Number.isFinite(total) || total < 1) {
      window.alert('Enter a valid total price in rupees.');
      return;
    }
    const due = amountDueFor(total);

    setSavingId(booking.id);
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'quoted', total_amount: total, deposit_amount: due })
      .eq('id', booking.id)
      .in('status', ['pending_quote', 'quoted'])
      .select();
    setSavingId(null);

    if (error) {
      window.alert(`Could not send quote: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      window.alert('Quote was not saved. The booking may have changed. Please refresh.');
      return;
    }
    applyPatch(booking.id, {
      status: 'quoted',
      total_amount: total,
      deposit_amount: due,
      quoted_at: data[0].quoted_at,
    });
    setQuoteInputs((prev) => ({ ...prev, [booking.id]: '' }));
  };

  const handleDecline = async (booking: ArtistBooking) => {
    if (!window.confirm('Decline this request?')) return;
    setSavingId(booking.id);
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'declined' })
      .eq('id', booking.id)
      .in('status', ['pending_quote', 'quoted'])
      .select();
    setSavingId(null);

    if (error) {
      window.alert(`Could not decline: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      window.alert('Could not decline. The booking may have changed. Please refresh.');
      return;
    }
    applyPatch(booking.id, { status: 'declined' });
  };

  if (loading) {
    return <div className="p-6 text-stone-500 text-center">Loading booking requests...</div>;
  }

  const needsQuote = bookings.filter((b) => b.status === 'pending_quote');
  const quoted = bookings.filter((b) => b.status === 'quoted');
  const paid = bookings.filter((b) => b.status === 'paid');
  const closed = bookings.filter((b) => b.status === 'declined' || b.status === 'cancelled');

  const renderDetails = (b: ArtistBooking) => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold text-stone-900 text-base">{b.client?.full_name || 'Canvas client'}</h4>
        <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[b.status] || ''}`}>
          {STATUS_LABELS[b.status] || b.status.toUpperCase()}
        </span>
      </div>

      <p className="text-sm text-stone-600">
        {b.event_date} <span className="text-stone-400">|</span> {b.time_slot}
      </p>

      <p className="text-sm text-stone-600">
        Venue: {b.venue_address}{' '}
        {b.venue_address && (
          <a
            href={getGoogleMapsLink(b.venue_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:underline"
          >
            Directions ↗
          </a>
        )}
      </p>

      {b.look_details && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">Client notes</p>
          <p className="text-sm text-stone-800 whitespace-pre-wrap">{b.look_details}</p>
        </div>
      )}

      {b.reference_photo_url && (
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">Reference photo</p>
          <a href={b.reference_photo_url} target="_blank" rel="noopener noreferrer">
            <img
              src={b.reference_photo_url}
              alt="Client reference look"
              className="h-28 w-28 object-cover rounded-xl border border-stone-200 hover:opacity-90 transition"
            />
          </a>
        </div>
      )}

      {b.selected_addons && b.selected_addons.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">Selected add-ons</p>
          <div className="flex flex-wrap gap-2">
            {b.selected_addons.map((a) => (
              <span
                key={a.name}
                className="px-2.5 py-1 text-xs rounded-full bg-white border border-stone-200 text-stone-700"
              >
                {a.name}
                {a.price !== null && <span className="text-stone-400"> · {formatINR(a.price)}</span>}
              </span>
            ))}
          </div>
          {addonsTotal(b.selected_addons) > 0 && (
            <p className="text-xs text-stone-400 mt-1.5">
              Listed add-ons total {formatINR(addonsTotal(b.selected_addons))}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderQuoteForm = (b: ArtistBooking, isRevision: boolean) => {
    const typed = Math.round(Number(quoteInputs[b.id]));
    const due = Number.isFinite(typed) && typed > 0 ? amountDueFor(typed) : null;
    const busy = savingId === b.id;

    return (
      <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
        <label className="block text-xs uppercase tracking-wider text-stone-500">
          {isRevision ? 'Revise total price' : 'Your total price (all inclusive)'}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-stone-200 bg-white px-3">
            <span className="text-stone-500">₹</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={quoteInputs[b.id] ?? ''}
              onChange={(e) => setQuoteInputs((prev) => ({ ...prev, [b.id]: e.target.value }))}
              placeholder={isRevision && b.total_amount ? String(b.total_amount) : 'e.g. 25000'}
              className="w-36 bg-transparent py-2.5 pl-2 text-sm outline-none"
            />
          </div>
          <button
            onClick={() => handleSendQuote(b)}
            disabled={busy || !quoteInputs[b.id]}
            className="px-4 py-2.5 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-800 shadow-sm transition disabled:opacity-50"
          >
            {busy ? 'Saving...' : isRevision ? 'Update quote' : 'Send quote'}
          </button>
          <button
            onClick={() => handleDecline(b)}
            disabled={busy}
            className="px-4 py-2.5 bg-white text-stone-700 border border-stone-200 text-sm rounded-xl font-medium hover:bg-stone-50 transition disabled:opacity-50"
          >
            Decline
          </button>
        </div>
        {due !== null && (
          <p className="text-xs text-stone-500">
            {PAYMENT_PERCENT >= 100
              ? `Client will be asked to pay ${formatINR(due)} to confirm.`
              : `Client will be asked to pay ${formatINR(due)} (${PAYMENT_PERCENT}%) to confirm.`}
          </p>
        )}
      </div>
    );
  };

  const Section = ({ title, hint, items, children }: {
    title: string;
    hint?: string;
    items: ArtistBooking[];
    children: (b: ArtistBooking) => React.ReactNode;
  }) =>
    items.length === 0 ? null : (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-stone-900">
            {title} <span className="text-stone-400 font-normal">({items.length})</span>
          </h4>
          {hint && <p className="text-xs text-stone-500 mt-0.5">{hint}</p>}
        </div>
        {items.map((b) => (
          <div key={b.id} className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
            {children(b)}
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-6 bg-stone-50 rounded-3xl border border-stone-200">
      <div>
        <h3 className="text-xl font-bold text-stone-900">Client Booking Requests</h3>
        <p className="text-sm text-stone-500 mt-1">
          Review each request, send a custom price, and chat opens once the client pays.
        </p>
      </div>

      {bookings.length === 0 && (
        <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-stone-500 text-sm">
          No booking requests yet.
        </div>
      )}

      <Section title="Needs your quote" hint="Send a price to move the request forward." items={needsQuote}>
        {(b) => (
          <>
            {renderDetails(b)}
            {renderQuoteForm(b, false)}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-400">
              <Lock size={12} /> Chat unlocks after the client pays.
            </p>
          </>
        )}
      </Section>

      <Section title="Quote sent" hint="Waiting for the client to pay or decline." items={quoted}>
        {(b) => (
          <>
            {renderDetails(b)}
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="text-stone-600">
                Your quote: <strong className="text-stone-900">{formatINR(b.total_amount)}</strong>
              </span>
              <span className="text-stone-600">
                Client pays now: <strong className="text-emerald-700">{formatINR(b.deposit_amount)}</strong>
              </span>
            </div>
            {renderQuoteForm(b, true)}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-400">
              <Lock size={12} /> Chat unlocks after the client pays.
            </p>
          </>
        )}
      </Section>

      <Section title="Paid and confirmed" items={paid}>
        {(b) => (
          <>
            {renderDetails(b)}
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-stone-600">
                Quote: <strong className="text-stone-900">{formatINR(b.total_amount)}</strong>
                <span className="text-stone-400">
                  {' '}· client paid {formatINR(b.deposit_amount)}, balance {formatINR((b.total_amount || 0) - (b.deposit_amount || 0))} due to you
                </span>
              </span>
              {b.chat_unlocked && (
                <button
                  onClick={() => onOpenChat(b)}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-xl font-medium hover:bg-emerald-500 shadow-sm transition"
                >
                  Open chat
                </button>
              )}
            </div>
          </>
        )}
      </Section>

      <Section title="Closed" items={closed}>
        {(b) => renderDetails(b)}
      </Section>
    </div>
  );
}