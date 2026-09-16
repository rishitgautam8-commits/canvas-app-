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
  rawTags?: string[];               // every tag string the artist has, unbucketed
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
// A tag found in a different field than the reference used still counts,
// at reduced credit: bucketing is noisy on both sides (an artist tagged
// "glass skin" under look is describing what Gemini reports as finish).
const CROSS_FIELD_CREDIT = 0.6;

type ScalarField = keyof typeof FIELD_WEIGHTS;

const norm = (s?: string) =>
  (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ── synonym / alias groups ── */

const ALIAS_GROUPS: string[][] = [
  ['soft glam', 'softglam', 'soft natural glam', 'glam'],
  ['natural', 'no makeup', 'barely there', 'minimal', 'clean girl'],
  ['editorial', 'high fashion', 'fashion editorial', 'avant garde'],
  ['bridal', 'bride', 'wedding', 'dulhan'],
  ['reception', 'sangeet', 'cocktail', 'party', 'event glam', 'party glam', 'festive', 'festive event', 'evening event'],
  ['engagement', 'roka', 'haldi', 'mehendi', 'mehandi'],
  ['dewy', 'glowing', 'glowy', 'luminous', 'radiant', 'glass skin', 'glass', 'glassy'],
  ['matte', 'velvet', 'velvety', 'soft matte'],
  ['satin', 'natural finish', 'skinlike', 'skin like'],
  ['smokey', 'smoky', 'smudged', 'smoke'],
  ['winged liner', 'cat eye', 'wing liner', 'wing', 'winged', 'wings'],
  ['graphic liner', 'geometric'],
  ['nude', 'nude lips', 'my lips but better'],
  ['glossy', 'gloss', 'lacquer', 'wet lips'],
  ['bold red', 'classic red', 'red lip', 'bold lip', 'bold'],
  ['berry', 'berry stain', 'wine', 'plum lip', 'maroon'],
  ['rosy', 'rose', 'rosy pink', 'pink', 'peach'],
  ['nude brown', 'brown nude', 'cocoa', 'mocha', 'brown'],
  ['shimmer', 'metallic', 'foil', 'glitter', 'shimmery'],
  ['hd', 'hd makeup', 'high definition', 'flawless'],
  ['airbrush', 'airbrushed'],
  ['warm', 'warm toned', 'warm tones'],
  ['cool', 'cool toned', 'cool tones'],
  ['neutral', 'neutral tones'],
  ['gold', 'golden', 'gilded', 'yellow'],
  ['bronze', 'bronzy', 'bronzed'],
  ['copper', 'rose gold'],
  ['olive', 'olive toned'],
  ['south indian', 'telugu', 'traditional', 'maharajah', 'maharani'],
  ['liner', 'kohl', 'kajal'],
];

const ALIAS_TO_GROUP = new Map<string, number>();
ALIAS_GROUPS.forEach((group, gi) => group.forEach((alias) => ALIAS_TO_GROUP.set(norm(alias), gi)));

const sameAliasGroup = (a: string, b: string) => {
  const ga = ALIAS_TO_GROUP.get(a);
  return ga !== undefined && ga === ALIAS_TO_GROUP.get(b);
};

// Words that carry no aesthetic signal — dropped before comparison so
// "hd makeup" and "bridal makeup" don't match on the word "makeup".
const STOPWORDS = new Set(['makeup', 'look', 'looks', 'style', 'finish', 'tone', 'tones', 'with', 'and', 'the', 'for']);

/**
 * Reduce a phrase to a set of comparable keys. An alias-group member
 * collapses to its group id, so "radiant" and "glass skin" produce the
 * same key. Unknown words stay as themselves.
 */
function phraseKeys(phrase: string): Set<string> {
  const keys = new Set<string>();
  const n = norm(phrase);
  if (!n) return keys;

  const whole = ALIAS_TO_GROUP.get(n);
  if (whole !== undefined) keys.add(`g${whole}`);

  const words = n.split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // two-word phrases first: "winged liner", "glass skin", "soft glam"
  for (let i = 0; i < words.length - 1; i++) {
    const pair = ALIAS_TO_GROUP.get(`${words[i]} ${words[i + 1]}`);
    if (pair !== undefined) keys.add(`g${pair}`);
  }

  for (const w of words) {
    const g = ALIAS_TO_GROUP.get(w);
    keys.add(g !== undefined ? `g${g}` : w);
  }
  return keys;
}

/** 0 = no match · 0.5 = partial overlap · 0.7 = strong overlap · 1 = exact/alias */
export function matchStrings(a?: string, b?: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (sameAliasGroup(na, nb)) return 1;
  if ((na.length >= 4 && nb.includes(na)) || (nb.length >= 4 && na.includes(nb))) return 0.7;

  // token-level, alias-aware: multi-word AI values ("gold shimmer wing")
  // rarely equal an artist tag verbatim, but overlap on concepts.
  const ka = phraseKeys(na);
  const kb = phraseKeys(nb);
  if (ka.size === 0 || kb.size === 0) return 0;

  let shared = 0;
  for (const k of ka) if (kb.has(k)) shared++;
  if (shared === 0) return 0;

  const ratio = shared / Math.min(ka.size, kb.size);
  if (ratio >= 1) return 1;
  if (ratio >= 0.5) return 0.7;
  return 0.5;
}

/* ── legacy string[] tags → structured (backward compatibility) ── */

export function legacyTagsToStructured(tags: string[]): AestheticTags {
  const out: AestheticTags = {};
  const tones: string[] = [];
  for (const raw of tags ?? []) {
    const t = norm(raw);
    if (!t) continue;
    if (/(dewy|matte|satin|velvet|glossy|glow\b|glowing|luminous|radiant|glass skin|airbrush)/.test(t)) out.finish = out.finish ?? t;
    else if (/(smokey|smoky|winged|graphic|shimmer|liner|kohl|kajal|lash|eye)/.test(t)) out.eyes = out.eyes ?? t;
    else if (/(\blip|nude|red|berry|rosy|pink|gloss|maroon)/.test(t)) out.lips = out.lips ?? t;
    else if (/(bridal|wedding|bride|reception|party|sangeet|engagement|haldi|mehendi|mehandi|festive|editorial|shoot|groom)/.test(t))
      out.occasion = out.occasion ?? t;
    else if (/(warm|cool|neutral|gold|bronze|copper|rose|olive|brown|yellow)/.test(t)) tones.push(t.split(' ')[0]);
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
export function buildArtistTagIndex(artist: any): ArtistTagIndex {
  const portfolioTags = (artist?.portfolio ?? [])
    .map((p: any) => {
      if (typeof p === 'string') return undefined;
      // Support both nested p.tags AND flattened portfolio objects containing tags
      const rawTags = p?.tags || p;
      return normalizeAestheticTags(rawTags);
    })
    .filter(Boolean) as AestheticTags[];

  // Every tag string the artist has, kept flat and unbucketed. Field
  // assignment loses information (only the first tag per field survives),
  // so this pool is what the cross-field fallback scores against.
  const rawTags: string[] = [
    ...(artist?.allTags ?? artist?.tags ?? []),
    ...(artist?.portfolio ?? []).flatMap((p: any) => (Array.isArray(p?.rawTags) ? p.rawTags : [])),
  ]
    .map((t: any) => norm(String(t)))
    .filter(Boolean);

  const baseAiTags = legacyTagsToStructured(artist?.allTags ?? artist?.tags ?? []);
  const directAiTags = artist?.ai_tags || artist?.aiTags || {};

  return {
    id: String(artist?.id),
    aiTags: mergeDefined(baseAiTags, directAiTags),
    portfolioTags,
    rawTags: [...new Set(rawTags)],
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

export function scoreArtistAgainstReference(ref: AestheticTags, artist: ArtistTagIndex): ArtistMatchResult {
  const chips: Array<{ label: string; weight: number }> = [];
  const matchedFields: Array<keyof AestheticTags> = [];
  const fields = Object.keys(FIELD_WEIGHTS) as ScalarField[];
  const rawPool = artist.rawTags ?? [];

  // `possible` counts only the fields the reference actually specifies, so
  // the score is a share of what was achievable rather than of a fixed 100
  // that no real artist profile can ever reach.
  let earned = 0;
  let possible = 0;

  for (const field of fields) {
    const refVal = ref[field];
    if (!refVal) continue;

    const weight = FIELD_WEIGHTS[field];
    possible += weight;

    // Track the artist's own best-matching value alongside its score, so the
    // explanation chip shows *their* tag, not the reference photo's words.
    let best = 0;
    let bestVal = '';
    const consider = (candidate?: string, scale = 1) => {
      const m = matchStrings(refVal, candidate) * scale;
      if (m > best) {
        best = m;
        bestVal = norm(candidate);
      }
    };

    consider(artist.aiTags?.[field]);
    for (const img of artist.portfolioTags ?? []) consider(img?.[field]);

    // cross-field fallback against the artist's full unbucketed tag pool
    if (best < 1) {
      for (const tag of rawPool) consider(tag, CROSS_FIELD_CREDIT);
    }

    if (best <= 0) continue;

    earned += weight * best;
    matchedFields.push(field);
    if (best >= 0.5) chips.push({ label: CHIP_LABEL[field](bestVal || norm(refVal)), weight: weight * best });
  }

  // tones: partial credit per matched tone
  const refTones = ref.tones ?? [];
  if (refTones.length > 0) {
    possible += TONES_WEIGHT;
    const artistTones = [
      ...(artist.aiTags?.tones ?? []),
      ...(artist.portfolioTags ?? []).flatMap((t) => t?.tones ?? []),
      ...rawPool,
    ];
    const matched = refTones.filter((rt) => artistTones.some((at) => matchStrings(rt, at) >= 0.7));
    if (matched.length > 0) {
      earned += TONES_WEIGHT * Math.min(1, matched.length / refTones.length);
      matchedFields.push('tones');
      chips.push({ label: `${matched.slice(0, 2).join(' + ')} tones`, weight: TONES_WEIGHT });
    }
  }

  // portfolio coverage = consistency signal (an artist who nails the look
  // repeatedly should edge out a one-hit wonder)
  const imgs = artist.portfolioTags ?? [];
  let coverage = 0;
  if (imgs.length > 0) {
    const hits = imgs.filter((img) =>
      fields.some((f) => ref[f] && matchStrings(ref[f], img?.[f]) >= 0.5)
    ).length;
    coverage = hits / imgs.length;
  }

  const ratio = possible > 0 ? earned / possible : 0;
  let score = MIN_SCORE + ratio * (MAX_SCORE - MIN_SCORE);
  score += COVERAGE_BONUS_MAX * coverage;
  if (artist.isVerified) score += VERIFIED_BONUS;
  if (artist.isIncompleteProfile) score -= INCOMPLETE_PENALTY;

  const finalScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));

  return {
    artistId: artist.id,
    score: finalScore,
    chips:
      finalScore >= CHIP_SCORE_THRESHOLD
        ? chips.sort((a, b) => b.weight - a.weight).slice(0, 4).map((c) => c.label)
        : [],
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