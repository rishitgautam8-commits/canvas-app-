import os

# Automatically find the public/canvas-artists folder relative to this script!
current_dir = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(current_dir, "..", "..", "public", "canvas-artists"))

print("\n--- COPY AND PASTE THIS INTO artistsData.ts ---\n")
print("const FOLDERS = [")

# Loop through all artist folders and grab the exact new file names
for artist_folder in sorted(os.listdir(BASE_DIR)):
    folder_path = os.path.join(BASE_DIR, artist_folder)
    
    if os.path.isdir(folder_path):
        # Grab all images in this folder
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        # Format it exactly as TypeScript expects
        files_str = "', '".join(files)
        print(f"  {{ name: '{artist_folder}', files: ['{files_str}'] }},")

print("];\n")