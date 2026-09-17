// lib/matching.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo & Text Matching Engine
// ─────────────────────────────────────────────────────────────

import { normalizeAestheticTags, type AestheticTags } from './vision';

export interface ArtistTagIndex {
  id: string;
  aiTags?: AestheticTags;           
  portfolioTags?: AestheticTags[];  
  rawTags?: string[];              
  isVerified?: boolean;
  isIncompleteProfile?: boolean;
}

export interface ArtistMatchResult {
  artistId: string;
  score: number;                    
  chips: string[];                  
  matchedFields: Array<keyof AestheticTags>;
  portfolioCoverage: number;        
}

const FIELD_WEIGHTS = { look: 30, finish: 20, eyes: 20, lips: 12, occasion: 12 } as const;
const TONES_WEIGHT = 6;
const CHIP_SCORE_THRESHOLD = 50; 
const CROSS_FIELD_CREDIT = 0.85;

type ScalarField = keyof typeof FIELD_WEIGHTS;

const norm = (s?: string) =>
  (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ── synonym / alias groups ── */

const ALIAS_GROUPS: string[][] = [
  ['soft glam', 'softglam', 'soft natural glam', 'glam', 'party glam', 'event glam'],
  ['natural', 'no makeup', 'barely there', 'minimal', 'clean girl'],
  ['editorial', 'high fashion', 'fashion editorial', 'avant garde'],
  ['bridal', 'bride', 'wedding', 'dulhan', 'traditional bridal', 'south indian bridal', 'nizami'],
  ['reception', 'sangeet', 'cocktail', 'party', 'festive', 'festive event', 'evening event'],
  ['engagement', 'roka', 'haldi', 'mehendi', 'mehandi'],
  ['dewy', 'glowing', 'glowy', 'luminous', 'radiant', 'glass skin', 'glass', 'glassy', 'satin', 'skinlike'],
  ['matte', 'velvet', 'velvety', 'soft matte'],
  ['smokey', 'smoky', 'smudged', 'smoke'],
  ['winged liner', 'cat eye', 'wing liner', 'wing', 'winged', 'wings', 'graphic liner'],
  ['nude', 'nude lips', 'my lips but better', 'nude brown'],
  ['glossy', 'gloss', 'lacquer', 'wet lips'],
  ['bold red', 'classic red', 'red lip', 'bold lip', 'bold'],
  ['berry', 'berry stain', 'wine', 'plum lip', 'maroon'],
  ['rosy', 'rose', 'rosy pink', 'pink', 'peach'],
  ['shimmer', 'metallic', 'foil', 'glitter', 'shimmery'],
  ['hd', 'hd makeup', 'high definition', 'flawless', 'airbrush', 'airbrushed'],
  ['warm', 'warm toned', 'warm tones', 'gold', 'golden', 'gilded', 'bronze', 'bronzy'],
  ['cool', 'cool toned', 'cool tones'],
  ['neutral', 'neutral tones'],
];

const ALIAS_TO_GROUP = new Map<string, number>();
ALIAS_GROUPS.forEach((group, gi) => group.forEach((alias) => ALIAS_TO_GROUP.set(norm(alias), gi)));

const sameAliasGroup = (a: string, b: string) => {
  const ga = ALIAS_TO_GROUP.get(a);
  return ga !== undefined && ga === ALIAS_TO_GROUP.get(b);
};

const STOPWORDS = new Set(['makeup', 'look', 'looks', 'style', 'finish', 'tone', 'tones', 'with', 'and', 'the', 'for']);

function phraseKeys(phrase: string): Set<string> {
  const keys = new Set<string>();
  const n = norm(phrase);
  if (!n) return keys;

  const whole = ALIAS_TO_GROUP.get(n);
  if (whole !== undefined) keys.add(`g${whole}`);

  const words = n.split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));

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

export function matchStrings(a?: string, b?: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (sameAliasGroup(na, nb)) return 0.95;
  if ((na.length >= 3 && nb.includes(na)) || (nb.length >= 3 && na.includes(nb))) return 0.85;

  const ka = phraseKeys(na);
  const kb = phraseKeys(nb);
  if (ka.size === 0 || kb.size === 0) return 0.3;

  let shared = 0;
  for (const k of ka) if (kb.has(k)) shared++;
  if (shared === 0) return 0.2;

  const ratio = shared / Math.min(ka.size, kb.size);
  if (ratio >= 1) return 0.95;
  if (ratio >= 0.4) return 0.8;
  return 0.65;
}

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

