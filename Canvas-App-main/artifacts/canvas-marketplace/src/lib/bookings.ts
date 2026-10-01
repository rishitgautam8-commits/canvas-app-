// Shared types and helpers for the quote -> pay -> chat booking flow.

export type BookingStatus = 'pending_quote' | 'quoted' | 'paid' | 'declined' | 'cancelled';

export interface AddonOption {
  name: string;
  price: number | null; // indicative price in rupees, null if the artist did not list one
  image: string | null;
}

export interface SelectedAddon {
  name: string;
  price: number | null;
}

export interface Booking {
  id: string;
  artist_id: string;
  client_id: string;
  service_name?: string | null;
  event_date: string;
  time_slot: string;
  venue_address: string;
  look_details: string | null;
  reference_photo_url: string | null;
  selected_addons: SelectedAddon[] | null;
  total_amount: number | null; // artist's custom quote
  deposit_amount: number | null; // amount the client pays now
  status: BookingStatus;
  chat_unlocked: boolean;
  created_at: string;
  quoted_at?: string | null;
  paid_at?: string | null;
}

// Share of the artist's quote the client pays online to confirm the booking.
// The remaining balance is settled directly with the artist.
export const PAYMENT_PERCENT = 12.5;

// Statuses that hold a slot on the artist's calendar.
export const SLOT_BLOCKING_STATUSES: BookingStatus[] = ['pending_quote', 'quoted', 'paid'];

// Used only when an artist has not listed any add-ons of their own.
export const DEFAULT_ADDONS: AddonOption[] = [
  { name: 'Hairstyle', price: null, image: null },
  { name: 'Nail Art', price: null, image: null },
  { name: 'Saree Draping', price: null, image: null },
  { name: 'Lashes', price: null, image: null },
];

export const formatINR = (n: number | null | undefined) =>
  n === null || n === undefined ? '-' : `₹${Number(n).toLocaleString('en-IN')}`;

export const amountDueFor = (total: number) =>
  Math.max(1, Math.round((total * PAYMENT_PERCENT) / 100));

export const addonsTotal = (addons: SelectedAddon[] | null | undefined) =>
  (addons || []).reduce((sum, a) => sum + (a.price || 0), 0);

// Artist add-ons are stored as strings: "Saree Draping (₹1500) | IMAGE: https://..."
export function parseArtistAddons(raw: unknown): AddonOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    .map((entry) => {
      const [textPart, imagePart] = entry.split('| IMAGE:');
      const text = textPart.trim();
      const match = text.match(/^(.*?)\s*\(\s*₹?\s*([\d,]+(?:\.\d+)?)\s*\)\s*$/);
      if (match) {
        return {
          name: match[1].trim(),
          price: Number(match[2].replace(/,/g, '')),
          image: imagePart ? imagePart.trim() : null,
        };
      }
      return {
        name: text.replace(/\(.*\)/, '').trim() || text,
        price: null,
        image: imagePart ? imagePart.trim() : null,
      };
    });
}

export function getGoogleMapsLink(location: string) {
  const parts = location.split(',').map((p) => p.trim());
  let cleanLocation = location;

  if (parts.length > 6) {
    const specificVenue = parts.slice(0, 3);
    const cityStateZip = parts.slice(-4);
    cleanLocation = [...specificVenue, ...cityStateZip].join(', ');
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanLocation)}`;
}