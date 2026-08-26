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

// 1. Gather ALL photos to create a giant pool for 100 unique headshots
const allAvailableImages: string[] = [];

for (let i = 1; i <= 25; i++) {
  const folderName = `artist_${String(i).padStart(3, '0')}`;
  
  // Add all available portfolio shots (0 through 4)
  for (let p = 0; p <= 4; p++) {
    allAvailableImages.push(`/canvas-artists/${folderName}/portfolio-${p}.jpg`);
  }
}

// 2. Add photos from the brand folders (Removed the deleted prachi_profile.jpg)
allAvailableImages.push(
  `/canvas-artists/Kaushal Makeover/1.jpg`,
  `/canvas-artists/Kaushal Makeover/2.jpg`,
  `/canvas-artists/Kaushal Makeover/3.jpg`,
  `/canvas-artists/Kaushal Makeover/4.jpg`,
  `/canvas-artists/Erica/2.jpg`,
  `/canvas-artists/Erica/3.jpg`,
  `/canvas-artists/Erica/4.jpg`,
  `/canvas-artists/Geetanjali/1.jpg`,
  `/canvas-artists/Tusya/1.jpg`,
  `/canvas-artists/Womania/1.jpg`
);

// 3. Fisher-Yates Array Shuffler
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 4. Shuffle the entire pool to mix headshots randomly
const uniqueHeadshots = shuffleArray(allAvailableImages);

// Realistic Hyderabad names and elite specialties
const FIRST_NAMES = ['Aarti', 'Ananya', 'Divya', 'Pooja', 'Riya', 'Shreya', 'Sneha', 'Tanvi', 'Meera', 'Kavya', 'Simran', 'Neha', 'Priya', 'Nikita', 'Isha', 'Swati', 'Deepika', 'Shweta', 'Nisha', 'Monika'];
const CITIES = ['Jubilee Hills', 'Banjara Hills', 'HITEC City', 'Madhapur', 'Gachibowli', 'Kondapur', 'Film Nagar', 'Secunderabad', 'Begumpet', 'Kukatpally'];
const SPECIALTIES = ['Nizami Bridal Specialist', 'Editorial & Glass Skin', 'HD Airbrush Master', 'Traditional South Indian', 'Contemporary Glamour'];

// 5. Generate the 100 distinct artists
export const artistsData: Artist[] = Array.from({ length: 100 }).map((_, index) => {
  
  // Artist #1: Dedicated to Prachi Kaushal
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
      image: `/canvas-artists/Kaushal Makeover/1.jpg`,
      hoverImage: `/canvas-artists/Kaushal Makeover/2.jpg`,
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

  // 1. Assign a completely unique headshot from our shuffled master pool
  const profileImage = uniqueHeadshots[index % uniqueHeadshots.length];

  // 2. Assign this artist to ONE specific local folder (1 through 25)
  const folderId = (index % 25) + 1;
  const folderName = `artist_${String(folderId).padStart(3, '0')}`;

  // 3. STRICT PORTFOLIO: Only pull portfolio images from THEIR specific folder!
  const portfolioImages = [
    `/canvas-artists/${folderName}/portfolio-0.jpg`,
    `/canvas-artists/${folderName}/portfolio-1.jpg`,
    `/canvas-artists/${folderName}/portfolio-2.jpg`,
    `/canvas-artists/${folderName}/portfolio-3.jpg`,
    `/canvas-artists/${folderName}/portfolio-4.jpg`
  ];

  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${['Goud', 'Reddy', 'Rao', 'Verma', 'Nair', 'Iyer', 'Kapoor'][index % 7]}`;
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
    hoverImage: portfolioImages[1], 
    tags: [specialty, city],
    bio: `Master makeup artist specializing in ${specialty.toLowerCase()}. Over ${3 + (index % 5)} years of elite studio experience across Hyderabad.`,
    signature: specialty,
    portfolio: portfolioImages, // This guarantees the modal only shows their specific photos!
    addons: ['Draping & Saree Setting (₹2,000)', 'HD Airbrush Upgrade (₹3,500)', 'Trial Session (₹1,500)'],
    isVerified: true
  };
});