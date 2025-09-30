# Combat System Integration Guide

## Overview
This guide shows how to integrate the new Zelda-style combat system into GameWorld.jsx

---

## Step 1: Add Combat State to GameWorld

Add these state variables to `GameWorld.jsx`:

```javascript
// In GameWorld component, add:
const [playerHealth, setPlayerHealth] = useState(6); // 3 hearts (6 half-hearts)
const [maxPlayerHealth, setMaxPlayerHealth] = useState(6);
const [rupees, setRupees] = useState(0);
const [keys, setKeys] = useState(0);
const [isAttacking, setIsAttacking] = useState(false);
const [swordType, setSwordType] = useState('wooden'); // wooden, white, magical
const [equippedItem, setEquippedItem] = useState(null);
const [isInvincible, setIsInvincible] = useState(false);
```

---

## Step 2: Import Combat Components

Add these imports at the top of `GameWorld.jsx`:

```javascript
import GameHUD from './UI/GameHUD';
import CombatManager from './Combat/CombatManager';
```

---

## Step 3: Add Combat Handlers

Add these handler functions to `GameWorld.jsx`:

```javascript
// Handle player taking damage
const handlePlayerDamage = useCallback((damage) => {
  if (isInvincible) return;
  
  const newHealth = Math.max(0, playerHealth - damage);
  setPlayerHealth(newHealth);
  
  // Invincibility frames
  setIsInvincible(true);
  setTimeout(() => setIsInvincible(false), 1000);
  
  // Play damage sound
  if (soundManager) {
    soundManager.playSound('damage', 0.5);
  }
  
  // Check for game over
  if (newHealth <= 0) {
    handleGameOver();
  }
}, [playerHealth, isInvincible, soundManager]);

// Handle player healing
const handlePlayerHeal = useCallback((amount) => {
  const newHealth = Math.min(maxPlayerHealth, playerHealth + amount);
  setPlayerHealth(newHealth);
  
  if (soundManager) {
    soundManager.playSound('heal', 0.3);
  }
}, [playerHealth, maxPlayerHealth, soundManager]);

// Handle rupee collection
const handleCollectRupee = useCallback((amount) => {
  setRupees(prev => prev + amount);
  
  if (soundManager) {
    soundManager.playSound('rupee', 0.3);
  }
}, [soundManager]);

// Handle key collection
const handleCollectKey = useCallback(() => {
  setKeys(prev => prev + 1);
  
  if (soundManager) {
    soundManager.playSound('key', 0.3);
  }
}, [soundManager]);

// Handle game over
const handleGameOver = useCallback(() => {
  console.log('Game Over!');
  // Reset player health
  setPlayerHealth(maxPlayerHealth / 2); // Respawn with half health
  // Reset position to start
  setCharacterPosition(INITIAL_CHARACTER_POSITION);
  
  if (soundManager) {
    soundManager.playSound('gameover', 0.5);
  }
}, [maxPlayerHealth, soundManager]);
```

---

## Step 4: Add Sword Attack Key Binding

Update the keyboard handler in `CharacterMovement.jsx` to add sword attack:

```javascript
// In handleKeyDown function, add:
switch (event.key) {
  // ... existing movement keys ...
  
  case "z":
  case "Z":
  case " ": // Space bar for attack
    if (!isAttacking) {
      setIsAttacking(true);
      // Play sword sound
      if (soundManager) {
        soundManager.playSound('sword', 0.3);
      }
      // Reset attack state after animation
      setTimeout(() => setIsAttacking(false), 300);
    }
    event.preventDefault();
    break;
}
```

---

## Step 5: Add Components to GameWorld Render

Update the return statement in `GameWorld.jsx`:

```javascript
return (
  <ErrorBoundary>
    <div className="game-world" ref={gameWorldRef}>
      {/* Add HUD at the top */}
      <GameHUD
        health={playerHealth}
        maxHealth={maxPlayerHealth}
        rupees={rupees}
        keys={keys}
        currentArea={currentMap?.name || "Overworld"}
        equippedItem={equippedItem}
      />
      
      {/* Existing Map component */}
      <Map
        mapData={currentMap?.data || []}
        viewport={viewport}
        mapName={currentMap?.name}
      />
      
      {/* Add Combat Manager */}
      <CombatManager
        playerPosition={characterPosition}
        playerDirection={characterState.direction}
        playerHealth={playerHealth}
        onPlayerDamage={handlePlayerDamage}
        onPlayerHeal={handlePlayerHeal}
        onCollectRupee={handleCollectRupee}
        currentMap={currentMap?.name}
        isAttacking={isAttacking}
        onAttackComplete={() => setIsAttacking(false)}
        swordType={swordType}
      />
      
      {/* Character with invincibility effect */}
      <Character
        position={characterPosition}
        direction={characterState.direction}
        isMoving={uiState.isMoving}
        className={isInvincible ? 'character-invincible' : ''}
      />
      
      {/* Rest of existing components... */}
    </div>
  </ErrorBoundary>
);
```

