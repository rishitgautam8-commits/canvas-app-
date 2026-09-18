// lib/vision.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 1
// Client upload → downscale → Gemini Vision (structured JSON)
// → validated AestheticTags.
//
// Bulletproof by design: the ONLY hard failure is an unreadable
// file. Any API/network failure falls back to a deterministic
// mock tagged `isMock: true` so the demo never dead-ends.
// Set VITE_MOCK_VISION=true to force mock mode (offline demos).
// ─────────────────────────────────────────────────────────────

export interface AestheticTags {
  look?: string;      // "soft glam" | "editorial" | "natural" ...
  finish?: string;    // "dewy" | "matte" | "satin" ...
  eyes?: string;      // "smokey nude" | "graphic liner" ...
  lips?: string;      // "glossy nude" | "bold red" ...
  occasion?: string;  // "bridal" | "reception" | "editorial shoot" ...
  tones?: string[];   // ["warm", "gold"]
}

export interface ReferenceAnalysis {
  tags: AestheticTags;
  imageDataUrl: string; // downscaled JPEG preview → booking brief
  isMock: boolean;
  analyzedAt: string;
}

const MODEL = import.meta.env.VITE_GEMINI_VISION_MODEL || 'gemini-2.5-flash';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MOCK_MODE = import.meta.env.VITE_MOCK_VISION === 'true';
const MAX_IMAGE_DIM = 1024;
const JPEG_QUALITY = 0.85;

/* ── image preprocessing: shrink before upload (faster + cheaper) ── */

export function downscaleImage(file: File, maxDim = MAX_IMAGE_DIM): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    img.src = url;
  });
}

/* ── normalization / validation ── */

const cleanPhrase = (v: unknown): string | undefined =>
  typeof v === 'string'
    ? v.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 48) || undefined
    : undefined;

export function normalizeAestheticTags(raw: any): AestheticTags {
  if (!raw || typeof raw !== 'object') return {};
  const tones = Array.isArray(raw.tones)
    ? (raw.tones.map((t: any) => cleanPhrase(t)?.split(' ')[0]).filter(Boolean).slice(0, 4) as string[])
    : undefined;
  return {
    look: cleanPhrase(raw.look),
    finish: cleanPhrase(raw.finish),
    eyes: cleanPhrase(raw.eyes),
    lips: cleanPhrase(raw.lips),
    occasion: cleanPhrase(raw.occasion),
    tones: tones && tones.length > 0 ? tones : undefined,
  };
}

/* ── Gemini structured-output call with retry + backoff ── */

const TAG_SCHEMA = {
  type: 'OBJECT',
  properties: {
    look:     { type: 'STRING', description: 'Overall makeup style, 1-3 words (e.g. "soft glam", "editorial", "natural")' },
    finish:   { type: 'STRING', description: 'Skin finish, 1 word (e.g. "dewy", "matte", "satin")' },
    eyes:     { type: 'STRING', description: 'Eye makeup, 1-3 words (e.g. "smokey nude", "graphic liner")' },
    lips:     { type: 'STRING', description: 'Lip color/finish, 1-3 words (e.g. "glossy nude")' },
    occasion: { type: 'STRING', description: 'Most likely occasion, 1-2 words (e.g. "bridal", "reception")' },
    tones:    { type: 'ARRAY', items: { type: 'STRING' }, description: 'Up to 4 single-word color/temperature descriptors' },
  },
};

const PROMPT =
  'You are a senior makeup artist and beauty AI. Analyze the reference photo and describe the ' +
  'makeup look with short structured tags. Values must be 1-3 lowercase words; tones must be ' +
  'single words (colors or temperature). Judge only what is visible - do not invent details.';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geminiExtract(base64: string, mimeType: string, retries = 3): Promise<AestheticTags> {
  let lastErr: any = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: mimeType, data: base64 } }] }],
            generationConfig: {
              temperature: 0.2,
              response_mime_type: 'application/json',
              response_schema: TAG_SCHEMA,
            },
          }),
        }
      );
      if (!res.ok) {
        // 429/5xx are retryable; 4xx are not
        if (res.status === 429 || res.status >= 500) {
          lastErr = new Error(`Vision API ${res.status}`);
          await sleep(400 * 2 ** attempt);
          continue;
        }
        throw new Error(`Vision API error ${res.status}`);
      }
      const json = await res.json();
      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      return normalizeAestheticTags(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await sleep(400 * 2 ** attempt);
    }
  }
  throw lastErr ?? new Error('Vision extraction failed');
}

/* ── deterministic mock (offline demos / API outage failsafe) ── */

const MOCK_POOL = {
  look: ['soft glam', 'editorial', 'natural', 'bridal classic', 'party glam'],
  finish: ['dewy', 'satin', 'matte', 'glossy'],
  eyes: ['smokey nude', 'soft brown', 'graphic liner', 'shimmer lid', 'winged liner'],
  lips: ['glossy nude', 'bold red', 'rosy pink', 'berry stain', 'nude brown'],
  occasion: ['bridal', 'reception', 'party', 'engagement', 'editorial shoot'],
  tones: [['warm', 'gold'], ['cool', 'rose'], ['neutral', 'bronze'], ['warm', 'copper'], ['olive', 'gold']],
};

export function mockExtractTags(seedName = ''): AestheticTags {
  let h = 0;
  for (const c of seedName) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = (arr: string[]) => arr[h % arr.length];
  return normalizeAestheticTags({
    look: pick(MOCK_POOL.look),
    finish: pick(MOCK_POOL.finish),
    eyes: pick(MOCK_POOL.eyes),
    lips: pick(MOCK_POOL.lips),
    occasion: pick(MOCK_POOL.occasion),
    tones: MOCK_POOL.tones[h % MOCK_POOL.tones.length],
  });
}

/* ── public entry point ── */

export async function analyzeReferencePhoto(file: File): Promise<ReferenceAnalysis> {
  if (!file.type.startsWith('image/')) throw new Error('Please upload an image file.');

  const imageDataUrl = await downscaleImage(file); // hard-fails only on unreadable files
  const base64 = imageDataUrl.split(',')[1];
  const analyzedAt = new Date().toISOString();

  if (MOCK_MODE || !API_KEY) {
    return { tags: mockExtractTags(file.name), imageDataUrl, isMock: true, analyzedAt };
  }
  try {
    const tags = await geminiExtract(base64, 'image/jpeg');
    const empty = !tags.look && !tags.finish && !tags.eyes && !tags.lips && !tags.occasion && !tags.tones;
    if (empty) return { tags: mockExtractTags(file.name), imageDataUrl, isMock: true, analyzedAt };
    return { tags, imageDataUrl, isMock: false, analyzedAt };
  } catch (err) {
    console.error('[vision] extraction failed, using mock fallback:', err);
    return { tags: mockExtractTags(file.name), imageDataUrl, isMock: true, analyzedAt };
  }
}