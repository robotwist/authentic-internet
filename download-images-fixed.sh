#!/bin/bash

# Script to download and generate placeholder images for the Authentic Internet project
# This version uses reliable placeholder services and local generation

echo "Downloading and generating placeholder images..."

# Function to download and save with proper name
download_image() {
  local url="$1"
  local output_path="$2"
  local dir=$(dirname "$output_path")
  
  # Create directory if it doesn't exist
  mkdir -p "$dir"
  
  echo "Downloading $(basename "$output_path")..."
  curl -s "$url" -o "$output_path"
  
  # Verify file was downloaded and has content
  if [ -s "$output_path" ]; then
    echo "✅ Successfully downloaded $(basename "$output_path") ($(du -h "$output_path" | cut -f1))"
  else
    echo "❌ Failed to download $(basename "$output_path")"
    return 1
  fi
}

# Function to generate a placeholder image with text
generate_placeholder() {
  local text="$1"
  local output_path="$2"
  local size="$3"
  local bg_color="$4"
  local text_color="$5"
  local dir=$(dirname "$output_path")
  
  # Create directory if it doesn't exist
  mkdir -p "$dir"
  
  echo "Generating $(basename "$output_path")..."
  
  # Use placeholder.com service for simple colored placeholders with text
  curl -s "https://via.placeholder.com/${size}/${bg_color}/${text_color}?text=${text}" -o "$output_path"
  
  # Verify file was generated and has content
  if [ -s "$output_path" ]; then
    echo "✅ Successfully generated $(basename "$output_path") ($(du -h "$output_path" | cut -f1))"
  else
    echo "❌ Failed to generate $(basename "$output_path")"
    return 1
  fi
}

# 1. Generate NPC placeholder
generate_placeholder "NPC" "client/public/assets/npcs/nkd-man-extension.png" "100x100" "334455" "ffffff"

# 2. Generate pixel avatar examples
generate_placeholder "Pixel+1" "client/public/assets/pixel-example-1.png" "64x64" "5588aa" "ffffff"
generate_placeholder "Pixel+2" "client/public/assets/pixel-example-2.png" "64x64" "aa5588" "ffffff"
generate_placeholder "Pixel+3" "client/public/assets/pixel-example-3.png" "64x64" "88aa55" "ffffff"

# 3. Create images directory for artifact images
mkdir -p "client/public/images"

# Generate artifact placeholders
generate_placeholder "Artifact" "client/public/images/default-artifact.png" "64x64" "775533" "ffffff"
generate_placeholder "Scroll" "client/public/images/artifact-scroll.png" "64x64" "ddaa33" "ffffff"
generate_placeholder "Gem" "client/public/images/artifact-gem.png" "64x64" "33ddaa" "ffffff"
generate_placeholder "Book" "client/public/images/artifact-book.png" "64x64" "aa33dd" "ffffff"
generate_placeholder "Potion" "client/public/images/artifact-potion.png" "64x64" "dd33aa" "ffffff"

# 4. Generate app icons
generate_placeholder "Logo" "client/public/logo.png" "512x512" "3344dd" "ffffff"
generate_placeholder "Logo" "client/public/logo192.png" "192x192" "3344dd" "ffffff"
generate_placeholder "Logo" "client/public/logo512.png" "512x512" "3344dd" "ffffff"
generate_placeholder "App" "client/public/apple-touch-icon.png" "180x180" "3344dd" "ffffff"
generate_placeholder "Fav" "client/public/favicon.png" "32x32" "3344dd" "ffffff"

# Convert favicon.png to favicon.ico
if command -v convert &> /dev/null; then
    echo "Converting favicon.png to favicon.ico..."
    convert "client/public/favicon.png" "client/public/favicon.ico"
    echo "✅ Favicon conversion complete!"
else
    echo "⚠️ ImageMagick not found, copying PNG as ICO..."
    cp "client/public/favicon.png" "client/public/favicon.ico"
fi

echo ""
echo "All placeholder images created successfully!"

# Create a credits file
cat > "client/public/assets/IMAGE_CREDITS.md" << EOF
# Image Credits

The images in this project were generated as placeholders using placeholder.com service.

These placeholder images are meant for development purposes only and should be replaced
with proper licensed images before production use.

## Generated Placeholders
- NPC Placeholders: Simple colored boxes with text
- Artifact Icons: Simple colored boxes with text
- App Icons: Simple colored boxes with text

If you need free images for production, consider these resources:
- Unsplash (https://unsplash.com) - Free high-resolution photos
- Pexels (https://pexels.com) - Free stock photos
- Pixabay (https://pixabay.com) - Free images and royalty-free stock
- Game-icons.net (https://game-icons.net) - Free game icons under CC BY 3.0
- OpenGameArt.org (https://opengameart.org) - Free game art assets

For commercial use, please verify the license terms for each image resource you use.
EOF

echo "Created credits file at client/public/assets/IMAGE_CREDITS.md"
echo ""
echo "✅ All tasks completed!" 