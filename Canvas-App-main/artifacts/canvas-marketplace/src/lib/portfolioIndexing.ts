// lib/portfolioIndexing.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 2
// Artist portfolio indexing. Three-layer strategy:
//   1. WRITE-THROUGH:  edge function tags images at upload time
//   2. LAZY:           this file re-tags stale/missing items on read
//   3. BACKFILL:       supabase/scripts/backfill-portfolio-tags.mjs
// ─────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase';
import { normalizeAestheticTags, type AestheticTags } from './vision';

export const PORTFOLIO_TAG_TTL_MS = 7 * 24 * 60 * 60 * 1000; // re-verify weekly

export interface IndexedPortfolioItem {
  image: string;
  style?: string;
  tags?: AestheticTags;
  analyzed_at?: string | null;
}

/** Object shape to store when an artist uploads — never a bare string,
 *  so tags can attach to the item later without a schema change. */
export function portfolioItemFromUrl(url: string, index: number): IndexedPortfolioItem {
  return {
    image: url,
    style: `look n°${String(index + 1).padStart(2, '0')}`,
    tags: {},
    analyzed_at: null,
  };
}

const needsTagging = (item: IndexedPortfolioItem): boolean => {
  if (!item.image) return false;
  if (!item.tags || Object.keys(item.tags).length === 0) return true;
  if (!item.analyzed_at) return true;
  return Date.now() - new Date(item.analyzed_at).getTime() > PORTFOLIO_TAG_TTL_MS;
};

/** Pull technique/aesthetic tags out of the artist's own text fields —
 *  used as the baseline match signal until images are tagged. */
export function extractSpecialtyTags(category?: string, qualifications?: string, bio?: string): AestheticTags {
  const hay = `${category ?? ''} ${qualifications ?? ''} ${bio ?? ''}`.toLowerCase();
  const grab = (re: RegExp) => hay.match(re)?.[1];
  return normalizeAestheticTags({
    look: grab(/\b(hd|airbrush|editorial|soft glam|natural|party glam|bridal classic)\b/),
    finish: grab(/\b(dewy|matte|satin|velvet|glossy)\b/),
    occasion: grab(/\b(bridal|wedding|reception|sangeet|party|engagement|editorial)\b/),
    eyes: grab(/\b(smokey|smoky|winged|graphic)\b/),
  });
}

/**
 * Fire-and-forget: invokes `tag-portfolio-image` for any portfolio item
 * that is untagged or stale. Matching works instantly with specialty tags;
 * portfolio-level scores upgrade on the next artist data refresh.
 */
export async function ensureArtistPortfolioIndexed(artist: {
  id: string;
  portfolio?: any[];
}): Promise<void> {
  const items = ((artist.portfolio ?? []) as any[])
    .map((p) => (typeof p === 'string' ? { image: p } : p))
    .filter((p) => p?.image) as IndexedPortfolioItem[];

  const stale = items.filter(needsTagging).slice(0, 6); // cap per pass
  if (stale.length === 0) return;

  void (async () => {
    for (const item of stale) {
      try {
        await supabase.functions.invoke('tag-portfolio-image', {
          body: { artist_id: artist.id, image_url: item.image },
        });
      } catch (err) {
        console.warn('[indexing] tag-portfolio-image failed:', err);
      }
    }
  })();
}