// Creates a Razorpay order for a quoted booking. The amount comes from the database,
// never from the browser, so a client cannot pay less than the artist quoted.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Please sign in again.' }, 401);

    const { booking_id } = await req.json();
    if (!booking_id) return json({ error: 'booking_id is required' }, 400);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: booking, error } = await admin
      .from('bookings')
      .select('id, client_id, status, deposit_amount')
      .eq('id', booking_id)
      .single();

    if (error || !booking) return json({ error: 'Booking not found' }, 404);
    if (booking.client_id !== user.id) return json({ error: 'This is not your booking' }, 403);
    if (booking.status !== 'quoted') return json({ error: 'This booking has no active quote' }, 409);

    const amountPaise = Math.round(Number(booking.deposit_amount) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) return json({ error: 'Invalid amount' }, 422);

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `bk_${booking.id}`.slice(0, 40),
        notes: { booking_id: booking.id },
      }),
    });
    const order = await rzpRes.json();
    if (!rzpRes.ok) return json({ error: order?.error?.description ?? 'Razorpay order failed' }, 502);

    await admin.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking.id);

    return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});