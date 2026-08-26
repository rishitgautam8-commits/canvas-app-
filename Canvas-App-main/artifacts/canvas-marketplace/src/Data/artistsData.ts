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

/* ── 30 folders ── */
const FOLDERS = [
  { name: 'artist_001', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_002', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_003', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_004', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_005', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_006', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_007', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_008', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_009', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_010', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_011', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_012', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_013', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_014', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_015', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_016', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_017', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_018', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_019', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_020', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_021', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_022', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_023', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_024', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'artist_025', files: ['portfolio-1.jpg','portfolio-2.jpg','portfolio-3.jpg','portfolio-4.jpg','portfolio-5.jpg','addon-1.jpg','addon-2.jpg'] },
  { name: 'Geetanjali',      files: ['geetanjali_profile.jpg','1.jpg','2.jpg','3.jpg','4.jpg','5.jpg'] },
  { name: 'Kaushal Makeover',files: ['1.jpg','2.jpg','3.jpg','4.jpg'] },
  { name: 'Erica',           files: ['2.jpg','3.jpg','4.jpg'] },
  { name: 'Tusya',           files: ['1.jpg'] },
  { name: 'Womania',         files: ['1.jpg'] },
];

const FIRST_NAMES = [
  'Aarti','Ananya','Divya','Pooja','Riya','Shreya','Sneha','Tanvi',
  'Meera','Kavya','Simran','Neha','Priya','Nikita','Isha','Swati',
  'Deepika','Shweta','Nisha','Monika','Aaradhya','Ishita','Sanya','Tara','Mira',
];
const CITIES = [
  'Jubilee Hills','Banjara Hills','HITEC City','Madhapur','Gachibowli',
  'Kondapur','Film Nagar','Secunderabad','Begumpet','Kukatpally',
];
const SPECIALTIES = [
  'Nizami Bridal Specialist','Editorial & Glass Skin','HD Airbrush Master',
  'Traditional South Indian','Contemporary Glamour',
];

/* ── Realistic tag pools ── */
const TAG_POOL_PRIMARY = [
  'HD Airbrush','Bridal Specialist','Editorial Makeup','Soft Glam',
  'Traditional Bridal','Contemporary Glam','Glass Skin','Party Makeup',
  'Reception Look','Engagement Makeup','Sangeet Glam','Haldi Artist',
  'Pre-Wedding Shoot','Destination Wedding','Celebrity Makeup',
  'Red Carpet Ready','Fashion Editorial','Runway Makeup','Natural Glow',
  'Smokey Eyes','Dewy Finish','Matte Perfection','Waterproof Bridal',
  'Long-Lasting Wear','Organic & Vegan','Skin Prep Expert','Contour Queen',
  'Highlight Master','Brow Sculpting','Lash Specialist',
];
const TAG_POOL_SECONDARY = [
  'Saree Draping','Hair Styling','Mehendi','Nail Art','Dupatta Setting',
  'Jewellery Styling','Floral Accessories','Veil Setting','Tikka Placement',
  'Bindi Design','Maang Tikka','Nath Styling','Kamarbandh Drape',
];

function pickTags(index: number): string[] {
  const primary   = TAG_POOL_PRIMARY[index % TAG_POOL_PRIMARY.length];
  const secondary = TAG_POOL_SECONDARY[index % TAG_POOL_SECONDARY.length];
  const tertiary  = TAG_POOL_PRIMARY[(index * 7 + 13) % TAG_POOL_PRIMARY.length];
  // Avoid duplicates
  const set = new Set([primary, secondary]);
  if (tertiary !== primary && tertiary !== secondary) set.add(tertiary);
  return Array.from(set);
}

export const artistsData: Artist[] = Array.from({ length: 100 }).map((_, index) => {
  /* ── Prachi Kaushal (slot 0) ── */
  if (index === 0) {
    return {
      id: '1',
      name: 'Prachi Kaushal',
      category: 'Bridal & Wedding',
      services: ['Nizami Bridal Specialist','Makeup Artist'],
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
      tags: ['Kaushal Makeover','Signature Bridal','HD Airbrush'],
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

  /* ── Everyone else ── */
  const folder      = FOLDERS[index % FOLDERS.length];
  const images      = folder.files.map(f => `/canvas-artists/${folder.name}/${f}`);
  const timesUsed   = Math.floor(index / FOLDERS.length);
  const imgIndex    = timesUsed % images.length;

  const image       = images[imgIndex];
  const hoverImage  = images[(imgIndex + 1) % images.length];
  const portfolio   = [...images];

  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${
    ['Goud','Reddy','Rao','Verma','Nair','Iyer','Kapoor'][index % 7]
  }`;
  const city      = CITIES[index % CITIES.length];
  const specialty = SPECIALTIES[index % SPECIALTIES.length];
  const price     = 10000 + (index % 6) * 5000;

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
    tags: pickTags(index),
    bio: `Master makeup artist specializing in ${specialty.toLowerCase()}. Over ${3 + (index % 5)} years of elite studio experience across Hyderabad.`,
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