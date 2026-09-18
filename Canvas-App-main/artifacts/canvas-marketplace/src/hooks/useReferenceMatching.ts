import { useState, useMemo, useCallback } from 'react';
import { type AestheticTags } from '../lib/vision';
import { rankArtists, type ArtistMatchResult } from '../lib/matching';

export type MatchPhase = 'idle' | 'analyzing' | 'success' | 'error';

export function useReferenceMatching<T extends { id: string | number; rating?: number }>(artists: T[]) {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitReference = useCallback(async (file: File) => {
    if (!file) return;
    setPhase('analyzing');
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result?.toString().split(',')[1];
          if (!base64) throw new Error('Failed to read file');

          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error('API key missing');

          const strictPrompt = `You are an elite beauty AI. Analyze this makeup look and extract structured tags into a strict JSON object with keys: look, finish, eyes, lips, occasion, and tones (where tones is an array of strings). 
          
          STRICT RULES - YOU MUST FOLLOW THESE:
          1. Values MUST be 1-3 words maximum. DO NOT write sentences or lists.
          2. look: e.g., "Soft Glam", "Bridal", "Editorial High Fashion", "Clean Girl Minimal".
          3. finish: e.g., "Dewy", "Matte", "Satin", "Glass Skin".
          4. eyes: e.g., "Soft Smokey Eye", "Winged Liner", "Graphic Liner", "Minimal Natural".
          5. lips: e.g., "Nude", "Bold Red", "Bold Berry", "Glossy Pink".
          6. occasion: e.g., "Wedding", "Reception", "Fashion Shoot", "Day Event".
          7. tones: Array of 1-word colors (e.g., ["Warm", "Gold", "Peach"]).
          
          Return ONLY raw JSON. No markdown formatting.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: strictPrompt },
                    { inlineData: { mimeType: file.type, data: base64 } }
                  ]
                }],
                generationConfig: { temperature: 0 }
              })
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vision analysis failed: ${response.status} - ${errText}`);
          }

          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
          const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          // ── SAFEGUARD: Guarantee strict types before hitting React UI ──
          const sanitizedTags: AestheticTags = {
            look: typeof parsed.look === 'string' ? parsed.look : undefined,
            finish: typeof parsed.finish === 'string' ? parsed.finish : undefined,
            eyes: typeof parsed.eyes === 'string' ? parsed.eyes : undefined,
            lips: typeof parsed.lips === 'string' ? parsed.lips : undefined,
            occasion: typeof parsed.occasion === 'string' ? parsed.occasion : undefined,
            tones: Array.isArray(parsed.tones) 
              ? parsed.tones.filter((t: any) => typeof t === 'string')
              : typeof parsed.tones === 'string'
                ? parsed.tones.split(',').map((t: string) => t.trim())
                : []
          };

          setAnalysis({
            tags: sanitizedTags,
            imageDataUrl: reader.result,
            analyzedAt: new Date().toISOString()
          });
          setPhase('success');
        } catch (err: any) {
          setError(err.message || 'Failed to process image');
          setPhase('error');
        }
      };
    } catch (err: any) {
      setError(err.message || 'Failed to read image');
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
      tags: tags,
      imageDataUrl: null, 
      isMock: false,
      analyzedAt: new Date().toISOString()
    });
    setPhase('success');
  }, []);

  const ranked = useMemo(() => {
    const activeTags = analysis?.tags;
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