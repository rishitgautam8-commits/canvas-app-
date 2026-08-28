import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  once?: boolean;
}

function getInitialTransform(direction: string, distance: number) {
  switch (direction) {
    case 'up': return `translateY(${distance}px)`;
    case 'down': return `translateY(-${distance}px)`;
    case 'left': return `translateX(${distance}px)`;
    case 'right': return `translateX(-${distance}px)`;
    default: return `translateY(${distance}px)`;
  }
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 40,
  duration = 0.7,
  once = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.05, rootMargin: '-40px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate(0, 0)' : getInitialTransform(direction, distance),
    transition: `opacity ${duration}s ${delay}s cubic-bezier(0.25, 0.1, 0.25, 1), transform ${duration}s ${delay}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  once = false,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.05, rootMargin: '-30px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div ref={ref} className={className}>
      {isVisible && children}
    </div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  index?: number;
  staggerDelay?: number;
}

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
  distance = 30,
  index = 0,
  staggerDelay = 0.1,
}: StaggerItemProps) {
  const style: React.CSSProperties = {
    opacity: 1,
    transform: 'translate(0, 0)',
    animation: `scrollRevealFade ${0.6}s ${index * staggerDelay}s cubic-bezier(0.25, 0.1, 0.25, 1) both`,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}