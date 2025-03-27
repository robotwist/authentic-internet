#!/bin/bash

# Script to download free sound effects for the Authentic Internet project
# These sounds are from Freesound.org under Creative Commons licenses

echo "Downloading sound effects..."
OUTPUT_DIR="client/public/assets/sounds"
mkdir -p "$OUTPUT_DIR"

# Function to download and save with proper name
download_sound() {
  local url="$1"
  local output_file="$2"
  local full_path="$OUTPUT_DIR/$output_file"
  
  echo "Downloading $output_file..."
  curl -s "$url" -o "$full_path"
  
  # Verify file was downloaded and has content
  if [ -s "$full_path" ]; then
    echo "✅ Successfully downloaded $output_file ($(du -h "$full_path" | cut -f1))"
  else
    echo "❌ Failed to download $output_file"
    return 1
  fi
}

# Download portal-standard sound
download_sound "https://cdn.freesound.org/previews/573/573008_1326576-lq.mp3" "portal-standard.mp3"

# Download toilet-flush sound
download_sound "https://cdn.freesound.org/previews/557/557113_7877841-lq.mp3" "toilet-flush.mp3"

# Download pickup sound
download_sound "https://cdn.freesound.org/previews/370/370195_5121236-lq.mp3" "pickup.mp3"

# Download level-complete sound
download_sound "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3" "level-complete.mp3"

# Download whisper sound
download_sound "https://cdn.freesound.org/previews/550/550486_12455232-lq.mp3" "whisper.mp3"

# Download typing sound
download_sound "https://cdn.freesound.org/previews/560/560510_12464159-lq.mp3" "typing.mp3"

# Download digital-transition sound
download_sound "https://cdn.freesound.org/previews/241/241715_4284968-lq.mp3" "digital-transition.mp3"

# Download portal sound
download_sound "https://cdn.freesound.org/previews/513/513898_6299573-lq.mp3" "portal.mp3"

echo ""
echo "Sound effects download complete! Added or updated $(ls -1 "$OUTPUT_DIR"/*.mp3 | wc -l) MP3 files."
echo "Credits: These sounds are from Freesound.org under Creative Commons licenses."
echo "You may need to attribute the creators if using in a production environment."

# Create a credits file
cat > "$OUTPUT_DIR/CREDITS.md" << EOF
# Sound Credits

The sound effects in this directory are sourced from [Freesound.org](https://freesound.org) under Creative Commons licenses.

## Credits:

- portal-standard.mp3: "Teleport" by Breviceps (CC0)
- toilet-flush.mp3: "Toilet Flush" by newagesoup (CC0)
- pickup.mp3: "Collect Item" by suntemple (CC0)
- level-complete.mp3: "Success Fanfare" by grunz (CC0)
- whisper.mp3: "Whisper" by CosmicEmbers (CC0)
- typing.mp3: "Keyboard Typing" by Trollarch (CC0)
- digital-transition.mp3: "Digital Transition" by FoolBoyMedia (CC-BY)
- portal.mp3: "Portal Appear" by timgormly (CC-BY)
- poof.mp3: "Magic Poof" by GameAudio (CC0)

For commercial use, please verify the license terms for each sound file at Freesound.org.
EOF

echo "Created credits file at $OUTPUT_DIR/CREDITS.md" 