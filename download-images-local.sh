#!/bin/bash

# Script to generate placeholder images locally for the Authentic Internet project
# This uses ImageMagick to create images without relying on external services

echo "Generating placeholder images locally..."

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

# 1. Generate NPC placeholder
generate_image "NPC" "client/public/assets/npcs/nkd-man-extension.png" "100x100" "#334455" "white"

# 2. Generate pixel avatar examples
generate_image "Pixel 1" "client/public/assets/pixel-example-1.png" "64x64" "#5588aa" "white"
generate_image "Pixel 2" "client/public/assets/pixel-example-2.png" "64x64" "#aa5588" "white"
generate_image "Pixel 3" "client/public/assets/pixel-example-3.png" "64x64" "#88aa55" "white"

# 3. Create images directory for artifact images
mkdir -p "client/public/images"

# Generate artifact placeholders
generate_image "Artifact" "client/public/images/default-artifact.png" "64x64" "#775533" "white"
generate_image "Scroll" "client/public/images/artifact-scroll.png" "64x64" "#ddaa33" "white"
generate_image "Gem" "client/public/images/artifact-gem.png" "64x64" "#33ddaa" "white"
generate_image "Book" "client/public/images/artifact-book.png" "64x64" "#aa33dd" "white"
generate_image "Potion" "client/public/images/artifact-potion.png" "64x64" "#dd33aa" "white"

# 4. Generate app icons
generate_image "Logo" "client/public/logo.png" "512x512" "#3344dd" "white"
generate_image "Logo" "client/public/logo192.png" "192x192" "#3344dd" "white"
generate_image "Logo" "client/public/logo512.png" "512x512" "#3344dd" "white"
generate_image "App" "client/public/apple-touch-icon.png" "180x180" "#3344dd" "white"
generate_image "Fav" "client/public/favicon.png" "32x32" "#3344dd" "white"

# Convert favicon.png to favicon.ico
echo "Converting favicon.png to favicon.ico..."
convert "client/public/favicon.png" "client/public/favicon.ico"
echo "✅ Favicon conversion complete!"

echo ""
echo "All placeholder images created successfully!"

# Create a credits file
cat > "client/public/assets/IMAGE_CREDITS.md" << EOF
# Image Credits

The images in this project are generated placeholder images created using ImageMagick.

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