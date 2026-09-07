export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Classic Editorial
  const isOpt3 = styleVersion === '3'; // Bold Fashion
  const isOpt4 = styleVersion === '4'; // Quiet Old-World
  // Option 2 (Aesop Minimalist) is the default

  return {
    fontBase: isOpt4 ? "font-['EB_Garamond']" : (isOpt1 || isOpt3) ? "font-['Montserrat']" : "font-['Manrope'] lowercase",
    
    headingHero: isOpt4 ? "font-['Cormorant_Garamond'] font-semibold text-7xl md:text-8xl text-black tracking-tight leading-[0.9]" : isOpt3 ? "font-['Montserrat'] font-black text-7xl md:text-8xl text-black uppercase tracking-tighter leading-[0.85]" : isOpt1 ? "font-['Montserrat'] font-black text-6xl md:text-7xl text-black tracking-tight leading-[0.95] uppercase" : "font-['Fraunces'] font-light text-6xl md:text-7xl text-black tracking-tight lowercase leading-[0.95]",
      
    headingModal: isOpt4 ? "font-['Cormorant_Garamond'] italic font-medium text-4xl text-black" : isOpt3 ? "font-['Montserrat'] font-black text-4xl text-black uppercase tracking-tight" : isOpt1 ? "font-['Montserrat'] font-extrabold text-3xl text-black tracking-tight uppercase" : "font-['Fraunces'] font-normal text-3xl text-black lowercase tracking-tight",
      
    eyebrow: isOpt4 ? "font-['EB_Garamond'] text-xs font-medium tracking-[0.3em] text-[#B66CF2] uppercase [font-variant:small-caps]" : isOpt3 ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.4em] text-[#B66CF2]" : isOpt1 ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#B66CF2]" : "font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.25em] text-black/40",
      
    headingSection: isOpt4 ? "font-['Cormorant_Garamond'] font-semibold text-4xl text-[#BA965B]" : isOpt3 ? "font-['Montserrat'] font-black text-3xl text-black uppercase tracking-tight" : isOpt1 ? "font-['Playfair_Display'] font-bold text-4xl sm:text-5xl text-black capitalize" : "font-['Fraunces'] italic font-normal text-3xl sm:text-5xl text-[#BA965B] lowercase",
      
    bodyText: isOpt4 ? "font-['EB_Garamond'] text-base leading-[1.9] text-black/65" : isOpt3 ? "font-['Montserrat'] text-sm font-medium leading-[1.7] text-black/65" : isOpt1 ? "font-['Montserrat'] text-[15px] leading-[1.85] text-black/60" : "font-['Manrope'] text-[15px] font-light leading-[1.9] text-black/55 lowercase",
      
    formLabel: isOpt4 ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-black/45 [font-variant:small-caps]" : isOpt3 ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.2em] text-black" : isOpt1 ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.25em] text-black/50" : "font-['Manrope'] text-[11px] font-medium lowercase tracking-[0.15em] text-black/40",
      
    inputText: isOpt4 ? "font-['EB_Garamond'] text-base text-black placeholder:text-black/30 border-b border-[#BA965B]/30 focus:border-[#BA965B] outline-none bg-transparent py-2.5" : isOpt3 ? "font-['Montserrat'] text-sm font-semibold text-black placeholder:text-black/30 border-b-2 border-black focus:border-[#B66CF2] outline-none bg-transparent py-2.5" : isOpt1 ? "font-['Montserrat'] text-sm text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#BA965B] outline-none bg-transparent py-2.5" : "font-['Manrope'] text-sm font-light text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#BA965B]",
      
    btnPrimary: isOpt4 ? "bg-[#2D1B4E] text-[#BA965B] font-['EB_Garamond'] text-sm tracking-[0.2em] [font-variant:small-caps] px-8 py-4 hover:bg-black transition-colors rounded-none" : isOpt3 ? "bg-black text-white font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-[#B66CF2] transition-colors rounded-none px-8 py-4" : isOpt1 ? "bg-black text-white font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#BA965B] hover:text-black transition-colors rounded-none px-8 py-4" : "bg-[#BA965B] text-white px-8 py-4 font-['Manrope'] text-xs font-semibold lowercase tracking-[0.1em] rounded-full hover:bg-black transition-colors shadow-sm",

    btnOutline: isOpt4 ? "border border-[#BA965B]/50 bg-transparent text-[#BA965B] font-['EB_Garamond'] text-sm tracking-[0.2em] [font-variant:small-caps] px-8 py-4 hover:bg-[#2D1B4E] transition-colors rounded-none" : isOpt3 ? "border-2 border-black px-8 py-4 font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors rounded-none text-black" : isOpt1 ? "border border-black px-8 py-4 font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none text-black" : "border border-black/15 bg-transparent px-8 py-4 font-['Manrope'] text-xs font-medium lowercase rounded-full text-black hover:border-black transition-colors",
      
    secondaryLink: isOpt4 ? "font-['EB_Garamond'] italic text-sm text-black/50 hover:text-[#BA965B]" : isOpt3 ? "font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#B66CF2]" : isOpt1 ? "font-['Montserrat'] text-xs font-medium uppercase tracking-widest text-black/50 underline underline-offset-4 decoration-black/20 hover:text-[#BA965B]" : "font-['Manrope'] text-xs font-medium lowercase text-black/40 hover:text-[#BA965B] transition-colors",
      
    navLink: isOpt4 ? "font-['EB_Garamond'] text-sm tracking-[0.1em] text-black/55 [font-variant:small-caps] hover:text-[#BA965B]" : isOpt3 ? "font-['Montserrat'] text-xs font-black uppercase tracking-[0.1em] text-black hover:text-[#B66CF2] transition-colors" : isOpt1 ? "font-['Montserrat'] text-xs font-bold uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors" : "font-['Manrope'] text-[13px] font-medium lowercase tracking-wide text-black/50 hover:text-black transition-colors",
      
    badge: isOpt4 ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-[#BA965B] border border-[#BA965B]/50 rounded-none px-3 py-1 [font-variant:small-caps]" : isOpt3 ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.15em] text-white bg-black px-3 py-1 rounded-none" : isOpt1 ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#BA965B] border border-[#BA965B]/40 rounded-full px-3 py-1" : "px-3 py-1 bg-black/5 text-black font-['Manrope'] text-[10px] font-medium uppercase tracking-[0.15em] rounded-full",
      
    stat: isOpt4 ? "font-['Cormorant_Garamond'] font-semibold text-5xl text-black tabular-nums" : isOpt3 ? "font-['Montserrat'] font-black text-5xl text-black tabular-nums" : isOpt1 ? "font-['Montserrat'] font-black text-4xl text-black tabular-nums" : "font-['Fraunces'] font-light text-4xl text-black tabular-nums",
      
    quote: isOpt4 ? "font-['Cormorant_Garamond'] italic text-2xl md:text-3xl text-black/80 leading-relaxed" : isOpt3 ? "font-['Montserrat'] italic font-bold text-xl text-black/80 leading-relaxed" : isOpt1 ? "font-['Playfair_Display'] italic text-xl md:text-2xl text-black/80 leading-relaxed" : "font-['Fraunces'] italic font-light text-lg text-black/70 leading-relaxed",

    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#BA965B]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    premiumTag: isOpt4 ? "font-['Cormorant_Garamond'] italic font-semibold text-[#BA965B]" : isOpt3 ? "font-['Montserrat'] font-black text-[#B66CF2] uppercase tracking-tighter" : isOpt1 ? "font-['Playfair_Display'] italic font-semibold text-[#BA965B] tracking-widest capitalize" : "font-['Fraunces'] italic font-light text-[#BA965B] tracking-wide lowercase",
  };
};