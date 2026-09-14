// lib/matching.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 3
// Weighted percentage matching + human-readable explanation chips.
// Pure functions: no I/O, no React — trivially unit-testable and
// memoizable. Scores land in a realistic 55-99 band.
// ─────────────────────────────────────────────────────────────

import { normalizeAestheticTags, type AestheticTags } from './vision';

export interface ArtistTagIndex {
  id: string;
  aiTags?: AestheticTags;           // specialization tags (category/quals/bio or aggregated)
  portfolioTags?: AestheticTags[];  // one entry per portfolio image
  isVerified?: boolean;
  isIncompleteProfile?: boolean;
}

export interface ArtistMatchResult {
  artistId: string;
  score: number;                    // 55-99, realistic percentage
  chips: string[];                  // e.g. ["soft glam", "dewy finish", "smokey nude eyes"]
  matchedFields: Array<keyof AestheticTags>;
  portfolioCoverage: number;        // 0-1 share of portfolio looks that match
}

const FIELD_WEIGHTS = { look: 30, finish: 20, eyes: 20, lips: 12, occasion: 12 } as const;
const TONES_WEIGHT = 6;
const COVERAGE_BONUS_MAX = 3;
const VERIFIED_BONUS = 2;
const INCOMPLETE_PENALTY = 12;
const MIN_SCORE = 55;
const MAX_SCORE = 99;
const CHIP_SCORE_THRESHOLD = 65; // don't explain weak matches

type ScalarField = keyof typeof FIELD_WEIGHTS;

