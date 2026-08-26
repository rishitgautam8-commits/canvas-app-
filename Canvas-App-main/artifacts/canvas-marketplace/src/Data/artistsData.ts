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
// YOUR ACTUAL FOLDER STRUCTURE (from screenshots)
// ============================================================
// 25 numbered folders + 5 named brand folders = 30 folders
// Each folder has 5-7 unique photos = ~180 total unique images
// This is MORE than enough for 100 unique profile photos.

const ARTIST_FOLDERS = [
  // --- 25 generic artist folders (artist_001 … artist_025) ---
  ...Array.from({ length: 25 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      folder: `artist_${num}`,
      files: [
        'portfolio-1.jpg',
        'portfolio-2.jpg',
        'portfolio-3.jpg',
        'portfolio-4.jpg',
        'portfolio-5.jpg',
        'addon-1.jpg',
        'addon-2.jpg',
      ],
    };
  }),

  // --- 5 named brand folders (from your screenshots) ---
  {
    folder: 'Geetanjali',
    files: ['geetanjali_profile.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
  },
  {
    folder: 'Kaushal Makeover',
    files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg'],
  },
  {
    folder: 'Erica',
    files: ['2.jpg', '3.jpg', '4.jpg'],
  },
  {
    folder: 'Tusya',
    files: ['1.jpg'],
  },
  {
    folder: 'Womania',
    files: ['1.jpg'],
  },
];

// Build a flat pool of EVERY unique photo path you have.
// ~180 images total. We only need 100 for profiles, so no wrapping = zero duplicates.
const UNIQUE_PHOTO_POOL: string[] = [];
ARTIST_FOLDERS.forEach(({ folder, files }) => {
  files.forEach((file) => {
    UNIQUE_PHOTO_POOL.push(`/canvas-artists/${folder}/${file}`);
  });
});

// --- Data generators ---
const FIRST_NAMES = [
  'Aarti', 'Ananya', 'Divya', 'Pooja', 'Riya', 'Shreya', 'Sneha', 'Tanvi',
  'Meera', 'Kavya', 'Simran', 'Neha', 'Priya', 'Nikita', 'Isha', 'Swati',
  'Deepika', 'Shweta', 'Nisha', 'Monika', 'Aaradhya', 'Ishita', 'Sanya', 'Tara', 'Mira',
];
const CITIES = [
  'Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Madhapur', 'Gachibowli',
  'Kondapur', 'Film Nagar', 'Secunderabad', 'Begumpet', 'Kukatpally',
];
const SPECIALTIES = [
  'Nizami Bridal Specialist',
  'Editorial & Glass Skin',
  'HD Airbrush Master',
  'Traditional South Indian',
  'Contemporary Glamour',
];

export const artistsData: Artist[] = Array.from({ length: 100 }).map((_, index) => {
  // ==========================================================
  // ARTIST #0 = PRACHI KAUSHAL (special case)
  // ==========================================================
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
      // Unique profile photo from Kaushal Makeover folder
      image: '/canvas-artists/Kaushal Makeover/1.jpg',
      hoverImage: '/canvas-artists/Kaushal Makeover/2.jpg',
      tags: ['Kaushal Makeover', 'Signature Bridal', 'Jubilee Hills'],
      bio: 'Master makeup artist operating under Kaushal Makeover. Renowned for flawless South Indian bridal styling, HD airbrush, and bespoke editorial looks in Hyderabad.',
      signature: 'Kaushal Signature Aesthetic',
      // 4 genuinely different portfolio images
      portfolio: [
        '/canvas-artists/Kaushal Makeover/1.jpg',
        '/canvas-artists/Kaushal Makeover/2.jpg',
        '/canvas-artists/Kaushal Makeover/3.jpg',
        '/canvas-artists/Kaushal Makeover/4.jpg',
      ],
      addons: [
        'Bridal Trial Session (₹2,500)',
        'HD Airbrushing (₹4,000)',
        'Saree Draping & Styling (₹1,500)',
      ],
      isVerified: true,
    };
  }

  // ==========================================================
  // EVERY OTHER ARTIST: 100% unique profile photo
  // ==========================================================

  // Pick a UNIQUE profile photo from the giant pool.
  // Since the pool has ~180 images and we only need 100, index 0-99 never repeats.
  const profileImage = UNIQUE_PHOTO_POOL[index];
  const hoverImage = UNIQUE_PHOTO_POOL[index + 1] || UNIQUE_PHOTO_POOL[0];

  // Assign a "home folder" for portfolio images.
  // Portfolio images CAN repeat across artists — you said this is fine.
  const homeFolder = ARTIST_FOLDERS[index % ARTIST_FOLDERS.length];

  // Build portfolio from the home folder:
  // - For numbered folders: use portfolio-1.jpg … portfolio-5.jpg
  // - For named folders: use all files except the _profile one
  const portfolioFiles = homeFolder.folder.startsWith('artist_')
    ? ['portfolio-1.jpg', 'portfolio-2.jpg', 'portfolio-3.jpg', 'portfolio-4.jpg', 'portfolio-5.jpg']
    : homeFolder.files.filter((f) => !f.includes('profile'));

  const portfolio = portfolioFiles.map(
    (f) => `/canvas-artists/${homeFolder.folder}/${f}`
  );

  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${
    ['Goud', 'Reddy', 'Rao', 'Verma', 'Nair', 'Iyer', 'Kapoor'][index % 7]
  }`;
  const city = CITIES[index % CITIES.length];
  const specialty = SPECIALTIES[index % SPECIALTIES.length];
  const price = 10000 + (index % 6) * 5000;

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
    hoverImage,
    tags: [specialty, city],
    bio: `Master makeup artist specializing in ${specialty.toLowerCase()}. Over ${
      3 + (index % 5)
    } years of elite studio experience across Hyderabad.`,
    signature: specialty,
    portfolio,
    addons: [
      'Draping & Saree Setting (₹2,000)',
      'HD Airbrush Upgrade (₹3,500)',
      'Trial Session (₹1,500)',
    ],
    isVerified: true,
  };
});