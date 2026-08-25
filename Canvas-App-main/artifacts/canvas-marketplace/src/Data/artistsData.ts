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

// 1. Gather all profile pictures and portfolio images from your 25 numerical artist folders
const numericalProfiles: string[] = [];
const numericalPortfolioPool: string[] = [];

for (let i = 1; i <= 25; i++) {
  const folderName = `artist_${String(i).padStart(3, '0')}`;
  
  // Profile picture path
  numericalProfiles.push(`/canvas-artists/${folderName}/profile.jpg`);
  
  // Portfolio pool path (portfolio-0 through portfolio-4)
  for (let p = 0; p <= 4; p++) {
    numericalPortfolioPool.push(`/canvas-artists/${folderName}/portfolio-${p}.jpg`);
  }
}

// 2. Real Brand Folders Data
const brandFolders = ['Kaushal Makeover', 'Erica', 'Geetanjali', 'Tusya', 'Womania'];

// Fisher-Yates Array Shuffler
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle the profiles so they are randomized across the 100 artists with zero duplication
const randomizedProfiles = shuffleArray(numericalProfiles);

// Realistic Hyderabad names and elite specialties
const FIRST_NAMES = ['Aarti', 'Ananya', 'Divya', 'Pooja', 'Riya', 'Shreya', 'Sneha', 'Tanvi', 'Meera', 'Kavya', 'Simran', 'Neha', 'Priya', 'Nikita', 'Isha', 'Swati', 'Deepika', 'Shweta', 'Nisha', 'Monika'];
const CITIES = ['Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Madhapur', 'Gachibowli', 'Kondapur', 'Film Nagar', 'Secunderabad', 'Begumpet', 'Kukatpally'];
const SPECIALTIES = ['Nizami Bridal Specialist', 'Editorial & Glass Skin', 'HD Airbrush Master', 'Traditional South Indian', 'Contemporary Glamour'];

// 3. Generate the 100 distinct artists
export const artistsData: Artist[] = Array.from({ length: 100 }).map((_, index) => {
  
  // Artist #1: Kaushal Makeover (Prachi Kaushal)
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
      image: `/canvas-artists/Kaushal Makeover/prachi_profile.jpg`,
      hoverImage: `/canvas-artists/Kaushal Makeover/1.jpg`,
      tags: ['Kaushal Makeover', 'Signature Bridal', 'Jubilee Hills'],
      bio: 'Master makeup artist operating under Kaushal Makeover. Renowned for flawless South Indian bridal styling, HD airbrush, and bespoke editorial looks in Hyderabad.',
      signature: 'Kaushal Signature Aesthetic',
      portfolio: [
        `/canvas-artists/Kaushal Makeover/1.jpg`,
        `/canvas-artists/Kaushal Makeover/2.jpg`,
        `/canvas-artists/Kaushal Makeover/3.jpg`,
        `/canvas-artists/Kaushal Makeover/4.jpg`
      ],
      addons: ['Bridal Trial Session (₹2,500)', 'HD Airbrushing (₹4,000)', 'Saree Draping & Styling (₹1,500)'],
      isVerified: true
    };
  }

  // Standard generation for the remaining 99 artists
  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${['Goud', 'Reddy', 'Rao', 'Verma', 'Nair', 'Iyer', 'Kapoor'][index % 7]}`;
  
  // Cycle through the randomized profile pictures so all 100 have unique thumbnails
  const profileImage = randomizedProfiles[index % randomizedProfiles.length];

  // Pick 3 to 4 random portfolio photos from the numerical portfolio pool
  const portfolioCount = Math.random() > 0.5 ? 4 : 3;
  const portfolioImages = shuffleArray(numericalPortfolioPool).slice(0, portfolioCount);

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
    hoverImage: portfolioImages[0],
    tags: [specialty, city],
    bio: `Master makeup artist specializing in ${specialty.toLowerCase()}. Over ${3 + (index % 5)} years of elite studio experience across Hyderabad.`,
    signature: specialty,
    portfolio: portfolioImages,
    addons: ['Draping & Saree Setting (₹2,000)', 'HD Airbrush Upgrade (₹3,500)', 'Trial Session (₹1,500)'],
    isVerified: true
  };
});