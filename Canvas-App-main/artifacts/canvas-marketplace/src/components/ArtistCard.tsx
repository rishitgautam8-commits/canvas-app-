import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULT_TAGS = ['Bridal Glam', '+ Mehendi', '+ Nails'] as const;
const ease = [0.22, 1, 0.36, 1] as const;

export type ArtistTint = {
  hue: number;
  saturate: number;
  brightness: number;
};

export type ArtistCardProps = {
  name: string;
  image: string;
  hoverImage?: string;
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
  hoverVideo,
  startingPrice = 'Starts at ₹5,000',
  tags = [...DEFAULT_TAGS],
  tint,
  onClick,
  testId,
}: ArtistCardProps) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reveal = Boolean(hoverImage || hoverVideo);

  // Small per-artist color grade. Keeps two artists who happen to share a
  // stock photo from reading as literal duplicates in the grid.
  const imageStyle = tint
    ? { filter: `hue-rotate(${tint.hue}deg) saturate(${tint.saturate}) brightness(${tint.brightness})` }
    : undefined;

  const handleEnter = () => {
    setHovered(true);
    void videoRef.current?.play();
  };

  const handleLeave = () => {
    setHovered(false);
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
        className="w-full bg-transparent text-left outline-none"
        aria-label={`View ${name}'s profile`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <motion.img
            src={image}
            alt={`${name}'s makeup work`}
            className="absolute inset-0 h-full w-full object-cover"
            style={imageStyle}
            animate={{ opacity: hovered && reveal ? 0 : 1, scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.7, ease }}
          />
          {hoverImage && (
            <motion.img
              src={hoverImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              style={imageStyle}
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.7, ease }}
            />
          )}
          {hoverVideo && (
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
          <h3 className="serif text-[1.85rem] leading-none tracking-[-0.03em] text-white">
            {name}
          </h3>
          <p className="mt-2 font-sans text-[13px] font-medium tracking-[0.04em] text-white/55">
            {startingPrice}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-transparent px-3 py-1 font-sans text-[10px] font-medium tracking-[0.14em] text-white/65"
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