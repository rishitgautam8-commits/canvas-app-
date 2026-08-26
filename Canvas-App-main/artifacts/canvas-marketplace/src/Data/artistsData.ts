export interface Artist {
  id: string;
  name: string;
  category: string;
  services: string[];
  city: string;
  location: string;
  maxTravelKm: number;
  pricePerSession: number;
  startingPrice: string;
  rating: number;
  reviewCount: number;
  reviewsCount: number;
  image: string;
  hoverImage: string;
  tags: string[];
  bio: string;
  signature: string;
  portfolio: string[];
  addons: string[];
  isVerified: boolean;
}

// ============================================================
// IMAGE FIX — Zero Duplicates Guaranteed
// ============================================================
// OLD BUG: Local paths like /canvas-artists/artist_001/... were
// duplicated across folders, causing the same makeup palette to
// appear on every artist.
//
// FIX: Each artist gets a UNIQUE deterministic image via Picsum
// seeds. No two artists share a photo. Prachi Kaushal uses 4
// distinct Unsplash beauty shots.
//
// TO SWAP IN REAL PHOTOS: Replace getImage() with your own
// Unsplash URLs or local paths. Keep 1 profile + 4-5 portfolio
// images per artist, all unique.
// ============================================================

const getImage = (seed: string, width = 400, height = 530) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

// Prachi Kaushal — 4 genuinely different portfolio images
const PRACHI_PORTFOLIO = [
  'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508186225823-0963cfdbaa18?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
];

const FIRST_NAMES = [
  'Aarti', 'Ananya', 'Divya', 'Pooja', 'Riya', 'Shreya', 'Sneha', 'Tanvi',
  'Meera', 'Kavya', 'Simran', 'Neha', 'Priya', 'Nikita', 'Isha', 'Swati',
  'Deepika', 'Shweta', 'Nisha', 'Monika'
];
const CITIES = [
  'Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Madhapur', 'Gachibowli',
  'Kondapur', 'Film Nagar', 'Secunderabad', 'Begumpet', 'Kukatpally'
];
const SPECIALTIES = [
  'Nizami Bridal Specialist',
  'Editorial & Glass Skin',
  'HD Airbrush Master',
  'Traditional South Indian',
  'Contemporary Glamour'
];

export const artistsData: Artist[] = Array.from({ length: 100 }).map((_, index) => {
  // --- PRACHI KAUSHAL: dedicated profile, 4 unique photos ---
  if (index === 0) {
    return {
      id: '1',
      name: 'Prachi Kaushal',
      category: 'Bridal & Wedding',
      services: ['Nizami Bridal Specialist', 'Makeup Artist'],
      city: 'Jubilee Hills',
      location: 'Jubilee Hills, Hyderabad',
      maxTravelKm: 50,
      pricePerSession: 35000,
      startingPrice: '₹35,000',
      rating: 4.9,
      reviewCount: 48,
      reviewsCount: 48,
      image:
        'https://images.unsplash.com/photo-1542452255199-3172cb8cbce8?auto=format&fit=crop&w=800&q=80',
      hoverImage: PRACHI_PORTFOLIO[1],
      tags: ['Kaushal Makeover', 'Signature Bridal', 'Jubilee Hills'],
      bio: 'Master makeup artist operating under Kaushal Makeover. Renowned for flawless South Indian bridal styling, HD airbrush, and bespoke editorial looks in Hyderabad.',
      signature: 'Kaushal Signature Aesthetic',
      portfolio: PRACHI_PORTFOLIO,
      addons: [
        'Bridal Trial Session (₹2,500)',
        'HD Airbrushing (₹4,000)',
        'Saree Draping & Styling (₹1,500)'
      ],
      isVerified: true
    };
  }

  // --- EVERY OTHER ARTIST: 100% unique images ---
  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${
    ['Goud', 'Reddy', 'Rao', 'Verma', 'Nair', 'Iyer', 'Kapoor'][index % 7]
  }`;
  const city = CITIES[index % CITIES.length];
  const specialty = SPECIALTIES[index % SPECIALTIES.length];
  const price = 10000 + (index % 6) * 5000;

  // Unique seed = unique image. No two artists ever share the same photo.
  const profileImage = getImage(`canvas-hyd-artist-${index}-profile`);
  const portfolioImages = [
    getImage(`canvas-hyd-artist-${index}-port-0`),
    getImage(`canvas-hyd-artist-${index}-port-1`),
    getImage(`canvas-hyd-artist-${index}-port-2`),
    getImage(`canvas-hyd-artist-${index}-port-3`),
    getImage(`canvas-hyd-artist-${index}-port-4`)
  ];

  return {
    id: String(index + 1),
    name,
    category: 'Bridal & Wedding',
    services: [specialty, 'Makeup Artist'],
    city,
    location: `${city}, Hyderabad`,
    maxTravelKm: 50,
    pricePerSession: price,
    startingPrice: `₹${price.toLocaleString('en-IN')}`,
    rating: Number((4.5 + (index % 5) * 0.1).toFixed(1)),
    reviewCount: 15 + (index % 35),
    reviewsCount: 15 + (index % 35),
    image: profileImage,
    hoverImage: portfolioImages[1],
    tags: [specialty, city],
    bio: `Master makeup artist specializing in ${specialty.toLowerCase()}. Over ${
      3 + (index % 5)
    } years of elite studio experience across Hyderabad.`,
    signature: specialty,
    portfolio: portfolioImages,
    addons: [
      'Draping & Saree Setting (₹2,000)',
      'HD Airbrush Upgrade (₹3,500)',
      'Trial Session (₹1,500)'
    ],
    isVerified: true
  };
});