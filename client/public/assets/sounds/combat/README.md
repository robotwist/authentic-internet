# Combat Sound Effects

## How to Generate Sounds

1. Open `generate-combat-sounds.html` in your browser
2. Click "Download All Sounds" button
3. Place the downloaded `.wav` files in this directory
4. Convert to `.mp3` if needed (optional - game will use WAV)

## Required Sounds

- `sword.mp3` or `sword.wav` - Sword swipe sound
- `sword_beam.mp3` or `sword_beam.wav` - Magical beam projectile
- `enemy_hit.mp3` or `enemy_hit.wav` - Enemy takes damage
- `enemy_defeat.mp3` or `enemy_defeat.wav` - Enemy dies
- `damage.mp3` or `damage.wav` - Player takes damage
- `heal.mp3` or `heal.wav` - Player heals
- `gameover.mp3` or `gameover.wav` - Player dies
- `rupee.mp3` or `rupee.wav` - Collect rupee
- `heart.mp3` or `heart.wav` - Collect heart
- `key.mp3` or `key.wav` - Collect key

## Fallback System

If sounds are missing, the game will:
1. Try to load the sound from this directory
2. Fall back to existing sounds (bump, portal, etc.)
3. Generate procedural sound using Web Audio API
4. Work silently if all else fails

The game will NOT crash if sounds are missing!

## Sound Specifications

- Format: WAV or MP3
- Sample Rate: 44100 Hz
- Bit Depth: 16-bit
- Channels: Mono or Stereo
- Duration: 0.1s - 1s (short 8-bit style)

## Alternative: Use Existing Sounds

You can also use the existing game sounds as placeholders:
- sword → portal.mp3
- damage → bump.mp3
- heal → artifact-pickup.mp3
- etc.

The SoundManager is already configured with these fallbacks!

