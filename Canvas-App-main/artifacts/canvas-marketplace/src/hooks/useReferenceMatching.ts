import { useState, useMemo, useCallback } from 'react';
import { type AestheticTags } from '../lib/vision';
import { rankArtists, type ArtistMatchResult } from '../lib/matching';

export type MatchPhase = 'idle' | 'analyzing' | 'success' | 'error';

export function useReferenceMatching<T extends { id: string | number; rating?: number }>(artists: T[]) {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  
  // Use 'any' here so it gracefully satisfies both the hook and the AIMatchPanel UI
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

          // FIXED: Upgraded model to gemini-2.5-flash to match your working text pipeline
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: 'Analyze this makeup look and return a JSON object with optional keys: look, finish, eyes, lips, occasion, tones (where tones is an array of strings). Return ONLY raw JSON, no markdown formatting.' },
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

          // Wrap the result in the ReferenceAnalysis structure the UI expects
          setAnalysis({
            tags: parsed,
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
    // Wrap the text tags in the same structure (with a null image)
    setAnalysis({
      tags: tags,
      imageDataUrl: null, // No image for text-based searches
      isMock: false,
      analyzedAt: new Date().toISOString()
    });
    setPhase('success');
  }, []);

  const ranked = useMemo(() => {
    // Look inside the wrapper object for the actual tags
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