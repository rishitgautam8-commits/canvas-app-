import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface ScrollZoomProps {
  children: React.ReactNode;
  className?: string;
  startScale?: number;
  endScale?: number;
}

// Rhode-style smooth scroll-linked zoom
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

  // Smooth the scroll progress with spring physics (this is the key!)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 0.5, 1], [startScale, endScale, startScale]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        willChange: 'transform',
        transformOrigin: 'center center',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 1], [startScale, endScale]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        willChange: 'transform',
        transformOrigin: 'center center',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 30,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1.15, 0.8]);
  const opacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.4, 1, 1, 0.4]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        opacity,
        willChange: 'transform, opacity',
        transformOrigin: 'center center',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}