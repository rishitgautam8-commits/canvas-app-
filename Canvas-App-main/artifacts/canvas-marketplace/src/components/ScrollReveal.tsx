import React from 'react';

export function ScrollReveal({ children, className }: { children: React.ReactNode, className?: string, delay?: number, direction?: string, distance?: number, duration?: number, once?: boolean }) {
  return <div className={className}>{children}</div>;
}

export function StaggerContainer({ children, className }: { children: React.ReactNode, className?: string, staggerDelay?: number, once?: boolean }) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: React.ReactNode, className?: string, index?: number, staggerDelay?: number, direction?: string, distance?: number }) {
  return <div className={className}>{children}</div>;
}