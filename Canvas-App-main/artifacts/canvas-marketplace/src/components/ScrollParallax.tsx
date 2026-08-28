import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

// Rhode-style: element moves slower than scroll (parallax)
export function ParallaxSection({
  children,
  className = '',
  speed = 0.15,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Element starts below and moves up as you scroll into view
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Simple scroll-linked fade+slide (Rhode's subtle entrance)
interface ScrollEntranceProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down';
  distance?: number;
}

export function ScrollEntrance({
  children,
  className = '',
  direction = 'up',
  distance = 60,
}: ScrollEntranceProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const startY = direction === 'up' ? distance : -distance;
  const y = useTransform(scrollYProgress, [0, 1], [startY, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Giant text reveal (like the big "rhode" at bottom)
interface GiantRevealProps {
  children: React.ReactNode;
  className?: string;
}

export function GiantReveal({
  children,
  className = '',
}: GiantRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}