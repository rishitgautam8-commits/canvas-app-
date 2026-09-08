export const getTheme = (styleVersion?: string) => {
  return {
    fontBase: "font-['Manrope']",
    
    // Primary Headers set to Moura
    headingHero: "font-['Moura'] font-normal text-6xl md:text-7xl text-black leading-[1.1] tracking-normal lowercase",
    headingModal: "font-['Moura'] text-3xl text-black tracking-tight lowercase",
    eyebrow: "font-['Montserrat'] text-[11px] font-bold tracking-[0.2em] text-[#6B3C9C] uppercase",
    headingSection: "font-['Moura'] text-4xl sm:text-5xl text-[#6B3C9C] tracking-normal lowercase",
    
    bodyText: "font-['Manrope'] text-[15px] font-light leading-[1.9] text-black/60",
    formLabel: "font-['Manrope'] text-[11px] font-medium tracking-[0.15em] text-black/45 uppercase",
    inputText: "font-['Manrope'] font-light text-base text-black placeholder:text-black/30 border-b border-[#6B3C9C]/30 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5 transition-colors",
    
    btnPrimary: "bg-[#3D1E4A] text-[#6B3C9C] font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none",
    btnOutline: "border border-[#6B3C9C]/50 bg-transparent text-[#6B3C9C] font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#3D1E4A] transition-colors rounded-none",
    
    secondaryLink: "font-['Manrope'] italic text-sm text-black/50 hover:text-[#6B3C9C]",
    navLink: "font-['Manrope'] text-sm tracking-[0.1em] text-black/55 uppercase hover:text-[#6B3C9C] transition-colors",
    badge: "font-['Manrope'] text-xs tracking-[0.15em] text-[#6B3C9C] border border-[#6B3C9C]/50 rounded-none px-3 py-1 uppercase",
    
    stat: "font-['Moura'] text-5xl text-black tabular-nums",
    quote: "font-['Beau_Rivage'] text-3xl text-black/80 leading-relaxed",
    
    cardRadius: "rounded-none",
    borderBase: "border-[#6B3C9C]/30",
    
    // The Script Accent: Beau Rivage (or change to 'WindSong' if preferred)
    premiumTag: "font-['Beau_Rivage'] text-[#6B3C9C] text-[1.8em] tracking-normal lowercase",
    
    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};