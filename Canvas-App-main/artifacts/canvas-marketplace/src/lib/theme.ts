export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Sans-serif + Script (Montserrat + Semestha)
  const isOpt3 = styleVersion === '3'; // Serif + Sans-serif (Xaviera + Manrope)
  const isOpt4 = styleVersion === '4'; // Thin Serif + Script (Moura + Sirelia)
  // Option 2 is Default: Sans-serif + Serif (Manrope + Mirabelle)

  return {
    // BASE TYPOGRAPHY: Clean system fonts for high readability (Fixed Fallback)
    fontBase: (isOpt1 || isOpt3) 
      ? "font-['Montserrat']" 
      : "font-['Manrope']",
    
    // HERO HEADINGS: Un-squished, properly spaced, and capitalized
    headingHero: isOpt4
      ? "font-['Moura'] font-normal uppercase tracking-normal text-6xl md:text-7xl text-black leading-[1.1]" 
      : isOpt3
      ? "font-['Xaviera'] font-normal capitalize tracking-normal text-6xl md:text-8xl text-black leading-[1.1]" 
      : isOpt1 
      ? "font-['Montserrat'] font-light uppercase tracking-widest text-5xl md:text-7xl text-black leading-[1.2]" 
      : "font-['Manrope'] font-light uppercase tracking-widest text-5xl md:text-7xl text-black leading-[1.2]",
      
    headingModal: isOpt4
      ? "font-['Moura'] text-3xl text-black tracking-normal uppercase"
      : isOpt3
      ? "font-['Xaviera'] text-4xl text-black tracking-normal"
      : isOpt1
      ? "font-['Montserrat'] font-medium uppercase text-2xl text-black tracking-widest"
      : "font-['Manrope'] font-medium uppercase text-2xl text-black tracking-widest",
      
    eyebrow: isOpt4
      ? "font-['Moura'] text-xs font-bold tracking-widest text-[#6B3C9C] uppercase"
      : isOpt3
      ? "font-['Manrope'] text-[10px] font-bold uppercase tracking-[0.4em] text-[#6B3C9C]"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#6B3C9C]"
      : "font-['Manrope'] text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B3C9C]",

    headingSection: isOpt4
      ? "font-['Moura'] text-4xl sm:text-5xl text-[#6B3C9C] uppercase tracking-normal"
      : isOpt3
      ? "font-['Xaviera'] text-4xl sm:text-5xl text-black capitalize tracking-normal"
      : isOpt1
      ? "font-['Montserrat'] font-light uppercase tracking-widest text-3xl sm:text-4xl text-black"
      : "font-['Manrope'] font-light uppercase tracking-widest text-3xl sm:text-4xl text-[#6B3C9C]",
      
    bodyText: isOpt4
      ? "font-['Manrope'] text-[15px] font-light leading-[1.9] text-black/60 lowercase"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-medium leading-[1.7] text-black/65"
      : isOpt1
      ? "font-['Montserrat'] text-[15px] leading-[1.85] text-black/60"
      : "font-['Manrope'] text-[15px] font-light leading-[1.9] text-black/60 lowercase",
      
    formLabel: isOpt4
      ? "font-['Manrope'] text-[11px] font-medium tracking-[0.15em] text-black/45 uppercase"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.2em] text-black"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.25em] text-black/50"
      : "font-['Manrope'] text-[11px] font-semibold uppercase tracking-[0.15em] text-black/40",
      
    inputText: isOpt4
      ? "font-['Manrope'] font-light text-base text-black placeholder:text-black/30 border-b border-[#6B3C9C]/30 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-semibold text-black placeholder:text-black/30 border-b-2 border-black focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt1
      ? "font-['Montserrat'] text-sm font-medium text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : "font-['Manrope'] text-sm font-light text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#6B3C9C]",
      
    btnPrimary: isOpt4
      ? "bg-[#3D1E4A] text-[#6B3C9C] font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none"
      : isOpt3
      ? "bg-black text-white font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-[#6B3C9C] transition-colors rounded-none px-8 py-4"
      : isOpt1
      ? "bg-black text-white font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#6B3C9C] hover:text-white transition-colors rounded-none px-8 py-4"
      : "bg-[#6B3C9C] text-white px-8 py-4 font-['Manrope'] text-xs font-bold uppercase tracking-[0.1em] rounded-full hover:bg-black transition-colors shadow-sm",

    btnOutline: isOpt4
      ? "border border-[#6B3C9C]/50 bg-transparent text-[#6B3C9C] font-['Manrope'] text-xs font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#3D1E4A] transition-colors rounded-none"
      : isOpt3
      ? "border-2 border-black px-8 py-4 font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : isOpt1
      ? "border border-black px-8 py-4 font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : "border border-black/15 bg-transparent px-8 py-4 font-['Manrope'] text-xs font-bold uppercase rounded-full text-black hover:border-black transition-colors",
      
    secondaryLink: isOpt4
      ? "font-['Manrope'] italic text-sm text-black/50 hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#6B3C9C]"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-medium uppercase tracking-widest text-black/50 underline underline-offset-4 decoration-black/20 hover:text-[#6B3C9C]"
      : "font-['Manrope'] text-xs font-medium text-black/40 hover:text-[#6B3C9C] transition-colors",
      
    navLink: isOpt4
      ? "font-['Manrope'] text-sm tracking-[0.1em] text-black/55 uppercase hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-black uppercase tracking-[0.1em] text-black hover:text-[#6B3C9C] transition-colors"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors"
      : "font-['Manrope'] text-[13px] font-bold uppercase tracking-wide text-black/50 hover:text-black transition-colors",
      
    badge: isOpt4
      ? "font-['Manrope'] text-xs tracking-[0.15em] text-[#6B3C9C] border border-[#6B3C9C]/50 rounded-none px-3 py-1 uppercase"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.15em] text-white bg-black px-3 py-1 rounded-none"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B3C9C] border border-[#6B3C9C]/40 rounded-full px-3 py-1"
      : "px-3 py-1 bg-black/5 text-black font-['Manrope'] text-[10px] font-bold uppercase tracking-[0.15em] rounded-full",
      
    stat: isOpt4
      ? "font-['Moura'] text-5xl text-black tabular-nums tracking-normal"
      : isOpt3
      ? "font-['Xaviera'] text-5xl text-black tabular-nums tracking-normal"
      : isOpt1
      ? "font-['Montserrat'] font-light text-5xl text-black tabular-nums"
      : "font-['Manrope'] font-light text-5xl text-black tabular-nums",
      
    quote: isOpt4
      ? "font-['Sirelia'] text-2xl md:text-3xl text-black/80 leading-relaxed"
      : isOpt3
      ? "font-['Xaviera'] text-xl text-black/80 leading-relaxed tracking-normal"
      : isOpt1
      ? "font-['Mirabelle'] text-xl md:text-2xl text-black/80 leading-relaxed"
      : "font-['Manrope'] italic font-light text-2xl text-black/70 leading-relaxed",

    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#6B3C9C]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    // THE PREMIUM ACCENT: Strictly following the font pairing video formulas
    premiumTag: isOpt4
      ? "font-['Sirelia'] text-[#6B3C9C] lowercase tracking-normal text-[1.2em]" 
      : isOpt3
      ? "font-['Manrope'] italic font-light uppercase tracking-[0.3em] text-[#6B3C9C] text-[0.6em] align-middle" 
      : isOpt1
      ? "font-['Semestha'] text-[#6B3C9C] lowercase tracking-normal text-[1.4em]" 
      : "font-['Mirabelle'] text-[#6B3C9C] lowercase tracking-normal text-[1.2em]", 

    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};