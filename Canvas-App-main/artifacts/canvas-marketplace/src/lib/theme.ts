export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Vogue: Ballet + Allura + Bodoni Moda
  const isOpt3 = styleVersion === '3'; // Tom Ford: DM Serif Display + Allura + Bodoni Moda
  const isOpt4 = styleVersion === '4'; // Old World: EB Garamond + Playfair + Cormorant

  // ==========================================================
  // HANSIKA'S AMETHYST CRYSTAL PALETTE
  // Deep, natural, jewel-toned violets. Neon #6B3C9C is gone.
  // ==========================================================
  const AMETHYST = {
    400: '#9B7CB6', // soft crystal
    500: '#7B5AA6', // medium
    600: '#6B3A7D', // primary rich amethyst
    700: '#5D2F6E', // deep
    800: '#4A2459', // dark jewel
    900: '#3D1E4A', // midnight violet
  };

  return {
    // Base typography
    fontBase: isOpt4 
      ? "font-['EB_Garamond']" 
      : (isOpt1 || isOpt3) 
      ? "font-['Montserrat']" 
      : "font-['Manrope'] lowercase",
    
    // Hero headings — Hansika's display / cursive fonts
    headingHero: isOpt4
      ? "font-['EB_Garamond'] font-medium text-7xl md:text-8xl text-black tracking-tight leading-[1]"
      : isOpt3
      ? "font-['DM_Serif_Display'] italic text-7xl md:text-8xl text-black tracking-tighter leading-[0.9]"
      : isOpt1 
      ? "font-['Ballet'] text-7xl md:text-8xl text-black tracking-tight leading-[0.95] normal-case" 
      : "font-['Italiana'] text-6xl md:text-7xl text-black tracking-tight lowercase leading-[1]",
      
    // Modal / drawer headings
    headingModal: isOpt4
      ? "font-['EB_Garamond'] font-medium text-4xl text-black"
      : isOpt3
      ? "font-['Bodoni_Moda'] italic text-4xl text-black tracking-tight"
      : isOpt1
      ? "font-['Bodoni_Moda'] italic text-3xl text-black tracking-tight"
      : "font-['Playfair_Display'] italic text-3xl text-black tracking-tight",
      
    // Eyebrow labels — clean, minimal, now in amethyst
    eyebrow: isOpt4
      ? "font-['EB_Garamond'] text-xs font-semibold tracking-[0.3em] text-[#6B3A7D] uppercase [font-variant:small-caps]"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.4em] text-[#6B3A7D]"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#6B3A7D]"
      : "font-['Manrope'] text-[11px] font-bold lowercase tracking-[0.25em] text-black/40",
      
    // Section headings — editorial italics
    headingSection: isOpt4
      ? "font-['Cormorant_Garamond'] italic text-4xl text-[#BA965B]"
      : isOpt3
      ? "font-['Bodoni_Moda'] italic text-3xl text-black tracking-tight"
      : isOpt1
      ? "font-['Bodoni_Moda'] italic text-4xl sm:text-5xl text-black"
      : "font-['Playfair_Display'] italic text-3xl sm:text-5xl text-[#BA965B]",
      
    // Body text — clean and readable
    bodyText: isOpt4
      ? "font-['EB_Garamond'] text-base leading-[1.9] text-black/65"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-medium leading-[1.7] text-black/65"
      : isOpt1
      ? "font-['Montserrat'] text-[15px] leading-[1.85] text-black/60"
      : "font-['Manrope'] text-[15px] font-medium leading-[1.9] text-black/55 lowercase",
      
    // Form labels
    formLabel: isOpt4
      ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-black/45 [font-variant:small-caps]"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.2em] text-black"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.25em] text-black/50"
      : "font-['Manrope'] text-[11px] font-bold lowercase tracking-[0.15em] text-black/40",
      
    // Inputs
    inputText: isOpt4
      ? "font-['EB_Garamond'] text-base text-black placeholder:text-black/30 border-b border-[#BA965B]/30 focus:border-[#BA965B] outline-none bg-transparent py-2.5"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-semibold text-black placeholder:text-black/30 border-b-2 border-black focus:border-[#6B3A7D] outline-none bg-transparent py-2.5"
      : isOpt1
      ? "font-['Montserrat'] text-sm font-medium text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#BA965B] outline-none bg-transparent py-2.5"
      : "font-['Manrope'] text-sm font-medium text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B]",
      
    // Primary buttons
    btnPrimary: isOpt4
      ? "bg-[#2D1B4E] text-[#BA965B] font-['EB_Garamond'] text-sm tracking-[0.2em] [font-variant:small-caps] px-8 py-4 hover:bg-black transition-colors rounded-none"
      : isOpt3
      ? "bg-black text-white font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-[#6B3A7D] transition-colors rounded-none px-8 py-4"
      : isOpt1
      ? "bg-black text-white font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#BA965B] hover:text-black transition-colors rounded-none px-8 py-4"
      : "bg-[#BA965B] text-white px-8 py-4 font-['Manrope'] text-xs font-bold lowercase tracking-[0.1em] rounded-full hover:bg-black transition-colors shadow-sm",

    // Outline buttons
    btnOutline: isOpt4
      ? "border border-[#BA965B]/50 bg-transparent text-[#BA965B] font-['EB_Garamond'] text-sm tracking-[0.2em] [font-variant:small-caps] px-8 py-4 hover:bg-[#2D1B4E] transition-colors rounded-none"
      : isOpt3
      ? "border-2 border-black px-8 py-4 font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : isOpt1
      ? "border border-black px-8 py-4 font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : "border border-black/15 bg-transparent px-8 py-4 font-['Manrope'] text-xs font-bold lowercase rounded-full text-black hover:border-black transition-colors",
      
    // Secondary links
    secondaryLink: isOpt4
      ? "font-['EB_Garamond'] italic text-sm text-black/50 hover:text-[#BA965B]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#6B3A7D]"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-medium uppercase tracking-widest text-black/50 underline underline-offset-4 decoration-black/20 hover:text-[#BA965B]"
      : "font-['Manrope'] text-xs font-bold lowercase text-black/40 hover:text-[#BA965B] transition-colors",
      
    // Nav links
    navLink: isOpt4
      ? "font-['EB_Garamond'] text-sm tracking-[0.1em] text-black/55 [font-variant:small-caps] hover:text-[#BA965B]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-black uppercase tracking-[0.1em] text-black hover:text-[#6B3A7D] transition-colors"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors"
      : "font-['Manrope'] text-[13px] font-bold lowercase tracking-wide text-black/50 hover:text-black transition-colors",
      
    // Badges
    badge: isOpt4
      ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-[#BA965B] border border-[#BA965B]/50 rounded-none px-3 py-1 [font-variant:small-caps]"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.15em] text-white bg-black px-3 py-1 rounded-none"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#BA965B] border border-[#BA965B]/40 rounded-full px-3 py-1"
      : "px-3 py-1 bg-black/5 text-black font-['Manrope'] text-[10px] font-bold uppercase tracking-[0.15em] rounded-full",
      
    // Stats
    stat: isOpt4
      ? "font-['EB_Garamond'] font-medium text-5xl text-black tabular-nums"
      : isOpt3
      ? "font-['Montserrat'] font-black text-5xl text-black tabular-nums"
      : isOpt1
      ? "font-['Montserrat'] font-bold text-4xl text-black tabular-nums"
      : "font-['Manrope'] font-medium text-4xl text-black tabular-nums",
      
    // Quotes — elegant italics
    quote: isOpt4
      ? "font-['EB_Garamond'] italic text-2xl md:text-3xl text-black/80 leading-relaxed"
      : isOpt3
      ? "font-['Cormorant_Garamond'] italic font-semibold text-xl text-black/80 leading-relaxed"
      : isOpt1
      ? "font-['Cormorant_Garamond'] italic text-xl md:text-2xl text-black/80 leading-relaxed"
      : "font-['Cormorant_Garamond'] italic text-xl text-black/70 leading-relaxed",

    // Radius & borders
    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#BA965B]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    // ==========================================================
    // HANSIKA'S "PREMIUM IN CURSIVE"
    // Mapped across all 4 options using her requested font list
    // ==========================================================
    premiumTag: isOpt4
      ? "font-['Playfair_Display'] italic text-[#BA965B] lowercase tracking-normal leading-normal"
      : isOpt3
      ? "font-['Allura'] text-[#BA965B] lowercase tracking-wide leading-normal"
      : isOpt1
      ? "font-['Allura'] text-[#BA965B] lowercase tracking-wide leading-normal"
      : "font-['Cormorant_Garamond'] italic text-[#BA965B] lowercase tracking-normal leading-normal",

    // ==========================================================
    // AMETHYST ACCENT UTILITIES (replaces neon #6B3C9C)
    // Use these in inline styles or Tailwind arbitrary classes
    // ==========================================================
    accentColor: '#6B3A7D',
    accentLight: '#9B7CB6',
    accentDeep: '#4A2459',
    accentText: 'text-[#6B3A7D]',
    accentBg: 'bg-[#6B3A7D]',
    accentBorder: 'border-[#6B3A7D]',
    accentTextLight: 'text-[#9B7CB6]',
    accentBgLight: 'bg-[#6B3A7D]/10',
    accentBorderLight: 'border-[#6B3A7D]/40',
  };
};