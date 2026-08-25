// 1. The 5 Verified Prototype Artists
const baseArtists = [
  {
    id: "artist_001",
    name: "Prachi Kaushal",
    business_name: "Kaushal Makeovers",
    category: "Bridal & Wedding",
    specialty: "Nizami Royal Bridal",
    city: "Jubilee Hills",
    price: 35000,
    rating: 4.9,
    reviewsCount: 214,
    profileImage: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828257/1.._kwsi9l.jpg",
    portfolio: [
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828257/1.._kwsi9l.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828257/2.._ceapkd.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828257/3.._gxa2pq.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828257/4.._mgdq9r.jpg" }
    ],
    bio: "Prachi Kaushal is Hyderabad's most sought-after premium bridal makeup artist. Specialising in HD Airbrush technique and traditional Nizami and Telugu bridal aesthetics."
  },
  {
    id: "artist_002",
    name: "Tusya",
    business_name: "Facestory by Tusya",
    category: "Editorial & High Fashion",
    specialty: "Tollywood Celebrity Glam",
    city: "Banjara Hills",
    price: 22000,
    rating: 4.8,
    reviewsCount: 178,
    profileImage: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828335/1...._rygsvs.jpg",
    portfolio: [
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828335/1...._rygsvs.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828336/2...._hynjaq.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828337/3...._twmgdh.jpg" }
    ],
    bio: "Tusya brings a cinematic, editorial eye to every face she works on. Based in Banjara Hills, she has created looks for Tollywood celebrities and high-profile Hyderabad weddings."
  },
  {
    id: "artist_003",
    name: "Geetanjali",
    business_name: "Geetanjali Artistry",
    category: "Natural & Soft Aesthetics",
    specialty: "Telugu Traditional",
    city: "HITEC City",
    price: 25000,
    rating: 4.9,
    reviewsCount: 263,
    profileImage: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828174/1._yh2ham.jpg",
    portfolio: [
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828174/1._yh2ham.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828174/2._rim06v.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781828174/5_gwti6w.jpg" }
    ],
    bio: "Hyderabad-based Geetanjali is celebrated for breathtakingly delicate work - from traditional Telugu bridal to understated contemporary wedding aesthetics."
  },
  {
    id: "artist_004",
    name: "Erica",
    business_name: "Erica Makeovers",
    category: "Party & Event Glam",
    specialty: "Christian Minimalist Bridal",
    city: "Gachibowli",
    price: 15000,
    rating: 4.7,
    reviewsCount: 142,
    profileImage: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781827847/2_rcwcwv.jpg",
    portfolio: [
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781827847/2_rcwcwv.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781827847/3_zgabam.jpg" },
      { image: "https://res.cloudinary.com/dzrmqoibo/image/upload/v1781827847/1_l3bkgn.jpg" }
    ],
    bio: "Erica is Cyberabad's go-to artist for brides who want to look like the best version of themselves - natural, luminous, and effortlessly polished."
  },
  {
    id: "artist_005",
    name: "Womaniya Salon",
    business_name: "Womaniya Makeup & Salon",
    category: "Bridal & Wedding",
    specialty: "South Indian Bridal",
    city: "Madhapur",
    price: 12000,
    rating: 4.8,
    reviewsCount: 312,
    profileImage: "https://i.imgur.com/iItUDgY.jpeg",
    portfolio: [
      { image: "https://i.imgur.com/iItUDgY.jpeg" },
      { image: "https://i.imgur.com/fXWgXkk.jpeg" },
      { image: "https://i.imgur.com/tJI9NAm.jpeg" }
    ],
    bio: "Womaniya Makeup & Salon is Madhapur's premier destination for authentic South Indian bridal artistry."
  }
];

// 2. Authentic Hyderabad Neighborhoods & Names
const hyderabadCities = ["Jubilee Hills", "Banjara Hills", "HITEC City", "Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "Secunderabad", "Begumpet", "Film Nagar"];
const femaleNames = ["Anjali", "Sneha", "Kavya", "Priya", "Riya", "Neha", "Aarti", "Pooja", "Divya", "Shruti", "Swati", "Nandini", "Meghana", "Sanjana", "Tanvi"];
const brandSuffixes = ["Makeovers", "Artistry", "Glamour", "Beauty", "Studio", "Bridal", "Glow"];

// 3. Generate the full 100 array
export const artistsData = [...baseArtists];

for (let i = 6; i <= 100; i++) {
  // Rotate through the 5 safe prototype image sets so we never get a foreign/male image
  const imageTemplate = baseArtists[i % 5];
  const randomName = femaleNames[i % femaleNames.length];
  const randomCity = hyderabadCities[i % hyderabadCities.length];
  
  artistsData.push({
    id: `artist_mock_${i}`,
    name: randomName,
    business_name: `${randomName} ${brandSuffixes[i % brandSuffixes.length]}`,
    category: imageTemplate.category,
    specialty: imageTemplate.specialty,
    city: randomCity,
    price: 10000 + (Math.floor(Math.random() * 40) * 1000), // Random price between 10k - 50k
    rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
    reviewsCount: Math.floor(Math.random() * 250) + 20,
    profileImage: imageTemplate.profileImage, // Guaranteed safe image
    portfolio: imageTemplate.portfolio,       // Guaranteed safe portfolio
    bio: `Specialising in premium bridal and event makeup in ${randomCity}. Bringing a signature aesthetic and flawless execution to every client.`
  });
}