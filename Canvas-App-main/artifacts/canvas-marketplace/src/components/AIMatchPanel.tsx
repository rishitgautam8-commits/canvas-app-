// components/AIMatchPanel.tsx
// ─────────────────────────────────────────────────────────────
// Canvas AI Reference Photo Matching Engine — STEP 4 (UI)
// Shows the uploaded reference, the structured extraction (with
// shimmer states), and lets the client clear and re-upload.
// ─────────────────────────────────────────────────────────────

import { Sparkles, X, ImageOff } from 'lucide-react';
import { getTheme } from '@/lib/theme';
import type { MatchPhase } from '@/hooks/useReferenceMatching';
import type { ReferenceAnalysis } from '@/lib/vision';

const FIELD_LABELS: Array<[keyof ReferenceAnalysis['tags'], string]> = [
  ['look', 'Look'],
  ['finish', 'Finish'],
  ['eyes', 'Eyes'],
  ['lips', 'Lips'],
  ['occasion', 'Occasion'],
];

export function AIMatchPanel({
  phase,
  analysis,
  error,
  onClear,
}: {
  phase: MatchPhase;
  analysis: ReferenceAnalysis | null;
  error: string | null;
  onClear: () => void;
}) {
  const styleVersion = new URLSearchParams(window.location.search).get('style') || '2';
  const theme = getTheme(styleVersion);
  const accentColor = styleVersion === '3' ? '#7A4B69' : '#9D7C3A';

  if (phase === 'idle') return null;

  const toneCount = analysis?.tags.tones?.length ?? 0;
  const tagCount =
    FIELD_LABELS.filter(([f]) => analysis?.tags?.[f]).length + toneCount;

  return (
    <div className={`mb-12 mt-8 border ${theme.borderBase} bg-white/50 backdrop-blur-sm p-8 lg:p-10 shadow-sm ${theme.cardRadius}`}>
      {/* header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${theme.borderBase} pb-6 mb-6`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center border ${theme.borderBase} bg-black/5 ${theme.cardRadius}`}>
            <Sparkles color={accentColor} size={20} />
          </div>
          <div>
            <span className={theme.eyebrow}>canvas ai vision analysis</span>
            <h3 className={`${theme.headingModal} mt-1`}>aesthetic profile extracted.</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'analyzing' && <span className={`${theme.badge} animate-pulse`}>analyzing photo…</span>}
          {phase === 'matching' && <span className={`${theme.badge} animate-pulse`}>matching artists…</span>}
          {phase === 'ready' && (
            <>
              <span className={theme.badge}>{tagCount} tags extracted</span>
              {analysis?.isMock && <span className={`${theme.badge} !text-black/50 !border-black/20`}>preview mode — full AI analysis unavailable right now</span>}
              <span className={theme.badge}>verified secure</span>
            </>
          )}
          <button type="button" onClick={onCloseSafe(onClear)} className="text-black/40 hover:text-black transition-colors ml-2" aria-label="Clear reference">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* error */}
      {phase === 'error' && (
        <div className="flex items-center gap-3 text-black/60">
          <ImageOff size={18} />
          <p className={theme.bodyText}>{error ?? 'Analysis failed.'}</p>
        </div>
      )}

      {/* analyzing shimmer */}
      {phase !== 'error' && !analysis && (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-9 w-28 animate-pulse bg-black/10 ${theme.cardRadius}`} />
          ))}
        </div>
      )}

      {/* structured result */}
      {analysis && (
        <div className="flex flex-col md:flex-row gap-8">
          <div className={`shrink-0 w-full md:w-40 aspect-square overflow-hidden border ${theme.borderBase} bg-black/5 ${theme.cardRadius}`}>
            <img src={analysis.imageDataUrl} alt="Reference look" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              {FIELD_LABELS.map(([field, label]) => {
                const value = analysis.tags[field];
                if (!value) return null;
                return (
                  <span key={field} className={`inline-flex items-baseline gap-2 py-2 px-3 bg-white border ${theme.borderBase} ${theme.cardRadius}`}>
                    <span className={`${theme.formLabel} !text-black/40`}>{label}</span>
                    <span className={`${theme.formLabel} !text-black`}>{value}</span>
                  </span>
                );
              })}
              {toneCount > 0 && (
                <span className={`inline-flex items-baseline gap-2 py-2 px-3 bg-white border ${theme.borderBase} ${theme.cardRadius}`}>
                  <span className={`${theme.formLabel} !text-black/40`}>Tones</span>
                  <span className={`${theme.formLabel} !text-black`}>{analysis.tags.tones!.join(', ')}</span>
                </span>
              )}
            </div>
            <p className={`${theme.bodyText} !text-black/40`}>
              Results are re-ranked by match percentage. Open any artist to send this look as your booking brief.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const onCloseSafe = (fn: () => void) => () => fn();