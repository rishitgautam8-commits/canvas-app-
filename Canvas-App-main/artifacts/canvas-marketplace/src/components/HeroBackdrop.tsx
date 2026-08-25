import { useEffect, useRef } from 'react';

// One of the six already-verified Unsplash photos — reused here so this
// component has zero new network dependencies.
const BACKDROP_PHOTO = '1594941250082-85e4c770d293';

// Why this replaces CosmeticGlowBackground: four blurred, drifting gradient
// orbs behind a translucent photo is the default "beauty tech" hero look —
// it reads as generic no matter how well-tuned the animation is, and it
// buries the one thing that's actually specific to this brief (real makeup
// craft) under abstraction. This version puts the photograph itself in
// front, duotoned into the brand's ink/plum palette, with a single
// restrained glow for depth instead of four competing for attention.
export function HeroBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handlePointerMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      target.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };
    const recenter = () => { target.current = { x: 0, y: 0 }; };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', recenter);
    window.addEventListener('blur', recenter);

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.05;
      current.current.y += (target.current.y - current.current.y) * 0.05;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${(current.current.x * 14).toFixed(2)}px, ${(current.current.y * 14).toFixed(2)}px, 0)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', recenter);
      window.removeEventListener('blur', recenter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base ink */}
      <div className="absolute inset-0 bg-[#0A0510]" />

      {/* The craft itself, duotoned into the brand palette rather than hidden behind blur */}
      <img
        src={`https://images.unsplash.com/photo-${BACKDROP_PHOTO}?auto=format&fit=crop&w=2200&q=80`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.38] grayscale contrast-125"
        style={{ mixBlendMode: 'luminosity' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(107,18,168,0.55) 0%, rgba(43,10,78,0.65) 45%, #0A0510 100%)' }}
      />

      {/* One restrained ambient glow, not four competing ones */}
      <div
        ref={glowRef}
        className="absolute -top-[20%] -left-[10%] h-[640px] w-[640px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(182,108,242,0.35) 0%, rgba(182,108,242,0) 70%)',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Fine grain — kills the flatness a pure gradient always has, no image asset needed */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export default HeroBackdrop;