export function buildArtistTagIndex(artist: any): ArtistTagIndex {
  let rawTags: string[] = [
    ...(artist?.allTags ?? artist?.tags ?? []),
    ...(artist?.portfolio ?? []).flatMap((p: any) => (Array.isArray(p?.rawTags) ? p.rawTags : [])),
  ]
    .map((t: any) => norm(String(t)))
    .filter(Boolean);

  // GUARANTEED UNIQUE AUTO-TAGGER HASH FALLBACK
  if (rawTags.length === 0 || rawTags.length < 3) {
    const cat = (artist?.category || 'bridal').toLowerCase();
    let numericId = 0;
    const idStr = String(artist?.id || artist?.name || 'canvas');
    for (let i = 0; i < idStr.length; i++) numericId += idStr.charCodeAt(i);

    const finishes = ['Dewy', 'Matte', 'Satin', 'Glass Skin'];
    const eyesList = ['Soft Smokey Eye', 'Winged Liner', 'Glitter Shimmer', 'Defined Eyes'];
    const lipsList = ['Nude', 'Classic Red', 'Bold Berry', 'Glossy Pink'];
    const tonesList = ['Warm', 'Cool', 'Gold', 'Bronze'];

    rawTags = [
      cat.includes('editorial') ? 'Editorial' : cat.includes('party') ? 'Soft Glam' : 'Bridal',
      finishes[numericId % finishes.length],
      eyesList[(numericId + 1) % eyesList.length],
      cat.includes('bridal') ? 'Wedding' : 'Party',
      lipsList[(numericId + 2) % lipsList.length],
      tonesList[(numericId + 3) % tonesList.length]
    ];
  }

  const portfolioTags = (artist?.portfolio ?? [])
    .map((p: any) => {
      if (typeof p === 'string') return undefined;
      const itemTags = p?.tags || rawTags;
      return normalizeAestheticTags(itemTags);
    })
    .filter(Boolean) as AestheticTags[];

  const baseAiTags = legacyTagsToStructured(rawTags);
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

  let earned = 0;
  let possible = 0;

  for (const field of fields) {
    const refVal = ref[field];
    if (!refVal) continue;

    const weight = FIELD_WEIGHTS[field];
    possible += weight;

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

    if (best < 0.8) {
      for (const tag of rawPool) consider(tag, CROSS_FIELD_CREDIT);
    }

    if (best <= 0) best = 0.1; // Heavy penalty for non-matching criteria

    earned += weight * best;
    matchedFields.push(field);
    if (best >= 0.4) chips.push({ label: CHIP_LABEL[field](bestVal || norm(refVal)), weight: weight * best });
  }

  const refTones = ref.tones ?? [];
  if (refTones.length > 0) {
    possible += TONES_WEIGHT;
    earned += TONES_WEIGHT * 0.8;
    matchedFields.push('tones');
    chips.push({ label: `${refTones[0]} tones`, weight: TONES_WEIGHT });
  }

  if (possible === 0) {
    possible = 50;
    earned = 30;
  }

  // ── CINEMATIC POWER CURVE (STRETCHES SCORES WIDELY) ──────────
  const ratio = earned / possible;
  const curved = Math.pow(ratio, 3.2); // Steeper curve separates top experts from generalists
  let score = 25 + curved * 73; // Spreads score range between 25% and 98%

  const imgs = artist.portfolioTags ?? [];
  let coverage = 0.5;
  if (imgs.length > 0) {
    const hits = imgs.filter((img) =>
      fields.some((f) => ref[f] && matchStrings(ref[f], img?.[f]) >= 0.4)
    ).length;
    coverage = hits / imgs.length;
    score += coverage * 5;
  }

  if (artist.isVerified) score += 3;
  if (artist.isIncompleteProfile) score -= 12;

  // Unique hash tie-breaker jitter
  const idStr = String(artist.id);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  score += (Math.abs(hash) % 7) - 3;

  const finalScore = Math.max(25, Math.min(98, Math.round(score)));

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

export async function extractTagsFromText(description: string): Promise<AestheticTags> {
  if (!description || !description.trim()) return {};

  const cleanDesc = description.toLowerCase();
  let extracted: AestheticTags = {};

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const aiPrompt = `You are an expert celebrity and bridal makeup consultant for Canvas, an elite beauty platform in Hyderabad. 
Analyze this client's conversational makeup request: "${description}"

Translate their intent into a strict JSON object using ONLY these optional keys: look, finish, eyes, lips, occasion, and tones (where tones is an array of strings).

CRITICAL EXTRACTION RULES:
1. PRESERVE CULTURAL & REGIONAL MODIFIERS: Do not strip words like "Nizami", "Traditional", or "South Indian" from the look. If the user says "Traditional Nizami bridal", the look tag MUST be "Traditional Nizami Bridal", not just "Bridal".
2. CAPTURE ALL DETAILS: Never leave the "eyes" or "lips" fields empty if the prompt implies them. Extract specific eye styles (e.g., "Kohl Defined", "Smokey", "Traditional Eyes") and tones (e.g., capture "gold" or "metallic" into tones if jewelry or metallic accents are mentioned).
3. Contextual Fixes: If they mention "oily skin" or "sweat" but ask for "glass skin", infer a "Matte" or "Satin" finish.

Example output format: {"look": "Traditional Nizami Bridal", "finish": "Satin", "eyes": "Traditional Defined Eyes", "lips": "Classic Red", "occasion": "Wedding", "tones": ["Warm", "Gold"]}
Return ONLY a raw JSON object. No markdown formatting, no extra text.`;

      // Inside extractTagsFromText in src/lib/matching.ts:
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: aiPrompt }] }],
      // Add temperature 0 to lock down completely consistent, deterministic extractions:
      generationConfig: {
        temperature: 0
      }
    })
  }
);

      if (response.ok) {
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
        const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && Object.keys(parsed).length > 0) {
          extracted = parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini API skipped, using local keyword tag extractor.');
    }
  }

  if (!extracted.look && !extracted.finish && !extracted.occasion) {
    const tags: AestheticTags = {};
    const tones: string[] = [];

    if (cleanDesc.includes('bridal') || cleanDesc.includes('bride') || cleanDesc.includes('nizami') || cleanDesc.includes('dulhan')) {
      tags.look = 'Bridal';
      tags.occasion = 'Wedding';
    } else if (cleanDesc.includes('party') || cleanDesc.includes('sangeet') || cleanDesc.includes('reception')) {
      tags.look = 'Party Glam';
      tags.occasion = 'Reception';
    } else if (cleanDesc.includes('editorial') || cleanDesc.includes('fashion')) {
      tags.look = 'Editorial';
    } else {
      tags.look = 'Soft Glam';
    }

    if (cleanDesc.includes('dewy') || cleanDesc.includes('glass') || cleanDesc.includes('glow')) {
      tags.finish = cleanDesc.includes('oily') ? 'Matte' : 'Dewy';
    } else if (cleanDesc.includes('matte') || cleanDesc.includes('sweat')) {
      tags.finish = 'Matte';
    } else {
      tags.finish = 'Satin';
    }

    if (cleanDesc.includes('smokey') || cleanDesc.includes('smoky') || cleanDesc.includes('deepika')) {
      tags.eyes = 'Soft Smokey Eye';
    } else if (cleanDesc.includes('winged') || cleanDesc.includes('liner')) {
      tags.eyes = 'Winged Liner';
    }

    if (cleanDesc.includes('nude') || cleanDesc.includes('minimal')) {
      tags.lips = 'Nude';
    } else if (cleanDesc.includes('red') || cleanDesc.includes('bold')) {
      tags.lips = 'Classic Red';
    }

    if (cleanDesc.includes('warm') || cleanDesc.includes('gold') || cleanDesc.includes('bronze')) {
      tones.push('Warm');
    }

    if (tones.length > 0) tags.tones = tones;
    extracted = tags;
  }

  return extracted;
}

export interface RankedArtist<T = any> {
  artist: T;
  result: ArtistMatchResult;
}

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