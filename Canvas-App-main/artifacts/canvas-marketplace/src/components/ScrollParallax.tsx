import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollZoomProps {
  children: React.ReactNode;
  className?: string;
  startScale?: number;
  endScale?: number;
}

// Rhode-style: element zooms in as you scroll into view, zooms out as you scroll past
export function ScrollZoom({
  children,
  className = '',
  startScale = 0.92,
  endScale = 1.0,
}: ScrollZoomProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Scale zooms in as element enters viewport center, zooms out as it leaves
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [startScale, endScale, startScale]);

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// For sections that should zoom in and STAY zoomed (one-way)
interface ScrollZoomInProps {
  children: React.ReactNode;
  className?: string;
  startScale?: number;
  endScale?: number;
}

export function ScrollZoomIn({
  children,
  className = '',
  startScale = 0.9,
  endScale = 1.0,
}: ScrollZoomInProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [startScale, endScale]);

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Giant text that scales dramatically (like the big "rhode")
interface GiantZoomProps {
  children: React.ReactNode;
  className?: string;
}

export function GiantZoom({
  children,
  className = '',
}: GiantZoomProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Dramatic zoom: starts small, gets huge, then shrinks
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.15, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.4, 1, 1, 0.4]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}