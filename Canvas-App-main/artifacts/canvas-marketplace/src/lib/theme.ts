export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Boracay / Kuroga Style
  const isOpt3 = styleVersion === '3'; // St. Croix / Restaglick Style
  const isOpt4 = styleVersion === '4'; // Sinethar / Jost Van Dyke Style
  // Option 2 (Santorini / Kefalonia Minimalist) is the default

  return {
    // Base layout font using her custom options
    fontBase: isOpt4 
      ? "font-['Jost_Van_Dyke']" 
      : (isOpt1 || isOpt3) 
      ? "font-['Boracay']" 
      : "font-['Santorini']",
    
    // Hero headings using her screenshot fonts
    headingHero: isOpt4
      ? "font-['Sinethar'] text-6xl md:text-8xl text-black tracking-tight leading-[1]"
      : isOpt3
      ? "font-['Restaglick'] text-7xl md:text-8xl text-black tracking-tighter leading-[0.9]"
      : isOpt1 
      ? "font-['Boracay'] text-7xl md:text-8xl text-black tracking-tight leading-[0.95]" 
      : "font-['Kefalonia'] text-6xl md:text-7xl text-black tracking-widest leading-[1]",
      
    // Modal headings
    headingModal: isOpt4
      ? "font-['Jost_Van_Dyke'] text-4xl text-black"
      : isOpt3
      ? "font-['St_Croix'] text-4xl text-black tracking-tight"
      : isOpt1
      ? "font-['Boracay'] text-3xl text-black tracking-tight"
      : "font-['Santorini'] text-3xl text-black tracking-tight",
      
    // Eyebrow tags in Amethyst Crystal (#6B3C9C)
    eyebrow: isOpt4
      ? "font-['Jost_Van_Dyke'] text-xs tracking-[0.3em] text-[#6B3C9C] uppercase"
      : isOpt3
      ? "font-['St_Croix'] text-[10px] uppercase tracking-[0.4em] text-[#6B3C9C]"
      : isOpt1
      ? "font-['Boracay'] text-[10px] uppercase tracking-[0.35em] text-[#6B3C9C]"
      : "font-['Kefalonia'] text-[11px] tracking-[0.25em] text-black/40",
      
    // Section headings
    headingSection: isOpt4
      ? "font-['Sinethar'] text-4xl text-[#6B3C9C]"
      : isOpt3
      ? "font-['Restaglick'] text-3xl text-black tracking-tight"
      : isOpt1
      ? "font-['Boracay'] text-4xl sm:text-5xl text-black"
      : "font-['Santorini'] text-3xl sm:text-5xl text-[#6B3C9C]",
      
    // Body text
    bodyText: isOpt4
      ? "font-['Jost_Van_Dyke'] text-base leading-[1.9] text-black/65"
      : isOpt3
      ? "font-['St_Croix'] text-sm leading-[1.7] text-black/65"
      : isOpt1
      ? "font-['Boracay'] text-[15px] leading-[1.85] text-black/60"
      : "font-['Santorini'] text-[15px] leading-[1.9] text-black/55",
      
    // Form labels
    formLabel: isOpt4
      ? "font-['Jost_Van_Dyke'] text-xs tracking-[0.15em] text-black/45 uppercase"
      : isOpt3
      ? "font-['St_Croix'] text-[10px] uppercase tracking-[0.2em] text-black"
      : isOpt1
      ? "font-['Boracay'] text-[10px] uppercase tracking-[0.25em] text-black/50"
      : "font-['Santorini'] text-[11px] tracking-[0.15em] text-black/40",
      
    // Inputs
    inputText: isOpt4
      ? "font-['Jost_Van_Dyke'] text-base text-black placeholder:text-black/30 border-b border-[#6B3C9C]/30 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt3
      ? "font-['St_Croix'] text-sm text-black placeholder:text-black/30 border-b-2 border-black focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt1
      ? "font-['Boracay'] text-sm text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : "font-['Santorini'] text-sm text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#6B3C9C]",
      
    // Primary buttons
    btnPrimary: isOpt4
      ? "bg-[#3D1E4A] text-[#6B3C9C] font-['Jost_Van_Dyke'] text-sm tracking-[0.2em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none"
      : isOpt3
      ? "bg-black text-white font-['St_Croix'] text-xs uppercase tracking-[0.15em] hover:bg-[#6B3C9C] transition-colors rounded-none px-8 py-4"
      : isOpt1
      ? "bg-black text-white font-['Boracay'] text-xs uppercase tracking-[0.2em] hover:bg-[#6B3C9C] hover:text-white transition-colors rounded-none px-8 py-4"
      : "bg-[#6B3C9C] text-white px-8 py-4 font-['Santorini'] text-xs lowercase tracking-[0.1em] rounded-full hover:bg-black transition-colors shadow-sm",

    // Outline buttons
    btnOutline: isOpt4
      ? "border border-[#6B3C9C]/50 bg-transparent text-[#6B3C9C] font-['Jost_Van_Dyke'] text-sm tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#3D1E4A] transition-colors rounded-none"
      : isOpt3
      ? "border-2 border-black px-8 py-4 font-['St_Croix'] text-xs uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : isOpt1
      ? "border border-black px-8 py-4 font-['Boracay'] text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : "border border-black/15 bg-transparent px-8 py-4 font-['Santorini'] text-xs lowercase rounded-full text-black hover:border-black transition-colors",
      
    // Secondary links
    secondaryLink: isOpt4
      ? "font-['Jost_Van_Dyke'] text-sm text-black/50 hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['St_Croix'] text-xs uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#6B3C9C]"
      : isOpt1
      ? "font-['Boracay'] text-xs uppercase tracking-widest text-black/50 underline underline-offset-4 decoration-black/20 hover:text-[#6B3C9C]"
      : "font-['Santorini'] text-xs lowercase text-black/40 hover:text-[#6B3C9C] transition-colors",
      
    // Nav links
    navLink: isOpt4
      ? "font-['Jost_Van_Dyke'] text-sm tracking-[0.1em] text-black/55 uppercase hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['St_Croix'] text-xs uppercase tracking-[0.1em] text-black hover:text-[#6B3C9C] transition-colors"
      : isOpt1
      ? "font-['Boracay'] text-xs uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors"
      : "font-['Santorini'] text-[13px] lowercase tracking-wide text-black/50 hover:text-black transition-colors",
      
    // Badges
    badge: isOpt4
      ? "font-['Jost_Van_Dyke'] text-xs tracking-[0.15em] text-[#6B3C9C] border border-[#6B3C9C]/50 rounded-none px-3 py-1 uppercase"
      : isOpt3
      ? "font-['St_Croix'] text-[10px] uppercase tracking-[0.15em] text-white bg-black px-3 py-1 rounded-none"
      : isOpt1
      ? "font-['Boracay'] text-[10px] uppercase tracking-[0.2em] text-[#6B3C9C] border border-[#6B3C9C]/40 rounded-full px-3 py-1"
      : "px-3 py-1 bg-black/5 text-black font-['Santorini'] text-[10px] uppercase tracking-[0.15em] rounded-full",
      
    // Stats
    stat: isOpt4
      ? "font-['Sinethar'] text-5xl text-black tabular-nums"
      : isOpt3
      ? "font-['Restaglick'] text-5xl text-black tabular-nums"
      : isOpt1
      ? "font-['Boracay'] text-4xl text-black tabular-nums"
      : "font-['Kefalonia'] text-4xl text-black tabular-nums",
      
    // Quotes
    quote: isOpt4
      ? "font-['Sinethar'] text-2xl md:text-3xl text-black/80 leading-relaxed"
      : isOpt3
      ? "font-['Restaglick'] text-xl text-black/80 leading-relaxed"
      : isOpt1
      ? "font-['Boracay'] text-xl md:text-2xl text-black/80 leading-relaxed"
      : "font-['Kefalonia'] text-xl text-black/70 leading-relaxed",

    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#6B3C9C]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    // Premium cursive tags mapped precisely to her requested handwriting/display styles
    premiumTag: isOpt4
      ? "font-['Sinethar'] text-[#6B3C9C]"
      : isOpt3
      ? "font-['Restaglick'] text-[#6B3C9C]"
      : isOpt1
      ? "font-['Kuroga'] text-[#6B3C9C]"
      : "font-['Kefalonia'] text-[#6B3C9C]",

    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};