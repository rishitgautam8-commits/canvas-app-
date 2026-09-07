import React from 'react';

export function Premium({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-['Playfair_Display'] italic text-[#BA965B] px-1 tracking-wide">
      {children}
    </span>
  );
}