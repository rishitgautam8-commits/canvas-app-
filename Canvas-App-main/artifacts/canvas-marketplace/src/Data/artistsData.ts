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

const ARTIST_FOLDERS = [
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
      image: '/canvas-artists/Kaushal Makeover/1.jpg',
      hoverImage: '/canvas-artists/Kaushal Makeover/2.jpg',
      tags: ['Kaushal Makeover', 'Signature Bridal', 'Jubilee Hills'],
      bio: 'Master makeup artist operating under Kaushal Makeover. Renowned for flawless South Indian bridal styling, HD airbrush, and bespoke editorial looks in Hyderabad.',
      signature: 'Kaushal Signature Aesthetic',
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
  // EVERY OTHER ARTIST: coherent images from ONE folder
  // ==========================================================

  // 1. Assign a folder (cycle through the 30 you have)
  const folderIndex = index % ARTIST_FOLDERS.length;
  const folder = ARTIST_FOLDERS[folderIndex];

  // 2. Build every image path inside that folder
  const folderImages = folder.files.map(
    (f) => `/canvas-artists/${folder.folder}/${f}`
  );

  // 3. Pick a unique image for THIS artist from that folder.
  //    Artists who share a folder get different photos.
  const imgIndex = Math.floor(index / ARTIST_FOLDERS.length) % folderImages.length;
  const image = folderImages[imgIndex];
  const hoverImage = folderImages[(imgIndex + 1) % folderImages.length];

  // 4. Portfolio = all images from the same folder
  const portfolio = [...folderImages];

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
    image,
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