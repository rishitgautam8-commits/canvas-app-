// src/lib/theme.ts

export function getTheme(styleVersion: string) {
  return {
    fontBase: "font-['Manrope',sans-serif]",
    
    // Eyebrows / Subheadings
    eyebrow: "font-['Montserrat'] text-[11px] font-bold tracking-[0.2em] text-[#6B3C9C] uppercase",
    
    // Section Headers
    headingHero: "font-['Moura'] font-normal text-4xl sm:text-6xl tracking-tight text-black",
    headingSection: "font-['Moura'] font-normal text-3xl sm:text-4xl tracking-tight text-black",
    headingModal: "font-['Moura'] font-normal text-2xl tracking-tight text-black",
    
    // Navigation & Links
    navLink: "font-['Manrope'] text-xs font-semibold tracking-[0.15em] uppercase text-black hover:text-[#6B3C9C] transition-colors cursor-pointer capitalize",
    secondaryLink: "font-['Manrope'] text-xs font-semibold tracking-[0.15em] uppercase text-black/70 hover:text-black transition-colors cursor-pointer capitalize",
    
    // Body Text
    bodyText: "font-['Manrope'] text-sm md:text-base text-black/70 font-light leading-relaxed",
    
    // Buttons (Explicit white text for proper contrast)
    btnPrimary: "bg-[#3D1E4A] text-white font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none cursor-pointer",
    btnOutline: "border border-black text-black font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-black hover:text-white transition-colors rounded-none cursor-pointer",
    
    // Form Elements & Labels
    formLabel: "font-['Manrope'] text-xs font-semibold tracking-[0.15em] uppercase text-black/80 capitalize",
    inputText: "font-['Manrope'] text-sm text-black placeholder:text-black/30 bg-transparent border-b border-black/20 focus:border-black outline-none pb-2",
    
    // UI Elements
    badge: "inline-flex items-center px-3 py-1 bg-black/5 text-black font-['Manrope'] text-[10px] tracking-widest uppercase rounded-full",
    cardRadius: "rounded-none",
    borderBase: "border-black/10",
    
    // Stats & Quotes
    stat: "font-['Moura'] font-normal text-4xl sm:text-5xl text-black tracking-tight",
    quote: "font-['Moura'] font-normal text-xl sm:text-2xl text-black leading-snug",
    
    // Premium Accent Text
    premiumTag: "font-['PinyonScript',cursive] text-[#6B3C9C] text-2xl sm:text-3xl font-normal lowercase"
  };
}