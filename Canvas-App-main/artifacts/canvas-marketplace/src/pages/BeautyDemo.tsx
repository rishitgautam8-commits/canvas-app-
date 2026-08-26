import { Search, ShoppingBag, Menu } from 'lucide-react';

export default function BeautyDemo() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-rose-200">
      
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-[#f9eaea] text-center py-2.5 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase text-neutral-800">
        Free shipping on all orders over $100
      </div>

      {/* HEADER */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-neutral-100 sticky top-0 bg-white z-50">
        <div className="md:hidden">
          <Menu size={24} className="text-neutral-800" />
        </div>
        
        <div className="text-center md:text-left flex-1 md:flex-none">
          <h1 className="font-serif text-2xl tracking-widest uppercase font-bold text-neutral-900">
            Beauty<br/><span className="text-[10px] tracking-[0.3em] font-sans font-normal">And Co.</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13px] uppercase tracking-widest font-medium text-neutral-600">
          <a href="#" className="text-neutral-900 border-b border-neutral-900 pb-1">Home</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Catalog</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-5">
          <Search size={20} className="text-neutral-800 cursor-pointer hover:text-rose-400 transition-colors" />
          <ShoppingBag size={20} className="text-neutral-800 cursor-pointer hover:text-rose-400 transition-colors" />
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="flex flex-col md:flex-row items-center bg-[#fdf8f8] min-h-[500px]">
        <div className="w-full md:w-1/2 h-[300px] md:h-[600px]">
          <img 
            src="https://images.unsplash.com/photo-1615397323861-12501a4e101f?auto=format&fit=crop&w=1000&q=80" 
            alt="Skincare Model" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 p-10 md:p-20 text-center md:text-left flex flex-col justify-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-neutral-900 mb-6 leading-tight">
            New Cleansers, <br/>Toners & Lip Oils
          </h2>
          <p className="text-neutral-600 text-sm md:text-base mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
            Shop our new line of cleansers, toners, lip products and more! Formulated for sensitive skin and combination skin.
          </p>
          <div>
            <button className="bg-neutral-900 text-white px-10 py-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-rose-300 transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <h3 className="font-serif text-3xl mb-12 text-center md:text-left">Collections</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { name: "Cleansers", img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80" },
            { name: "Toners", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=80" },
            { name: "Jade Rollers", img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80" },
            { name: "Makeup", img: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=400&q=80" },
            { name: "Moisturizers", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80" },
            { name: "Eye Cream", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80" },
          ].map((cat, i) => (
            <div key={i} className="group cursor-pointer text-center">
              <div className="aspect-square bg-[#fdf8f8] mb-4 overflow-hidden rounded-sm">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="text-xs uppercase tracking-widest font-medium text-neutral-800 flex items-center justify-center gap-1 group-hover:text-rose-400 transition-colors">
                {cat.name} <span className="text-[10px]">→</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}