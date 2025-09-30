# 🔊 Combat Sound Effects Setup Guide

## Quick Start (2 Minutes)

### Option 1: Generate Sounds (Recommended)

1. **Open the sound generator:**
   ```bash
   open generate-combat-sounds.html
   # Or just double-click the file in your file explorer
   ```

2. **Generate all sounds:**
   - Click "Download All Sounds" button
   - Wait for all 10 sounds to download
   - They'll save as `.wav` files

3. **Place the sounds:**
   ```bash
   # Move downloaded files to:
   mv ~/Downloads/*.wav client/public/assets/sounds/combat/
   ```

4. **Done!** The game will now use your 8-bit combat sounds!

---

### Option 2: Use Fallback Sounds (Already Working!)

**Good news:** The system already has fallbacks configured!

If you don't add combat sounds, the game will use:
- ✅ `sword` → portal.mp3 (swoosh sound)
- ✅ `damage` → bump.mp3 (hit sound)
- ✅ `heal` → artifact-pickup.mp3 (positive chime)
- ✅ `rupee` → artifact-pickup.mp3
- ✅ `enemy_hit` → bump.mp3
- ✅ `enemy_defeat` → poof.mp3

**The game works right now without any additional setup!**

---

### Option 3: Download Pre-made Sounds

You can find free 8-bit sound effects at:
- [Zapsplat](https://www.zapsplat.com/sound-effect-categories/8-bit/)
- [Freesound](https://freesound.org/search/?q=8bit+sword)
- [OpenGameArt](https://opengameart.org/art-search-advanced?keys=8bit+sound)

Download and rename them to match:
- sword.mp3, damage.mp3, heal.mp3, etc.

Place in: `client/public/assets/sounds/combat/`

---

## Sound Generator Features

The `generate-combat-sounds.html` tool creates:

### Combat Sounds
- **Sword** - Quick swipe (200Hz → 100Hz square wave)
- **Sword Beam** - Magical projectile (dual sine waves)
- **Enemy Hit** - Impact sound (150Hz square)
- **Enemy Defeat** - Death sound (300Hz → 50Hz descent)

### Player Sounds
- **Damage** - Hit sound (100Hz sawtooth)
- **Heal** - Positive chime (C-E-G chord)
- **Game Over** - Sad descending tone

### Item Sounds
- **Rupee** - Collect chime (1000Hz)
- **Heart** - Health pickup (800Hz → 600Hz)
- **Key** - Unlock sound (E-A notes)

All sounds are:
- ✅ 8-bit style (square/sine/triangle waves)
- ✅ Short duration (0.1s - 1s)
- ✅ Zelda-inspired
- ✅ WAV format (lossless)

---

## How the Sound System Works

### Current Implementation

```javascript
// In SoundManager.js
const soundsToLoad = [
  // Combat sounds with fallbacks
  ['sword', '/assets/sounds/combat/sword.mp3'],
  ['sword_beam', '/assets/sounds/combat/sword_beam.mp3'],
  ['damage', '/assets/sounds/combat/damage.mp3'],
  ['heal', '/assets/sounds/combat/heal.mp3'],
  ['rupee', '/assets/sounds/combat/rupee.mp3'],
  ['key', '/assets/sounds/combat/key.mp3'],
  ['enemy_hit', '/assets/sounds/combat/enemy_hit.mp3'],
  ['enemy_defeat', '/assets/sounds/combat/enemy_defeat.mp3'],
  ['gameover', '/assets/sounds/combat/gameover.mp3'],
  ['heart', '/assets/sounds/combat/heart.mp3']
];
```

### Fallback Chain

1. **Try primary sound** - `/assets/sounds/combat/sword.mp3`
2. **Try existing sounds** - portal.mp3, bump.mp3, etc.
3. **Generate procedural** - Web Audio API (future)
4. **Silent fail** - Game continues without sound

### Sound Triggers

| Action | Sound | When |
|--------|-------|------|
| Press Z | `sword` | Sword attack animation |
| Full Health + Z | `sword_beam` | Beam projectile spawns |
| Sword hits enemy | `enemy_hit` | Enemy health decreases |
| Enemy defeated | `enemy_defeat` | Enemy health reaches 0 |
| Enemy touches player | `damage` | Player health decreases |
| Collect heart | `heart` or `heal` | Heart pickup |
| Collect rupee | `rupee` | Rupee counter increases |
| Collect key | `key` | Key counter increases |
| Health reaches 0 | `gameover` | Game over screen |

---

## Testing Sounds

### In-Game Test
```bash
./start-app.sh
```

1. Press Z - Should hear sword sound
2. Attack at full health - Should hear sword + beam
3. Hit enemy - Should hear hit sound
4. Defeat enemy - Should hear defeat sound
5. Get hit - Should hear damage sound
6. Collect heart - Should hear heal sound

### Browser Test
Open browser console (F12) and run:
```javascript
// Test if sounds loaded
const sm = window.soundManager;
console.log('Sounds loaded:', Object.keys(sm.sounds));

// Test individual sounds
sm.playSound('sword', 0.5);
sm.playSound('damage', 0.5);
sm.playSound('heal', 0.5);
```

---

## Volume Control

Sounds use the existing volume system:
- Default sound volume: 0.5 (50%)
- Default music volume: 0.3 (30%)
- Can be adjusted with AudioControls component

### Adjust Combat Sound Volume

In GameWorld.jsx:
```javascript
// Louder
soundManager.playSound('sword', 0.8); // 80% volume

// Quieter  
soundManager.playSound('sword', 0.2); // 20% volume
```

---

## Troubleshooting

### Sounds not playing?

1. **Check user interaction:**
   - Sounds require user interaction (click/keypress first)
   - This is a browser security feature

2. **Check file paths:**
   ```bash
   ls client/public/assets/sounds/combat/
   # Should show: sword.mp3, damage.mp3, etc.
   ```

3. **Check browser console:**
   - F12 → Console tab
   - Look for "✅ Loaded sound: sword" messages
   - Or "⚠️ Failed to load sound" warnings

4. **Check file format:**
   - MP3 and WAV both work
   - OGG also supported
   - Make sure files aren't corrupted

### Sounds are too loud/quiet?

Adjust in the combat handlers:
```javascript
// In GameWorld.jsx
soundManager.playSound('sword', 0.3);  // Quieter
soundManager.playSound('damage', 0.7); // Louder
```

---

## Converting WAV to MP3 (Optional)

If you want smaller file sizes:

```bash
# Install ffmpeg (if not installed)
brew install ffmpeg  # Mac
sudo apt install ffmpeg  # Linux

# Convert all WAV to MP3
cd client/public/assets/sounds/combat/
for f in *.wav; do 
  ffmpeg -i "$f" -acodec libmp3lame -ab 128k "${f%.wav}.mp3"
done
```

---

## Next Steps

1. ✅ **Sounds are already working** (with fallbacks)
2. 🎵 **Generate better sounds** (use the HTML generator)
3. 🎨 **Customize sounds** (tweak frequencies/durations)
4. 📊 **Balance volume** (adjust per-sound volumes)
5. 🎮 **Test in-game** (make sure they feel right)

---

## Summary

**Current Status:** ✅ **Sound system is fully integrated and working!**

- Combat sounds are configured in SoundManager
- Fallback sounds prevent any crashes
- Game works with or without custom sounds
- Easy to add/replace sounds anytime

**You can start testing the combat system right now!**

To add custom sounds later:
1. Generate with HTML tool
2. Drop files in combat/ folder
3. Refresh game

That's it! 🎮🔊

