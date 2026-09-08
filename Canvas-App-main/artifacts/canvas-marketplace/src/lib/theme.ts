export const getTheme = (styleVersion?: string) => {
  // Locked completely to Option 4 (Old-World Luxury)
  return {
    // UI & BODY TEXT (Switched to robust Montserrat for crisp legibility)
    fontBase: "font-['Montserrat']",
    bodyText: "font-['Montserrat'] text-[14px] md:text-[15px] font-medium leading-[1.8] text-black/70",
    formLabel: "font-['Montserrat'] text-[11px] font-bold tracking-[0.15em] text-black/50 uppercase",
    inputText: "font-['Montserrat'] text-sm font-medium text-black placeholder:text-black/30 border-b border-[#6B3C9C]/30 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5 transition-colors",
    
    // BUTTONS & NAV (Beefed up to font-bold to fix the "weak" look)
    btnPrimary: "bg-[#3D1E4A] text-[#6B3C9C] font-['Montserrat'] text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none",
    btnOutline: "border border-[#6B3C9C]/50 bg-transparent text-[#6B3C9C] font-['Montserrat'] text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 hover:bg-[#3D1E4A] transition-colors rounded-none",
    secondaryLink: "font-['Montserrat'] text-xs font-semibold tracking-[0.15em] text-black/50 uppercase hover:text-[#6B3C9C] transition-colors",
    navLink: "font-['Montserrat'] text-xs font-bold tracking-[0.15em] text-black/60 uppercase hover:text-[#6B3C9C] transition-colors",
    badge: "font-['Montserrat'] text-[10px] font-bold tracking-[0.15em] text-[#6B3C9C] border border-[#6B3C9C]/50 rounded-none px-3 py-1 uppercase",
    eyebrow: "font-['Montserrat'] text-[11px] font-bold tracking-[0.2em] text-[#6B3C9C] uppercase",
    
    // DISPLAY HEADINGS (Using your custom downloaded fonts)
    headingHero: "font-['Moura'] text-6xl md:text-7xl text-black leading-tight",
    headingModal: "font-['Moura'] text-3xl md:text-4xl text-black tracking-normal",
    headingSection: "font-['Moura'] text-4xl sm:text-5xl text-[#6B3C9C] tracking-normal",
    
    stat: "font-['Moura'] text-5xl text-black tabular-nums tracking-normal",
    // Inside your theme.ts return object:
quote: "font-['Manrope'] text-base md:text-lg font-light text-black/80 leading-relaxed",
    premiumTag: "font-['Sirelia'] text-[#6B3C9C] lowercase tracking-normal text-[1.2em]",
    
    cardRadius: "rounded-none",
    borderBase: "border-[#6B3C9C]/30",
    
    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};