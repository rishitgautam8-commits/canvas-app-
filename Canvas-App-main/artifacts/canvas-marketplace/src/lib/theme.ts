export const getTheme = (styleVersion: string) => {
  const isOpt1 = styleVersion === '1'; // Vogue: Sirelia + Mirabelle + Semestha
  const isOpt3 = styleVersion === '3'; // Tom Ford: Xaviera + Acthirey + Semestha
  const isOpt4 = styleVersion === '4'; // Old World: Effyra + Faven Brill + Semestha
  // Option 2 (Aesop Minimalist): Moura + Semestha

  return {
    // BASE TYPOGRAPHY (Kept clean for readability on small UI elements)
    fontBase: isOpt4 
      ? "font-['EB_Garamond']" 
      : (isOpt1 || isOpt3) 
      ? "font-['Montserrat']" 
      : "font-['Manrope'] lowercase",
    
    // HERO HEADINGS (Your Custom Downloaded Fonts)
    headingHero: isOpt4
      ? "font-['Effyra'] text-7xl md:text-8xl text-black tracking-tight leading-[1]" // Old World
      : isOpt3
      ? "font-['Xaviera'] text-7xl md:text-8xl text-black tracking-tighter leading-[0.9]" // Bold Fashion
      : isOpt1 
      ? "font-['Sirelia'] text-7xl md:text-8xl text-black tracking-tight leading-[0.95]" // Classic Editorial
      : "font-['Moura'] text-6xl md:text-7xl text-black tracking-widest lowercase leading-[1]", // Minimalist
      
    // MODAL HEADINGS
    headingModal: isOpt4
      ? "font-['Faven_Brill'] text-4xl text-black"
      : isOpt3
      ? "font-['Acthirey'] text-4xl text-black tracking-tight"
      : isOpt1
      ? "font-['Mirabelle'] text-3xl text-black tracking-tight"
      : "font-['Moura'] text-3xl text-black tracking-tight",
      
    // SECTION HEADINGS
    headingSection: isOpt4
      ? "font-['Faven_Brill'] text-4xl text-[#6B3C9C]"
      : isOpt3
      ? "font-['Acthirey'] text-3xl text-black tracking-tight"
      : isOpt1
      ? "font-['Mirabelle'] text-4xl sm:text-5xl text-black"
      : "font-['Moura'] text-3xl sm:text-5xl text-[#6B3C9C]",
      
    // EYEBROWS (Small tags)
    eyebrow: isOpt4
      ? "font-['EB_Garamond'] text-xs font-semibold tracking-[0.3em] text-[#6B3C9C] uppercase"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.4em] text-[#6B3C9C]"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.35em] text-[#6B3C9C]"
      : "font-['Manrope'] text-[11px] font-bold lowercase tracking-[0.25em] text-black/40",

    // BODY TEXT (Maintained as system fonts for UX readability)
    bodyText: isOpt4
      ? "font-['EB_Garamond'] text-base leading-[1.9] text-black/65"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-medium leading-[1.7] text-black/65"
      : isOpt1
      ? "font-['Montserrat'] text-[15px] leading-[1.85] text-black/60"
      : "font-['Manrope'] text-[15px] font-medium leading-[1.9] text-black/55 lowercase",
      
    formLabel: isOpt4
      ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-black/45 uppercase"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.2em] text-black"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.25em] text-black/50"
      : "font-['Manrope'] text-[11px] font-bold lowercase tracking-[0.15em] text-black/40",
      
    inputText: isOpt4
      ? "font-['EB_Garamond'] text-base text-black placeholder:text-black/30 border-b border-[#6B3C9C]/30 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt3
      ? "font-['Montserrat'] text-sm font-semibold text-black placeholder:text-black/30 border-b-2 border-black focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : isOpt1
      ? "font-['Montserrat'] text-sm font-medium text-black placeholder:text-black/30 border-b border-black/15 focus:border-[#6B3C9C] outline-none bg-transparent py-2.5"
      : "font-['Manrope'] text-sm font-medium text-black placeholder:text-black/25 border-b border-black/10 bg-transparent py-2.5 outline-none transition-colors focus:border-[#6B3C9C]",
      
    btnPrimary: isOpt4
      ? "bg-[#3D1E4A] text-[#6B3C9C] font-['EB_Garamond'] text-sm tracking-[0.2em] uppercase px-8 py-4 hover:bg-black transition-colors rounded-none"
      : isOpt3
      ? "bg-black text-white font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-[#6B3C9C] transition-colors rounded-none px-8 py-4"
      : isOpt1
      ? "bg-black text-white font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#6B3C9C] hover:text-white transition-colors rounded-none px-8 py-4"
      : "bg-[#6B3C9C] text-white px-8 py-4 font-['Manrope'] text-xs font-bold lowercase tracking-[0.1em] rounded-full hover:bg-black transition-colors shadow-sm",

    btnOutline: isOpt4
      ? "border border-[#6B3C9C]/50 bg-transparent text-[#6B3C9C] font-['EB_Garamond'] text-sm tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#3D1E4A] transition-colors rounded-none"
      : isOpt3
      ? "border-2 border-black px-8 py-4 font-['Montserrat'] text-xs font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : isOpt1
      ? "border border-black px-8 py-4 font-['Montserrat'] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors rounded-none text-black"
      : "border border-black/15 bg-transparent px-8 py-4 font-['Manrope'] text-xs font-bold lowercase rounded-full text-black hover:border-black transition-colors",
      
    secondaryLink: isOpt4
      ? "font-['EB_Garamond'] italic text-sm text-black/50 hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 hover:text-[#6B3C9C]"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-medium uppercase tracking-widest text-black/50 underline underline-offset-4 decoration-black/20 hover:text-[#6B3C9C]"
      : "font-['Manrope'] text-xs font-bold lowercase text-black/40 hover:text-[#6B3C9C] transition-colors",
      
    navLink: isOpt4
      ? "font-['EB_Garamond'] text-sm tracking-[0.1em] text-black/55 uppercase hover:text-[#6B3C9C]"
      : isOpt3
      ? "font-['Montserrat'] text-xs font-black uppercase tracking-[0.1em] text-black hover:text-[#6B3C9C] transition-colors"
      : isOpt1
      ? "font-['Montserrat'] text-xs font-bold uppercase tracking-[0.15em] text-black/60 hover:text-black transition-colors"
      : "font-['Manrope'] text-[13px] font-bold lowercase tracking-wide text-black/50 hover:text-black transition-colors",
      
    badge: isOpt4
      ? "font-['EB_Garamond'] text-xs tracking-[0.15em] text-[#6B3C9C] border border-[#6B3C9C]/50 rounded-none px-3 py-1 uppercase"
      : isOpt3
      ? "font-['Montserrat'] text-[10px] font-black uppercase tracking-[0.15em] text-white bg-black px-3 py-1 rounded-none"
      : isOpt1
      ? "font-['Montserrat'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B3C9C] border border-[#6B3C9C]/40 rounded-full px-3 py-1"
      : "px-3 py-1 bg-black/5 text-black font-['Manrope'] text-[10px] font-bold uppercase tracking-[0.15em] rounded-full",
      
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

    cardRadius: (isOpt1 || isOpt3 || isOpt4) ? "rounded-none" : "rounded-2xl",
    borderBase: isOpt4 ? "border-[#6B3C9C]/30" : isOpt3 ? "border-black/20" : isOpt1 ? "border-black/20" : "border-black/10",
    
    // THE PREMIUM ACCENT: Using Semestha everywhere as the cohesive brand thread
    premiumTag: "font-['Semestha'] text-[#6B3C9C] text-[1.2em] tracking-wide",

    accentColor: '#6B3C9C',
    accentLight: '#9B7CB6',
    accentDeep: '#3D1E4A',
    accentText: 'text-[#6B3C9C]',
    accentBg: 'bg-[#6B3C9C]',
    accentBorder: 'border-[#6B3C9C]',
  };
};