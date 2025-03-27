#!/bin/bash

# Script to generate missing image placeholders referenced in the Authentic Internet project
# This uses ImageMagick to create images without relying on external services

echo "Generating missing image placeholders..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ Error: ImageMagick is required but not installed."
    echo "Please install ImageMagick:"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - MacOS: brew install imagemagick"
    exit 1
fi

# Function to generate a colored placeholder with text
generate_image() {
    local text="$1"
    local output_path="$2"
    local size="$3"
    local bg_color="$4"
    local text_color="$5"
    local dir=$(dirname "$output_path")
    
    # Create directory if it doesn't exist
    mkdir -p "$dir"
    
    echo "Generating $(basename "$output_path")..."
    
    # Create a placeholder image with centered text
    convert -size "$size" -background "$bg_color" -fill "$text_color" \
        -gravity center -font Arial label:"$text" "$output_path"
    
    # Verify file was generated
    if [ -f "$output_path" ]; then
        echo "✅ Successfully generated $(basename "$output_path") ($(du -h "$output_path" | cut -f1))"
    else
        echo "❌ Failed to generate $(basename "$output_path")"
        return 1
    fi
}

# Generate missing background images
echo "Generating missing background images..."
# Create a completely blank background with no text
echo "Generating blank background pattern..."
convert -size 200x200 xc:#112233 "client/public/assets/background-pattern.png"
# Create a blank world map background with no text
echo "Generating blank world map background..."
convert -size 800x600 xc:#224466 "client/public/assets/world_map_bg.jpg"
generate_image "Artifact Background" "client/public/images/artifact-background.jpg" "800x600" "#446688" "white"
generate_image "Artifact Sample" "client/public/images/artifact-sample.png" "400x400" "#668844" "white"
generate_image "Shakespeare" "client/public/images/shakespeare.jpg" "400x400" "#884466" "white"
generate_image "Parchment" "client/public/images/parchment-bg.jpg" "800x600" "#ddccaa" "black"

# Generate missing artifact images
echo "Generating missing artifact images..."
generate_image "Enchanted Mirror" "client/public/assets/enchanted_mirror.png" "64x64" "#8844aa" "white"

# The script will check for other potentially missing images in various components
echo "Checking for other referenced images..."

# Check for Artifact related images
if [ ! -f "client/public/assets/ancient_sword.png" ]; then
    generate_image "Ancient Sword" "client/public/assets/ancient_sword.png" "64x64" "#aa4488" "white"
fi

if [ ! -f "client/public/assets/mystic_orb.png" ]; then
    generate_image "Mystic Orb" "client/public/assets/mystic_orb.png" "64x64" "#44aa88" "white"
fi

if [ ! -f "client/public/assets/dungeon_key.webp" ]; then
    generate_image "Dungeon Key" "client/public/assets/dungeon_key.png" "64x64" "#88aa44" "white"
fi

if [ ! -f "client/public/assets/golden_idol.webp" ]; then
    generate_image "Golden Idol" "client/public/assets/golden_idol.png" "64x64" "#aaaa44" "white"
fi

# Check for tile-related images
mkdir -p "client/public/assets/tiles"
if [ ! -f "client/public/assets/tiles/piskel_grass.png" ]; then
    generate_image "Grass" "client/public/assets/tiles/piskel_grass.png" "64x64" "#44aa44" "white"
fi

if [ ! -f "client/public/assets/tiles/wall.webp" ]; then
    generate_image "Wall" "client/public/assets/tiles/wall.png" "64x64" "#444444" "white"
fi

if [ ! -f "client/public/assets/tiles/water.webp" ]; then
    generate_image "Water" "client/public/assets/tiles/water.png" "64x64" "#4444aa" "white"
fi

if [ ! -f "client/public/assets/tiles/sand.png" ]; then
    generate_image "Sand" "client/public/assets/tiles/sand.png" "64x64" "#ccaa66" "white"
fi

if [ ! -f "client/public/assets/tiles/dungeon.webp" ]; then
    generate_image "Dungeon" "client/public/assets/tiles/dungeon.png" "64x64" "#222222" "white"
fi

if [ ! -f "client/public/assets/tiles/portal.webp" ]; then
    generate_image "Portal" "client/public/assets/tiles/portal.png" "64x64" "#9944aa" "white"
fi

# Check for character-related images
if [ ! -f "client/public/assets/character.png" ]; then
    generate_image "Character" "client/public/assets/character.png" "32x32" "#cc6644" "white"
fi

if [ ! -f "client/public/assets/nkd-man.png" ]; then
    generate_image "NKD Man" "client/public/assets/nkd-man.png" "32x32" "#aa6644" "white"
fi

# Check for default avatar
if [ ! -f "client/public/assets/default-avatar.svg" ]; then
    # For SVG, we'll use a text file with SVG content
    mkdir -p "client/public/assets"
    cat > "client/public/assets/default-avatar.svg" << EOF
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#3366aa"/>
  <text x="50" y="55" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Avatar</text>
</svg>
EOF
    echo "✅ Successfully generated default-avatar.svg"
fi

echo ""
echo "All missing images have been generated as placeholders!"
echo "Note: These are for development purposes and should be replaced with proper images."
echo ""
echo "✅ All tasks completed!" 