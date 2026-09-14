// supabase/functions/tag-portfolio-image/index.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 2 (write-through)
// Tags one portfolio image with structured aesthetic tags, upserts
// the tags into artist_profiles.portfolio, and refreshes the
// aggregated artist_profiles.ai_tags column.
//
// Auth: the artist's own JWT, OR x-cron-key header (backfills).
//
// NOTE: this file runs on Deno (Supabase Edge Functions), not Node.
// VS Code's default TS server checks it against your Node project and
// flags Deno-only globals/imports as errors even though they're valid
// at runtime. @ts-nocheck silences that here; for real Deno
// intellisense instead, install the Deno extension and add
// { "deno.enablePaths": ["supabase/functions"] } to .vscode/settings.json.
// ─────────────────────────────────────────────────────────────
// @ts-nocheck

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { encode as base64Encode } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const GEMINI_MODEL = Deno.env.get('GEMINI_VISION_MODEL') ?? 'gemini-2.5-flash';
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const TAG_SCHEMA = {
  type: 'OBJECT',
  properties: {
    look:     { type: 'STRING' },
    finish:   { type: 'STRING' },
    eyes:     { type: 'STRING' },
    lips:     { type: 'STRING' },
    occasion: { type: 'STRING' },
    tones:    { type: 'ARRAY', items: { type: 'STRING' } },
  },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const cleanPhrase = (v: unknown): string | undefined =>
  typeof v === 'string'
    ? v.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 48) || undefined
    : undefined;

const normalizeTags = (raw: any) => {
  if (!raw || typeof raw !== 'object') return {};
  const tones = Array.isArray(raw.tones)
    ? raw.tones.map((t: any) => cleanPhrase(t)?.split(' ')[0]).filter(Boolean).slice(0, 4)
    : undefined;
  return {
    look: cleanPhrase(raw.look),
    finish: cleanPhrase(raw.finish),
    eyes: cleanPhrase(raw.eyes),
    lips: cleanPhrase(raw.lips),
    occasion: cleanPhrase(raw.occasion),
    tones: tones && tones.length ? tones : undefined,
  };
};

/** Most-frequent value per field across portfolio items + specialty keywords. */
function aggregateTags(portfolio: any[], profile: any) {
  const freq: Record<string, Map<string, number>> = {};
  const bump = (field: string, value: string) => {
    if (!freq[field]) freq[field] = new Map();
    freq[field].set(value, (freq[field].get(value) ?? 0) + 1);
  };
  for (const item of portfolio) {
    for (const [field, value] of Object.entries(item?.tags ?? {})) {
      if (field === 'tones' && Array.isArray(value)) value.forEach((t) => bump('tones', String(t)));
      else if (typeof value === 'string' && value) bump(field, value);
    }
  }
  const hay = `${profile?.category ?? ''} ${profile?.qualifications ?? ''}`.toLowerCase();
  for (const kw of ['hd', 'airbrush', 'editorial']) if (hay.includes(kw)) bump('look', kw);
  for (const kw of ['dewy', 'matte', 'satin']) if (hay.includes(kw)) bump('finish', kw);
  if (hay.includes('bridal')) bump('occasion', 'bridal');

  const out: Record<string, unknown> = {};
  for (const [field, m] of Object.entries(freq)) {
    if (field === 'tones') {
      out.tones = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0]);
    } else {
      out[field] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    }
  }
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const { artist_id, image_url } = await req.json();
    if (!artist_id || !image_url) return json({ error: 'artist_id and image_url are required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── auth: artist themself, or backfill cron with shared secret ──
    const cronKey = req.headers.get('x-cron-key') ?? '';
    if (!(CRON_SECRET && cronKey === CRON_SECRET)) {
      const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(jwt);
      if (!user || user.id !== artist_id) return json({ error: 'forbidden' }, 403);
    }

    // ── fetch + tag the image ──
    const imgRes = await fetch(image_url, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) return json({ error: `image fetch failed: ${imgRes.status}` }, 502);
    const bytes = new Uint8Array(await imgRes.arrayBuffer());

    if (!GEMINI_KEY) return json({ error: 'GEMINI_API_KEY not configured' }, 500);

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'You are a senior makeup artist. Tag this portfolio image with short structured aesthetic tags (1-3 lowercase words; tones single words). Judge only what is visible.' },
              { inline_data: { mime_type: imgRes.headers.get('content-type') ?? 'image/jpeg', data: base64Encode(bytes) } },
            ],
          }],
          generationConfig: { temperature: 0.2, response_mime_type: 'application/json', response_schema: TAG_SCHEMA },
        }),
      }
    );
    if (!aiRes.ok) return json({ error: `vision api ${aiRes.status}` }, 502);
    const aiJson = await aiRes.json();
    const tags = normalizeTags(JSON.parse(aiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'));

    // ── upsert tags into the portfolio item + refresh aggregate ──
    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('portfolio, category, qualifications')
      .eq('id', artist_id)
      .single();
    if (!profile) return json({ error: 'artist not found' }, 404);

    const portfolio = (profile.portfolio ?? []).map((p: any) => (typeof p === 'string' ? { image: p } : p));
    const item = portfolio.find((p: any) => p?.image === image_url);
    if (!item) return json({ error: 'image not found in portfolio' }, 404);

    item.tags = tags;
    item.analyzed_at = new Date().toISOString();
    const ai_tags = aggregateTags(portfolio, profile);

    const { error: upErr } = await supabase
      .from('artist_profiles')
      .update({ portfolio, ai_tags })
      .eq('id', artist_id);
    if (upErr) return json({ error: upErr.message }, 500);

    return json({ ok: true, tags, ai_tags });
  } catch (err: any) {
    return json({ error: err?.message ?? 'internal error' }, 500);
  }
});