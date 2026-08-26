import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_TAGS = ['Bridal Glam', '+ Mehendi', '+ Nails'] as const;
const ease = [0.22, 1, 0.36, 1] as const;

// Reliable Unsplash fallback — never 404s
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80';

export type ArtistTint = {
  hue: number;
  saturate: number;
  brightness: number;
};

export type ArtistCardProps = {
  name: string;
  image: string;
  hoverImage?: string;
  portfolioImages?: string[];
  hoverVideo?: string;
  startingPrice?: string;
  tags?: string[];
  tint?: ArtistTint;
  onClick?: () => void;
  testId?: string;
};

export function ArtistCard({
  name,
  image,
  hoverImage,
  portfolioImages = [],
  hoverVideo,
  startingPrice = 'Starts at ₹5,000',
  tags = [...DEFAULT_TAGS],
  tint,
  onClick,
  testId,
}: ArtistCardProps) {
  const [hovered, setHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const imagesList = portfolioImages.length > 0 
    ? portfolioImages 
    : hoverImage 
      ? [hoverImage] 
      : [];

  const hasPortfolio = imagesList.length > 0 || Boolean(hoverVideo);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hovered && imagesList.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % imagesList.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [hovered, imagesList.length]);

  const imageStyle = tint
    ? { filter: `hue-rotate(${tint.hue}deg) saturate(${tint.saturate}) brightness(${tint.brightness})` }
    : undefined;

  const handleEnter = () => {
    setHovered(true);
    void videoRef.current?.play();
  };

  const handleLeave = () => {
    setHovered(false);
    setCurrentIndex(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <article
      className="group bg-transparent"
      data-testid={testId}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full bg-transparent text-left outline-none cursor-pointer"
        aria-label={`View ${name}'s profile`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
          {/* Default Profile Headshot */}
          <motion.img
            src={image}
            alt={`${name}'s profile`}
            onError={(e) => {
              if (e.currentTarget.dataset.hasFailed) return;
              e.currentTarget.dataset.hasFailed = 'true';
              e.currentTarget.src = FALLBACK_IMG;
            }}
            className="absolute inset-0 h-full w-full object-cover"
            style={imageStyle}
            animate={{ opacity: hovered && hasPortfolio ? 0 : 1, scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.7, ease }}
          />

          {/* Cycling Portfolio Gallery on Hover */}
          {imagesList.length > 0 && (
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={imagesList[currentIndex]}
                  alt={`${name}'s portfolio work ${currentIndex + 1}`}
                  onError={(e) => {
                    if (e.currentTarget.dataset.hasFailed) return;
                    e.currentTarget.dataset.hasFailed = 'true';
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={imageStyle}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.03 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                />
              </AnimatePresence>

              {/* Editorial Progress Indicator Dots */}
              {imagesList.length > 1 && hovered && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {imagesList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fallback Hover Video */}
          {hoverVideo && imagesList.length === 0 && (
            <motion.video
              ref={videoRef}
              src={hoverVideo}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              style={imageStyle}
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.7, ease }}
            />
          )}
        </div>

        <div className="mt-5">
          <h3 className="serif text-[1.85rem] leading-none tracking-[-0.03em] text-neutral-900">
            {name}
          </h3>
          
          <p className="mt-2 font-sans text-[13px] font-medium tracking-[0.04em] text-neutral-500">
            {startingPrice}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-300 bg-transparent px-3 py-1 font-sans text-[10px] font-medium tracking-[0.14em] text-neutral-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
    </article>
  );
}

export default ArtistCard;