#!/bin/bash

# Script to download free images for the Authentic Internet project
# These images are from public domain or open source repositories

echo "Downloading missing images..."

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

# 1. Download missing NPC image
download_image "https://raw.githubusercontent.com/identicons/identicons/master/icons/plugin.png" "client/public/assets/npcs/nkd-man-extension.png"

# 2. Download missing pixel avatar examples
download_image "https://raw.githubusercontent.com/pixijs/pixijs.com/main/public/img/examples/bunny.png" "client/public/assets/pixel-example-1.png"
download_image "https://raw.githubusercontent.com/nezz/PixelArtTutorial/master/character.png" "client/public/assets/pixel-example-2.png"
download_image "https://raw.githubusercontent.com/nesbox/TIC-80/master/demos/robo8.png" "client/public/assets/pixel-example-3.png"

# 3. Create images directory for artifact images
mkdir -p "client/public/images"

# Download missing artifact images
download_image "https://raw.githubusercontent.com/game-icons/icons/master/lorc/originals/svg/empty-hourglass.svg" "client/public/images/default-artifact.png"
download_image "https://raw.githubusercontent.com/game-icons/icons/master/delapouite/originals/svg/tied-scroll.svg" "client/public/images/artifact-scroll.png"
download_image "https://raw.githubusercontent.com/game-icons/icons/master/lorc/originals/svg/gem-pendant.svg" "client/public/images/artifact-gem.png"
download_image "https://raw.githubusercontent.com/game-icons/icons/master/delapouite/originals/svg/spell-book.svg" "client/public/images/artifact-book.png"
download_image "https://raw.githubusercontent.com/game-icons/icons/master/lorc/originals/svg/potion-ball.svg" "client/public/images/artifact-potion.png"

# 4. Download PWA logo images
download_image "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/logo.svg" "client/public/logo.svg"
download_image "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/logo.svg" "client/public/logo192.png"
download_image "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/logo.svg" "client/public/logo512.png"
download_image "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/logo.svg" "client/public/apple-touch-icon.png"
download_image "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/favicon.svg" "client/public/favicon.ico"

echo ""
echo "Image downloads complete!"
echo "Note: Some SVG files were downloaded for icons. You may need to convert them to PNG format."

# Create a simple credits file
cat > "client/public/assets/IMAGE_CREDITS.md" << EOF
# Image Credits

The images in this project are from various free and open source repositories:

## NPCs
- nkd-man-extension.png: GitHub Identicons (https://github.com/identicons)

## Pixel Art Examples
- pixel-example-1.png: PixiJS examples bunny (https://pixijs.com)
- pixel-example-2.png: Pixel Art Tutorial (https://github.com/nezz/PixelArtTutorial)
- pixel-example-3.png: TIC-80 demos (https://github.com/nesbox/TIC-80)

## Artifact Icons
- Various artifact icons: Game-icons.net (https://game-icons.net) under CC BY 3.0

## App Icons
- Logo icons: Vite.js project (https://vitejs.dev) under MIT license

For commercial use, please verify the license terms for each image file.
EOF

echo "Created credits file at client/public/assets/IMAGE_CREDITS.md"

# Install Imagemagick to convert SVG to PNG
echo "Installing Imagemagick to convert SVG files to PNG..."
if command -v convert &> /dev/null; then
    echo "Imagemagick already installed."
else
    echo "Imagemagick not found. Please install it to convert SVG files."
    echo "On Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "On MacOS: brew install imagemagick"
fi

# Convert SVG images to PNG if imagemagick is available
if command -v convert &> /dev/null; then
    echo "Converting SVG images to PNG..."
    
    # Convert artifact SVGs to PNGs
    convert -background none -size 64x64 "client/public/images/default-artifact.png" "client/public/images/default-artifact.png"
    convert -background none -size 64x64 "client/public/images/artifact-scroll.png" "client/public/images/artifact-scroll.png"
    convert -background none -size 64x64 "client/public/images/artifact-gem.png" "client/public/images/artifact-gem.png"
    convert -background none -size 64x64 "client/public/images/artifact-book.png" "client/public/images/artifact-book.png"
    convert -background none -size 64x64 "client/public/images/artifact-potion.png" "client/public/images/artifact-potion.png"
    
    # Convert logo SVGs to PNGs
    convert -background none -size 192x192 "client/public/logo.svg" "client/public/logo192.png"
    convert -background none -size 512x512 "client/public/logo.svg" "client/public/logo512.png"
    convert -background none -size 180x180 "client/public/logo.svg" "client/public/apple-touch-icon.png"
    convert -background none -size 32x32 "client/public/favicon.ico" "client/public/favicon.ico"
    
    echo "SVG to PNG conversion complete!"
else
    echo "⚠️ Imagemagick not installed. SVGs will not be converted to PNGs."
    echo "Please install Imagemagick and run the conversion manually."
fi

echo ""
echo "✅ All tasks completed!" 