// components/AIMatchPanel.tsx
// ─────────────────────────────────────────────────────────────
// Canvas AI Matching Engine Panel (Supports Photo & Text Prompts)
// ─────────────────────────────────────────────────────────────

import { Sparkles, X, ImageOff } from 'lucide-react';
import { getTheme } from '@/lib/theme';
import type { MatchPhase, ReferenceAnalysis } from '@/hooks/useReferenceMatching';

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
            <span className={theme.eyebrow}>canvas ai intelligence analysis</span>
            <h3 className={`${theme.headingModal} mt-1`}>aesthetic profile extracted.</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'analyzing' && <span className={`${theme.badge} animate-pulse`}>analyzing request…</span>}
          {phase === 'success' && (
            <>
              <span className={theme.badge}>{tagCount} tags extracted</span>
              {analysis?.isMock && <span className={`${theme.badge} !text-black/50 !border-black/20`}>demo mode</span>}
              <span className={theme.badge}>verified secure</span>
            </>
          )}
          <button type="button" onClick={onClear} className="text-black/40 hover:text-black transition-colors ml-2" aria-label="Clear reference">
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
      {phase === 'analyzing' && !analysis && (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-9 w-28 animate-pulse bg-black/10 ${theme.cardRadius}`} />
          ))}
        </div>
      )}

      {/* structured result */}
      {analysis && (
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Dynamic Left Box: Shows image if uploaded, or a styled text prompt badge if typed */}
          {analysis.imageDataUrl ? (
            <div className={`shrink-0 w-full md:w-40 aspect-square overflow-hidden border ${theme.borderBase} bg-black/5 ${theme.cardRadius}`}>
              <img src={analysis.imageDataUrl} alt="Reference look" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`shrink-0 w-full md:w-40 aspect-square border ${theme.borderBase} bg-[#9D7C3A]/10 ${theme.cardRadius} flex flex-col items-center justify-center text-center p-4`}>
              <Sparkles className="w-6 h-6 text-[#9D7C3A] mb-2" />
              <span className={`${theme.formLabel} !text-[#9D7C3A] tracking-wider text-[11px] uppercase`}>AI Text Prompt</span>
            </div>
          )}

          <div className="flex-1 space-y-4 w-full">
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