---

## Step 6: Add CSS for Invincibility

Add this to `Character.css`:

```css
/* Invincibility flashing effect */
.character-invincible {
  animation: invincibility-flash 0.2s steps(2) infinite;
}

@keyframes invincibility-flash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
```

---

## Step 7: Add Sound Effects

Create sound effect files or use the existing SoundManager to add:

```javascript
// In SoundManager initialization, add these sounds:
const soundFiles = {
  sword: '/sounds/sword.mp3',
  damage: '/sounds/damage.mp3',
  heal: '/sounds/heal.mp3',
  rupee: '/sounds/rupee.mp3',
  key: '/sounds/key.mp3',
  enemy_hit: '/sounds/enemy_hit.mp3',
  enemy_defeat: '/sounds/enemy_defeat.mp3',
  gameover: '/sounds/gameover.mp3',
};
```

---

## Step 8: Test Combat System

### Testing Checklist:
1. ✅ Hearts display correctly in HUD
2. ✅ Pressing Z/Space triggers sword attack
3. ✅ Enemies spawn on different maps
4. ✅ Sword hits enemies and reduces their health
5. ✅ Enemies die after health reaches 0
6. ✅ Hearts and rupees drop from defeated enemies
7. ✅ Player can collect drops automatically when near
8. ✅ Player takes damage when touched by enemies
9. ✅ Invincibility frames work (1 second)
10. ✅ Health updates correctly in HUD
11. ✅ Game over triggers when health reaches 0

---

## Advanced Features to Add Later

### Sword Beam (Full Health Bonus)
When player has full health, sword shoots a projectile:

```javascript
// In Sword.jsx, add:
useEffect(() => {
  if (playerHealth === maxPlayerHealth) {
    // Spawn sword beam projectile
    createSwordBeam(direction);
  }
}, [playerHealth, maxPlayerHealth, direction]);
```

### Enemy Projectiles
Add projectile system for Octoroks and other ranged enemies:

```javascript
// In Enemy.jsx for Octorok:
const shootProjectile = () => {
  if (Math.random() < 0.3) { // 30% chance
    const projectile = {
      position: { ...position },
      direction,
      speed: 4,
      damage: 0.5,
    };
    onShootProjectile(projectile);
  }
};
```

### Item Usage (B Button)
Add item usage for bombs, bow, boomerang:

```javascript
// Add key binding:
case "x":
case "X":
  if (equippedItem) {
    useItem(equippedItem);
  }
  break;
```

### Boss Battles
Create boss-specific components with pattern-based AI:

```javascript
import Boss from './Combat/Boss';

// In CombatManager:
{currentMap === 'Dungeon Level 1' && isBossRoom && (
  <Boss
    type="aquamentus"
    onDefeat={handleBossDefeat}
    playerPosition={playerPosition}
  />
)}
```

---

## Current State of Combat System

### ✅ Completed:
- Heart display with full/half/empty states
- Zelda-style HUD with hearts, rupees, keys, items
- Sword attack with directional swipe
- Basic enemy AI (Octorok, Moblin, Tektite)
- Enemy health and damage system
- Collision detection (sword vs enemy, enemy vs player)
- Drop system (hearts, rupees)
- Invincibility frames
- Death/defeat animations

### 🔄 Ready to Implement:
- Sound effects integration
- More enemy types
- Boss battles
- Item usage system
- Projectiles (sword beam, enemy rocks)
- Shops and NPC trading
- Save/load with combat stats

### 🎮 Gameplay Balance:
- **Starting Health**: 3 hearts (6 half-hearts)
- **Max Health**: 16 hearts (32 half-hearts)
- **Wooden Sword**: 1 damage
- **White Sword**: 2 damage
- **Magical Sword**: 4 damage
- **Enemy Damage**: 0.5 - 2 hearts depending on type
- **Invincibility**: 1 second after taking damage

---

## Testing in Development

To test the combat system:

1. Start the app: `./start-app.sh`
2. Navigate to Overworld - enemies should spawn
3. Press Z or Space to attack
4. Walk into enemies to test damage
5. Defeat enemies to collect drops
6. Check HUD updates correctly

---

## Next Steps

After combat is integrated and tested:

1. **Add more enemy variety** (5-6 types total)
2. **Implement screen transitions** (Phase B)
3. **Redesign dungeons as room-based**
4. **Add boss battles**
5. **Create item system** (bombs, bow, etc.)
6. **Add secrets** (bombable walls, hidden caves)

---

Ready to integrate! 🗡️

