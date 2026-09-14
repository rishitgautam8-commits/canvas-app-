// lib/referenceBrief.ts
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 4 (hand-off)
// Carries the reference photo + extracted tags from the directory
// into the artist profile / booking flow, then into Supabase.
// ─────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase';
import type { AestheticTags } from './vision';

export interface ReferenceBrief {
  tags: AestheticTags;
  previewDataUrl?: string; // downscaled local preview
  imageUrl?: string | null; // public Supabase Storage URL once uploaded
  notes?: string;
  savedAt: string;
}

const STORAGE_KEY = 'canvas:referenceBrief';

export function saveReferenceBrief(brief: Omit<ReferenceBrief, 'savedAt'>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...brief, savedAt: new Date().toISOString() }));
  } catch { /* storage full/blocked — non-fatal */ }
}

export function loadReferenceBrief(): ReferenceBrief | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReferenceBrief) : null;
  } catch {
    return null;
  }
}

export function clearReferenceBrief(): void {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Upload the downscaled reference to the `reference-photos` bucket on
 *  first use, cache the public URL, and return it. */
export async function ensureReferenceImageUrl(brief: ReferenceBrief, userId: string): Promise<string | null> {
  if (brief.imageUrl) return brief.imageUrl;
  if (!brief.previewDataUrl) return null;
  const path = `${userId}/${Date.now()}-reference.jpg`;
  const { error } = await supabase.storage
    .from('reference-photos')
    .upload(path, dataUrlToBlob(brief.previewDataUrl), { contentType: 'image/jpeg' });
  if (error) {
    console.warn('[brief] reference photo upload failed:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('reference-photos').getPublicUrl(path);
  saveReferenceBrief({ ...brief, imageUrl: data.publicUrl });
  return data.publicUrl;
}

export function tagsToSummary(tags: AestheticTags): string {
  const parts: string[] = [];
  if (tags.look) parts.push(`look: ${tags.look}`);
  if (tags.finish) parts.push(`finish: ${tags.finish}`);
  if (tags.eyes) parts.push(`eyes: ${tags.eyes}`);
  if (tags.lips) parts.push(`lips: ${tags.lips}`);
  if (tags.occasion) parts.push(`occasion: ${tags.occasion}`);
  if (tags.tones?.length) parts.push(`tones: ${tags.tones.join(', ')}`);
  return parts.join(' · ');
}

/** Human-readable `look_details` that stays useful in plain-text views
 *  (dashboards, alerts) while carrying the full AI brief. */
export function buildLookDetails(opts: {
  notes?: string | null;
  tags?: AestheticTags | null;
  referenceImageUrl?: string | null;
}): string {
  const sections: string[] = [];
  const notes = opts.notes ? String(opts.notes).trim() : '';
  if (notes) sections.push(notes);
  if (opts.tags && Object.keys(opts.tags).length > 0) {
    sections.push(`[AI Vision Brief] ${tagsToSummary(opts.tags)}`);
  }
  if (opts.referenceImageUrl) sections.push(`Reference photo: ${opts.referenceImageUrl}`);
  return sections.join('\n\n');
}