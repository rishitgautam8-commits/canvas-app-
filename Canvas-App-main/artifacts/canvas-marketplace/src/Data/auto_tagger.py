import os
import google.generativeai as genai
from PIL import Image

# 1. Grab a free API key from Google AI Studio (aistudio.google.com) and paste it here
# 1. Grab API key from the environment to keep it out of GitHub
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "INSERT_KEY_LOCALLY_BUT_DONT_COMMIT"))

# 2. Point this to your local artists folder
BASE_DIR = r"C:\Users\rishi\Downloads\Canvas-App-main\artifacts\canvas-marketplace\public\canvas-artists"

# 3. Define the skills we want the AI to choose from
CATEGORIES = [
    "saree-draping",
    "hairstyle",
    "nail-art",
    "brow-tinting",
    "ice-globe-facial",
    "lash-extensions",
    "bridal-styling"
]

prompt = f"""
You are an expert beauty and makeup evaluator. 
Look at this image and categorize the beauty service being performed or showcased.
You MUST choose exactly ONE of these slugs: {', '.join(CATEGORIES)}.
Respond with ONLY the exact slug text, nothing else.
"""

# Load the Vision model
model = genai.GenerativeModel('gemini-1.5-flash')

print("🤖 Starting Canvas AI Auto-Tagger...")

for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        # Only process files that start with "addon-"
        if file.startswith("addon-") and file.lower().endswith((".jpg", ".jpeg", ".png")):
            
            name_parts = file.split('.')[0].split('-')
            
            # Skip images that are already tagged (e.g., addon-saree-draping-1.jpg)
            # If it's just "addon-1.jpg", the length is 2 and name_parts[1] is a digit
            if len(name_parts) > 2 and not name_parts[1].isdigit():
                continue 

            file_path = os.path.join(root, file)
            print(f"Scanning: {file} ... ", end="", flush=True)

            try:
                # Open the image and send it to the AI
                img = Image.open(file_path)
                response = model.generate_content([prompt, img])
                slug = response.text.strip().lower()

                # Safety check: if the AI hallucinates, default to bridal-styling
                if slug not in CATEGORIES:
                    slug = "bridal-styling"

                # Keep the original number (e.g., the "1" in addon-1.jpg)
                file_num = name_parts[-1] if name_parts[-1].isdigit() else "1"
                file_ext = os.path.splitext(file)[1]
                
                # Construct the new smart filename
                new_filename = f"addon-{slug}-{file_num}{file_ext}"
                new_filepath = os.path.join(root, new_filename)

                img.close() # Close the file so Windows lets us rename it
                
                # Rename the file on your hard drive!
                os.rename(file_path, new_filepath)
                print(f"✅ Renamed to {new_filename}")

            except Exception as e:
                print(f"❌ Error: {e}")

print("🎉 All Add-ons successfully tagged by AI!")