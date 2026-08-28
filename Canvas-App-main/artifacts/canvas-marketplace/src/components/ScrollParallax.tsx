import React from 'react';

// Stripped of all scaling to ensure native, smooth scrolling
export function ScrollZoom({ children, className }: { children: React.ReactNode, className?: string, startScale?: number, endScale?: number }) {
  return <div className={className}>{children}</div>;
}

export function ScrollZoomIn({ children, className }: { children: React.ReactNode, className?: string, startScale?: number, endScale?: number }) {
  return <div className={className}>{children}</div>;
}

export function GiantZoom({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>;
}