const norm = (s?: string) =>
  (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ── synonym / alias groups ── */

const ALIAS_GROUPS: string[][] = [
  ['soft glam', 'softglam', 'soft natural glam'],
  ['natural', 'no makeup', 'barely there', 'minimal', 'clean girl'],
  ['editorial', 'high fashion', 'fashion editorial', 'avant garde'],
  ['bridal', 'bride', 'wedding'],
  ['reception', 'sangeet', 'cocktail', 'party', 'event glam', 'party glam'],
  ['engagement', 'roka', 'haldi', 'mehendi'],
  ['dewy', 'glowing', 'glowy', 'luminous', 'radiant'],
  ['matte', 'velvet', 'velvety', 'soft matte'],
  ['satin', 'natural finish', 'skinlike', 'skin like'],
  ['smokey', 'smoky', 'smudged', 'smoke'],
  ['winged liner', 'cat eye', 'wing liner'],
  ['graphic liner', 'geometric'],
  ['nude', 'nude lips', 'my lips but better'],
  ['glossy', 'gloss', 'lacquer', 'wet lips'],
  ['bold red', 'classic red', 'red lip'],
  ['berry', 'berry stain', 'wine', 'plum lip'],
  ['rosy', 'rose', 'rosy pink'],
  ['nude brown', 'brown nude', 'cocoa', 'mocha'],
  ['shimmer', 'metallic', 'foil', 'glitter'],
  ['hd', 'hd makeup', 'high definition', 'flawless'],
  ['airbrush', 'airbrushed'],
  ['warm', 'warm toned', 'warm tones'],
  ['cool', 'cool toned', 'cool tones'],
  ['neutral', 'neutral tones'],
  ['gold', 'golden', 'gilded'],
  ['bronze', 'bronzy', 'bronzed'],
  ['copper', 'rose gold'],
  ['olive', 'olive toned'],
];

const ALIAS_TO_GROUP = new Map<string, number>();
ALIAS_GROUPS.forEach((group, gi) => group.forEach((alias) => ALIAS_TO_GROUP.set(norm(alias), gi)));

const sameAliasGroup = (a: string, b: string) => {
  const ga = ALIAS_TO_GROUP.get(a);
  return ga !== undefined && ga === ALIAS_TO_GROUP.get(b);
};

/** 0 = no match · 0.5 = shared keyword · 0.7 = containment · 1 = exact/alias */
export function matchStrings(a?: string, b?: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (sameAliasGroup(na, nb)) return 1;
  if ((na.length >= 4 && nb.includes(na)) || (nb.length >= 4 && na.includes(nb))) return 0.7;
  const ta = new Set(na.split(' ').filter((t) => t.length > 3));
  const tb = new Set(nb.split(' ').filter((t) => t.length > 3));
  for (const t of ta) if (tb.has(t)) return 0.5;
  return 0;
}

/* ── legacy string[] tags → structured (backward compatibility) ── */

export function legacyTagsToStructured(tags: string[]): AestheticTags {
  const out: AestheticTags = {};
  const tones: string[] = [];
  for (const raw of tags ?? []) {
    const t = norm(raw);
    if (!t) continue;
    if (/(dewy|matte|satin|velvet|glossy|glowing|luminous)/.test(t)) out.finish = out.finish ?? t;
    else if (/(smokey|smoky|winged|graphic|shimmer|liner|kohl|lash)/.test(t)) out.eyes = out.eyes ?? t;
    else if (/(\blip|nude|red|berry|rosy|pink|gloss)/.test(t)) out.lips = out.lips ?? t;
    else if (/(bridal|wedding|bride|reception|party|sangeet|engagement|editorial|shoot|groom)/.test(t))
      out.occasion = out.occasion ?? t;
    else if (/(warm|cool|neutral|gold|bronze|copper|rose|olive)/.test(t)) tones.push(t.split(' ')[0]);
    else out.look = out.look ?? t;
  }
  if (tones.length) out.tones = [...new Set(tones)].slice(0, 4);
  return out;
}

const mergeDefined = (base: AestheticTags, over?: AestheticTags): AestheticTags => {
  if (!over) return base;
  const out: AestheticTags = { ...base };
  (Object.keys(over) as Array<keyof AestheticTags>).forEach((k) => {
    const v = over[k] as any;
    if (v !== undefined && (!Array.isArray(v) || v.length > 0)) (out as any)[k] = v;
  });
  return out;
};

/** Build the tag index for one artist from the shapes already in your app. */
/** Build the tag index for one artist from the shapes already in your app. */
export function buildArtistTagIndex(artist: any): ArtistTagIndex {
  const portfolioTags = (artist?.portfolio ?? [])
    .map((p: any) => {
      if (typeof p === 'string') return undefined;
      // Support both nested p.tags AND flattened portfolio objects containing tags
      const rawTags = p?.tags || p;
      return normalizeAestheticTags(rawTags);
    })
    .filter(Boolean) as AestheticTags[];

  const baseAiTags = legacyTagsToStructured(artist?.tags ?? []);
  const directAiTags = artist?.ai_tags || artist?.aiTags || {};

  return {
    id: String(artist?.id),
    aiTags: mergeDefined(baseAiTags, directAiTags),
    portfolioTags,
    isVerified: Boolean(artist?.isVerified),
    isIncompleteProfile: Boolean(artist?.isIncompleteProfile),
  };
}

/* ── the scorer ── */

const CHIP_LABEL: Record<ScalarField, (v: string) => string> = {
  look: (v) => v,
  finish: (v) => `${v} finish`,
  eyes: (v) => `${v} eyes`,
  lips: (v) => `${v} lips`,
  occasion: (v) => `${v} occasion`,
};

/* ── the scorer (Forgiving & Dynamic) ── */

export function scoreArtistAgainstReference(ref: AestheticTags, artist: ArtistTagIndex): ArtistMatchResult {
  let score = 58; // Start above baseline so it never flatlines
  const chips: Array<{ label: string; weight: number }> = [];
  const matchedFields: Array<keyof AestheticTags> = [];

  // Collect all text tokens from the reference tags
  const refTokens = new Set(
    Object.values(ref)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .filter(Boolean)
      .map((s) => norm(String(s)))
      .flatMap((s) => s.split(' '))
      .filter((t) => t.length > 2)
  );

  if (refTokens.size === 0) {
    return {
      artistId: artist.id,
      score: 65,
      chips: ['General aesthetic alignment'],
      matchedFields: [],
      portfolioCoverage: 0,
    };
  }

  // Check artist AI tags and portfolio tags for keyword overlaps
  const allArtistTags = [
    ...(artist.aiTags ? Object.values(artist.aiTags).flatMap(v => Array.isArray(v) ? v : [v]) : []),
    ...(artist.portfolioTags ?? []).flatMap((img) => Object.values(img).flatMap(v => Array.isArray(v) ? v : [v])),
  ]
    .filter(Boolean)
    .map((s) => norm(String(s)));

  let matchCount = 0;
  for (const token of refTokens) {
    const found = allArtistTags.some((at) => at.includes(token) || token.includes(at));
    if (found) {
      matchCount++;
      score += 7; // Add points per matching keyword/token
      if (matchCount <= 3) {
        chips.push({ label: `Matches ${token}`, weight: 10 });
        matchedFields.push('look' as any);
      }
    }
  }

  // Portfolio consistency bonus
  const imgs = artist.portfolioTags ?? [];
  const coverage = imgs.length > 0 ? Math.min(1, matchCount / (imgs.length * 2)) : 0;
  score += Math.round(coverage * 10);

  if (artist.isVerified) score += 4;
  if (artist.isIncompleteProfile) score -= 15;

  // Clamp realistic band between 60% and 96%
  const finalScore = Math.max(60, Math.min(96, Math.round(score)));

  return {
    artistId: artist.id,
    score: finalScore,
    chips: chips.map((c) => c.label).slice(0, 3),
    matchedFields,
    portfolioCoverage: coverage,
  };
}

export interface RankedArtist<T = any> {
  artist: T;
  result: ArtistMatchResult;
}

/** Score + rank every artist, best first (rating breaks ties). */
export function rankArtists<T extends { id: string | number; rating?: number }>(
  reference: AestheticTags,
  artists: T[]
): RankedArtist<T>[] {
  return artists
    .map((artist) => ({
      artist,
      result: scoreArtistAgainstReference(reference, buildArtistTagIndex(artist)),
    }))
    .sort(
      (a, b) =>
        b.result.score - a.result.score || (b.artist.rating ?? 0) - (a.artist.rating ?? 0)
    );
}
/**
 * Base filter + sort pass for the artist directory grid — runs before
 * any AI reference-photo scoring is overlaid (that part is owned by
 * useReferenceMatching / matchedById back in App.tsx).
 *
 * - category: exact match against artist.category, 'all' = no filter
 * - services: keeps artists offering at least one requested service
 * - location: soft-boosts artists in a matching city/area to the top
 * - aiTags: kept for backward compatibility with older callers that used
 *   to pass scores in here directly — safe to always pass [] now
 */
export function runCanvasMatch<
  T extends {
    id: string | number;
    category?: string;
    services?: string[];
    city?: string;
    location?: string;
    rating?: number;
  }
>(
  services: string[],
  location: string,
  category: string,
  _aiTags: unknown[],
  artists: T[]
): T[] {
  const wantedServices = (services ?? []).map((s) => norm(s));

  const filtered = artists.filter((artist) => {
    if (category && category !== 'all' && artist.category !== category) return false;
    if (wantedServices.length === 0) return true;
    const artistServices = (artist.services ?? []).map((s) => norm(s));
    return wantedServices.some((s) => artistServices.some((as) => as.includes(s) || s.includes(as)));
  });

  const loc = norm(location);
  return filtered
    .map((artist) => {
      const artistLoc = norm(artist.city || artist.location || '');
      const isCloseMatch = !loc || artistLoc.includes(loc) || loc.includes(artistLoc);
      return { artist, isCloseMatch };
    })
    .sort((a, b) => {
      if (a.isCloseMatch !== b.isCloseMatch) return a.isCloseMatch ? -1 : 1;
      return (b.artist.rating ?? 0) - (a.artist.rating ?? 0);
    })
    .map((x) => x.artist);
}