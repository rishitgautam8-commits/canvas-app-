import { useReveal } from "./useReveal";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  variant?: "fade" | "zoom";
  className?: string;
  as?: "div" | "span" | "section" | "article";
}

export function Reveal({ 
  children, 
  delay = 0, 
  variant = "fade", 
  className = "",
  as: Tag = "div"
}: RevealProps) {
  const [ref, visible] = useReveal();

  const hiddenTransform = variant === "zoom" ? "scale(0.92)" : "translateY(28px)";
  const visibleTransform = variant === "zoom" ? "scale(1)" : "translateY(0px)";
  const duration = variant === "zoom" ? "1.1s" : "0.9s";

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? visibleTransform : hiddenTransform,
        transition: `opacity ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

// Stagger container for grouped reveals
interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
}

export function StaggerReveal({ 
  children, 
  className = "", 
  staggerDelay = 100,
  baseDelay = 0 
}: StaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<RevealProps>, {
          delay: baseDelay + (index * staggerDelay),
        });
      })}
    </div>
  );
}

import React from 'react';