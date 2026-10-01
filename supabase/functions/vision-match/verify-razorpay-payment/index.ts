// Verifies the Razorpay signature on the server, then marks the booking paid and unlocks chat.
// This is the ONLY place that can set status = 'paid' or chat_unlocked = true
// (the database trigger blocks everyone else).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Please sign in again.' }, 401);

    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment details' }, 400);
    }

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: booking, error } = await admin
      .from('bookings')
      .select('id, client_id, status, razorpay_order_id, razorpay_payment_id')
      .eq('id', booking_id)
      .single();

    if (error || !booking) return json({ error: 'Booking not found' }, 404);
    if (booking.client_id !== user.id) return json({ error: 'This is not your booking' }, 403);

    // Already verified earlier (double click, retry): succeed quietly.
    if (booking.status === 'paid' && booking.razorpay_payment_id === razorpay_payment_id) {
      return json({ ok: true });
    }
    if (booking.status !== 'quoted') return json({ error: 'This booking is not awaiting payment' }, 409);
    if (booking.razorpay_order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400);

    const expected = await hmacHex(
      Deno.env.get('RAZORPAY_KEY_SECRET')!,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );
    if (!safeEqual(expected, razorpay_signature)) return json({ error: 'Payment signature invalid' }, 400);

    const { data: updated, error: updErr } = await admin
      .from('bookings')
      .update({
        status: 'paid',
        chat_unlocked: true,
        paid_at: new Date().toISOString(),
        razorpay_payment_id,
      })
      .eq('id', booking.id)
      .eq('status', 'quoted')
      .select('id');

    if (updErr || !updated?.length) return json({ error: 'Could not update booking' }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});