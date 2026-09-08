export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Vogue (Sirelia/Mirabelle)
  const isOpt3 = styleVersion === '3'; // Tom Ford (Xaviera/Acthirey)
  const isOpt4 = styleVersion === '4'; // Old World (Effyra/Faven Brill)
  // Option 2 (Aesop Minimalist) is the default

  return {
    // ==========================================
    // 1. STRUCTURAL TYPOGRAPHY (Strictly Clean Sans-Serifs for UI/Readability)
    // ==========================================
    fontBase: (isOpt1 || isOpt3) ? "font-['Montserrat']" : "font-['Manrope']",
    
    bodyText: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-[15px] leading-[1.85] text-black/60"
      : "font-['Manrope'] text-[15px] font-medium leading-[1.9] text-black/60",
      
    formLabel: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.25em] text-black/50"
      : "font-['Manrope'] text-[11px] font-bold uppercase tracking-[0.2em] text-black/50",
      
    inputText: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-sm font-medium text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : "font-['Manrope'] text-sm font-medium text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#6B3C9C]",
      
    btnPrimary: (isOpt1 || isOpt3)
      ? "bg-black text-white font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#6B3C9C] transition-colors rounded-none px-8 py-4"
      : "bg-[#6B3C9C] text-white font-['Manrope'] text-xs font-bold uppercase tracking-[0.15em] rounded-full px-8 py-4 hover:bg-black transition-colors shadow-sm",
      
    btnOutline: (isOpt1 || isOpt3)
      ? "border-2 border-black bg-transparent text-black font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none px-8 py-4"
      : "border border-black/15 bg-transparent text-black font-['Manrope'] text-xs font-bold uppercase tracking-[0.15em] rounded-full px-8 py-4 hover:border-black transition-colors",
      
    secondaryLink: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#6B3C9C]"
      : "font-['Manrope'] text-xs font-bold uppercase tracking-widest text-black/50 hover:text-[#6B3C9C] transition-colors",
      
    navLink: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors"
      : "font-['Manrope'] text-[13px] font-bold uppercase tracking-[0.15em] text-black/50 hover:text-black transition-colors",
      
    eyebrow: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#6B3C9C]"
      : "font-['Manrope'] text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B3C9C]",
      
    badge: (isOpt1 || isOpt3)
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B3C9C] border border-[#6B3C9C]/40 rounded-none px-3 py-1"
      : "font-['Manrope'] text-[10px] font-bold uppercase tracking-[0.2em] text-black bg-black/5 rounded-full px-3 py-1",
      
    // ==========================================
    // 2. DISPLAY TYPOGRAPHY (Your Custom Downloaded Fonts)
    // ==========================================
    // These are ONLY applied to massive text elements so they remain gorgeous and legible.
    headingHero: isOpt4
      ? "font-['Effyra'] text-7xl md:text-8xl text-black tracking-tight leading-[1]" 
      : isOpt3
      ? "font-['Xaviera'] text-7xl md:text-8xl text-black tracking-tighter leading-[0.9]" 
      : isOpt1 
      ? "font-['Sirelia'] text-7xl md:text-8xl text-black tracking-tight leading-[0.95]" 
      : "font-['Moura'] text-6xl md:text-7xl text-black tracking-widest lowercase leading-[1]",
      
    headingModal: isOpt4
      ? "font-['Faven_Brill'] text-4xl text-black tracking-tight"
      : isOpt3
      ? "font-['Acthirey'] text-4xl text-black tracking-tight"
      : isOpt1
      ? "font-['Mirabelle'] text-3xl text-black tracking-tight"
      : "font-['Moura'] text-3xl text-black tracking-tight",
      
    headingSection: isOpt4
      ? "font-['Faven_Brill'] text-4xl sm:text-5xl text-[#6B3C9C]"
      : isOpt3
      ? "font-['Acthirey'] text-3xl sm:text-4xl text-black tracking-tight"
      : isOpt1
      ? "font-['Mirabelle'] text-4xl sm:text-5xl text-black"
      : "font-['Moura'] text-3xl sm:text-5xl text-[#6B3C9C]",
      
    stat: isOpt4
      ? "font-['Faven_Brill'] text-5xl text-black tabular-nums"
      : isOpt3
      ? "font-['Acthirey'] text-5xl text-black tabular-nums"
      : isOpt1
      ? "font-['Mirabelle'] text-4xl text-black tabular-nums"
      : "font-['Moura'] text-4xl text-black tabular-nums",
      
    quote: isOpt4
      ? "font-['Faven_Brill'] text-2xl md:text-3xl text-black/80 leading-relaxed"
      : isOpt3
      ? "font-['Acthirey'] text-xl text-black/80 leading-relaxed"
      : isOpt1
      ? "font-['Mirabelle'] text-xl md:text-2xl text-black/80 leading-relaxed"
      : "font-['Moura'] text-xl text-black/70 leading-relaxed",

    // The signature accent script
    premiumTag: "font-['Semestha'] text-[#6B3C9C] text-[1.2em] tracking-wide",

    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#6B3C9C]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};