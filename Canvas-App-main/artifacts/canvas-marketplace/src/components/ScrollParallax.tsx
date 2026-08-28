import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// --- The Signature Giant Scale (Used for massive text/footers) ---
export function GiantZoom({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // Tracks while the element is in the viewport
  });

  // Spring physics make it feel heavy and luxurious, not jittery
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Scales down and up as you scroll past it, exactly like Rhode's footer
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1.05, 0.90]);
  
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

// --- Subtle Breathing Scale (For section wrappers) ---
export function ScrollZoom({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // A much tighter spring so it instantly tracks your mouse wheel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  // Extremely subtle movement (0.97 to 1) so it doesn't make the user dizzy
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.97, 1, 0.97]);

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

// --- Entering Scale (For elements sliding into view) ---
export function ScrollZoomIn({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 1], [0.95, 1]);

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