import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET || 'local-fallback-secret';

// Now it's safe to log because the variables exist!
console.log('Connecting to Supabase at:', SUPABASE_URL);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const sb = async (path) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
};

async function runBackfill() {
  try {
    const artists = await sb('artist_profiles?select=id,portfolio');
    console.log(`✨ Backfilling ${artists.length} artists...`);

    for (const artist of artists) {
      const items = (artist.portfolio ?? [])
        .map((p) => (typeof p === 'string' ? { image: p } : p))
        .filter((p) => p?.image);

      for (const item of items) {
        if (item.tags && Object.keys(item.tags).length > 0 && item.analyzed_at) continue;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/tag-portfolio-image`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'x-cron-key': CRON_SECRET 
          },
          body: JSON.stringify({ artist_id: artist.id, image_url: item.image }),
        });

        console.log(`  Artist ${artist.id.slice(0, 8)}... | Image ...${item.image.slice(-25)} → Status: ${res.status}`);
        await new Promise((r) => setTimeout(r, 300)); // stay kind to the vision API
      }
    }
    console.log('✅ Backfill complete!');
  } catch (err) {
  console.error('❌ Backfill failed:', err.message);
  if (err.cause) console.error('🔍 Underlying cause:', err.cause);
}
}

runBackfill();