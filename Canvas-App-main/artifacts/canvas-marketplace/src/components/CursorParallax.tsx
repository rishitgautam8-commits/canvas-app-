import { useEffect, useRef, useState } from 'react';

interface FloatingItem {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
}

const MAKEUP_ITEMS = [
  '💄', '🖌️', '✨', '💋', '🎨', '💅', '💎', '👁️',
  '✨', '💫', '🌸', '💄', '✨', '🖌️', '💋', '💎',
];

function generateItems(count: number, w: number, h: number): FloatingItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: MAKEUP_ITEMS[i % MAKEUP_ITEMS.length],
    x: Math.random() * w,
    y: Math.random() * h,
    size: 18 + Math.random() * 28,
    speed: 0.008 + Math.random() * 0.025,
    opacity: 0.03 + Math.random() * 0.07,
    rotation: Math.random() * 360,
  }));
}

export function CursorParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setItems(generateItems(24, w, h));

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseRef.current = {
        x: e.clientX - centerX,
        y: e.clientY - centerY,
      };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      targetRef.current.x = lerp(targetRef.current.x, mouseRef.current.x, 0.04);
      targetRef.current.y = lerp(targetRef.current.y, mouseRef.current.y, 0.04);
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.08);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.08);

      if (containerRef.current) {
        const children = containerRef.current.children;
        items.forEach((item, i) => {
          const el = children[i] as HTMLElement;
          if (el) {
            const moveX = currentRef.current.x * item.speed;
            const moveY = currentRef.current.y * item.speed;
            el.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${item.rotation + currentRef.current.x * 0.02}deg)`;
          }
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute select-none"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            opacity: item.opacity,
            filter: 'grayscale(0.3)',
            transition: 'none',
            willChange: 'transform',
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}