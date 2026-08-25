import os
import json
import random

# This seed ensures the randomized names stay exactly the same every time you run it
random.seed(42)

script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "artistsData.js")

print("Generating authentic names for all 100 artists...")

first_names = ["Aarohi", "Pooja", "Rhea", "Simran", "Meera", "Ananya", "Zara", "Tanya", "Neha", "Kriti", "Sana", "Zoya", "Aisha", "Maya", "Kiara", "Naina", "Tara", "Isha", "Riya", "Diya"]
last_names = ["Raman", "Rajan", "Gupta", "Kapoor", "Sharma", "Verma", "Singh", "Patel", "Shah", "Desai", "Mehta", "Bose", "Das", "Sen", "Nair", "Reddy", "Iyer", "Jain", "Bhatia", "Chopra"]

artists = []

for i in range(1, 101):
    artist_id = f"artist_{i:03d}"
    
    # We lock in Prachi Kaushal as the premier artist, and randomly generate the rest!
    if i == 1:
        artist_name = "Prachi Kaushal"
    else:
        artist_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
    # Assign accurate category details based on your ranges
    if 1 <= i <= 22:
        category = "Bridal & Wedding"
        specialty = "Traditional & Contemporary Bridal"
        base_price = 4500
    elif 23 <= i <= 44:
        category = "Party & Event Glam"
        specialty = "Cocktail & Evening Glam"
        base_price = 3000
    elif 45 <= i <= 62:
        category = "Natural & Soft Aesthetics"
        specialty = "Glass Skin & Minimal Daytime"
        base_price = 2500
    elif 63 <= i <= 80:
        category = "Editorial & High Fashion"
        specialty = "Runway & Avant-Garde"
        base_price = 5000
    else:
        category = "Specialized Skin & Grooming"
        specialty = "Male Grooming & Advanced Skin Prep"
        base_price = 3500

    artist_data = {
        "id": artist_id,
        "name": artist_name,
        "category": category,
        "specialty": specialty,
        "rating": round(4.7 + (i % 3) * 0.1, 1),
        "reviewsCount": 42 + (i * 3) % 95,
        "price": base_price + (i % 4) * 500,
        "profileImage": f"/images/canvas-artists/{artist_id}/profile.jpg",
        "portfolio": [
            f"/images/canvas-artists/{artist_id}/portfolio-1.jpg",
            f"/images/canvas-artists/{artist_id}/portfolio-2.jpg",
            f"/images/canvas-artists/{artist_id}/portfolio-3.jpg",
            f"/images/canvas-artists/{artist_id}/portfolio-4.jpg",
            f"/images/canvas-artists/{artist_id}/portfolio-5.jpg"
        ],
        "addons": [
            f"/images/canvas-artists/{artist_id}/addon-1.jpg",
            f"/images/canvas-artists/{artist_id}/addon-2.jpg"
        ]
    }
    artists.append(artist_data)

js_content = f"export const artistsData = {json.dumps(artists, indent=2)};\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print("🚀 artistsData.js regenerated with real names!")