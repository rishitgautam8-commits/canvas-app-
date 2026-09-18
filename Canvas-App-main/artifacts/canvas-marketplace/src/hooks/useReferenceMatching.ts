import { useState, useMemo, useCallback } from 'react';
import { type AestheticTags } from '../lib/vision';
import { rankArtists, type ArtistMatchResult } from '../lib/matching';

export type MatchPhase = 'idle' | 'analyzing' | 'success' | 'error';

export interface ReferenceAnalysis {
  tags: AestheticTags;
  matchTags: AestheticTags;
  imageDataUrl: string | null;
  isMock?: boolean;
  analyzedAt: string;
}

const EMPTY_TAGS: AestheticTags = {
  look: undefined,
  finish: undefined,
  eyes: undefined,
  lips: undefined,
  occasion: undefined,
  tones: []
};

/**
 * Normalizes an arbitrary parsed-JSON blob from the Vision API into a
 * well-typed AestheticTags object, so a malformed or partial AI response
 * can never crash the UI or the matching engine.
 */
function sanitizeTags(raw: unknown): AestheticTags {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_TAGS };
  const r = raw as Record<string, unknown>;

  return {
    look: typeof r.look === 'string' ? r.look : undefined,
    finish: typeof r.finish === 'string' ? r.finish : undefined,
    eyes: typeof r.eyes === 'string' ? r.eyes : undefined,
    lips: typeof r.lips === 'string' ? r.lips : undefined,
    occasion: typeof r.occasion === 'string' ? r.occasion : undefined,
    tones: Array.isArray(r.tones)
      ? r.tones.filter((t): t is string => typeof t === 'string')
      : typeof r.tones === 'string'
        ? [r.tones]
        : []
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

// Single-payload prompt: the AI's descriptive, editorial-style tags are used
// directly both for the UI copy and for the matching engine.
const VISION_PROMPT = `You are an elite beauty AI working for a premium makeup artist marketplace. Analyze the makeup look in this image and return a strict JSON object with EXACTLY these keys: "look", "finish", "eyes", "lips", "occasion", "tones".

Write each value as a punchy, expressive, professional phrase (3-7 words) that reads like it was written by a senior editorial makeup director. Be specific and evocative, never generic.

- look: overall style descriptor (e.g. "Artistic Editorial Avant-Garde", "Soft Romantic Bridal Glow")
- finish: skin/complexion finish (e.g. "Radiant Satin with Subtle Highlight", "Velvet Matte, Fully Blurred")
- eyes: eye makeup description (e.g. "Dramatic Graphic Liner with Bold Wing", "Soft Smoked-Out Neutral Eye")
- lips: lip makeup description (e.g. "Classic Blurred Red Stain", "Glossy Nude with Subtle Definition")
- occasion: best-suited occasion (e.g. "Fashion Editorial Shoot", "Modern Minimalist Wedding")
- tones: an array of 2-4 single-word color/tone descriptors (e.g. ["Warm", "Gold", "Bronze"])

Return ONLY raw JSON. No markdown, no code fences, no commentary.`;

export function useReferenceMatching<T extends { id: string | number; rating?: number }>(artists: T[]) {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitReference = useCallback(async (file: File) => {
    if (!file) return;

    setPhase('analyzing');
    setError(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.split(',')[1];
      if (!base64) throw new Error('Failed to read image data');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is missing');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: VISION_PROMPT },
                  { inlineData: { mimeType: file.type, data: base64 } }
                ]
              }
            ],
            generationConfig: { temperature: 0 }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vision analysis failed: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const textResponse: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
      const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('Could not parse AI response as JSON');
      }

      const tags = sanitizeTags(parsed);

      setAnalysis({
        tags,
        matchTags: tags,
        imageDataUrl: dataUrl,
        analyzedAt: new Date().toISOString()
      });
      setPhase('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setPhase('error');
    }
  }, []);

  const clearReference = useCallback(() => {
    setPhase('idle');
    setAnalysis(null);
    setError(null);
  }, []);

  const setReferenceTags = useCallback((tags: AestheticTags) => {
    setAnalysis({
      tags,
      matchTags: tags, // text search: display and match tags are identical
      imageDataUrl: null,
      isMock: false,
      analyzedAt: new Date().toISOString()
    });
    setPhase('success');
  }, []);

  const ranked = useMemo(() => {
    const activeTags = analysis?.matchTags ?? analysis?.tags;
    if (!activeTags || Object.keys(activeTags).length === 0) return [];
    return rankArtists(activeTags, artists);
  }, [analysis, artists]);

  const matchedById = useMemo(() => {
    const map = new Map<string, ArtistMatchResult>();
    ranked.forEach(({ artist, result }) => {
      map.set(String(artist.id), result);
    });
    return map;
  }, [ranked]);

  return {
    phase,
    analysis,
    error,
    ranked,
    matchedById,
    submitReference,
    clearReference,
    setReferenceTags,
    hasReference: Boolean(analysis)
  };
}