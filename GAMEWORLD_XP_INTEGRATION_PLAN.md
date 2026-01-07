# GameWorld XP Integration - Step by Step Plan

## Current State Analysis
- GameWorld.jsx line 172-179: Combat state declarations (playerHealth, rupees, keys, etc.)
- Line 32: CombatManager imported
- Line 47-48: XPNotification already imported!
- Need to add: XPNotification rendering, LevelUpModal import/rendering

## Integration Steps

### Step 1: Add Character Stats State (after line 179)
```javascript
// XP and Leveling System
const [characterStats, setCharacterStats] = useState({
  experience: 0,
  level: 1,
  attack: 1,
  defense: 0
});
const [xpNotifications, setXPNotifications] = useState([]);
const [showLevelUpModal, setShowLevelUpModal] = useState(false);
```

### Step 2: Add Level-Up Modal Import (line 41, after RewardModal)
```javascript
import LevelUpModal from "./UI/LevelUpModal";
```

### Step 3: Add XP Logic Functions (after state declarations, around line 200+)
```javascript
// Calculate XP required for next level
const calculateXPForLevel = useCallback((level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}, []);

// Handle gaining experience with level-up logic
const handleGainExperience = useCallback((amount, source, position) => {
  console.log(`Gained ${amount} XP from: ${source}`);
  
  // Add XP notification
  if (position) {
    setXPNotifications(prev => [...prev, { amount, position, id: uuidv4() }]);
  }
  
  setCharacterStats(prev => {
    const newXP = prev.experience + amount;
    const xpNeeded = calculateXPForLevel(prev.level + 1);
    
    // Check for level up
    if (newXP >= xpNeeded) {
      const newLevel = prev.level + 1;
      const newMaxHealth = maxPlayerHealth + 2;
      const newAttack = prev.attack + 1;
      const newDefense = newLevel % 2 === 0 ? prev.defense + 1 : prev.defense;
      
      // Full heal on level up
      setPlayerHealth(newMaxHealth);
      setMaxPlayerHealth(newMaxHealth);
      
      // Show level-up modal
      setShowLevelUpModal(true);
      
      // Play level-up sound
      if (soundManager) {
        soundManager.playSound('powerup', 0.7); // Use powerup sound for now
      }
      
      console.log(`🌟 LEVEL UP! Now level ${newLevel}`);
      console.log(`  +2 Max Health (${newMaxHealth})`);
      console.log(`  +1 Attack (${newAttack})`);
      if (newLevel % 2 === 0) {
        console.log(`  +1 Defense (${newDefense})`);
      }
      
      return {
        experience: newXP,
        level: newLevel,
        attack: newAttack,
        defense: newDefense
      };
    }
    
    return { ...prev, experience: newXP };
  });
}, [calculateXPForLevel, maxPlayerHealth, soundManager]);
```

### Step 4: Find and Update CombatManager (search for <CombatManager)
Add props:
- onGainExperience={handleGainExperience}
- characterAttack={characterStats.attack}
- characterDefense={characterStats.defense}

### Step 5: Update GameHUD (search for <GameHUD)
Add props:
- experience={characterStats.experience}
- level={characterStats.level}
- experienceToNextLevel={calculateXPForLevel(characterStats.level + 1)}

### Step 6: Add Rendering (in the return statement, find where XPNotification might be)
```javascript
{/* XP Notifications */}
{xpNotifications.map((notification) => (
  <XPNotification
    key={notification.id}
    amount={notification.amount}
    position={notification.position}
    onComplete={() => {
      setXPNotifications(prev => prev.filter(n => n.id !== notification.id));
    }}
  />
))}

{/* Level Up Modal */}
{showLevelUpModal && (
  <LevelUpModal
    level={characterStats.level}
    stats={characterStats}
    onClose={() => setShowLevelUpModal(false)}
  />
)}
```

## Files to Modify
1. ✅ GameWorld.jsx - Add state, logic, rendering
2. ✅ CombatManager.jsx - Already has XP logic
3. ✅ GameHUD.jsx - Show level/XP bar
4. ✅ XPNotification.jsx - Already created
5. ✅ LevelUpModal.jsx - Already created

## Testing Plan
1. Start game
2. Defeat enemy → see "+10 XP" float
3. Gain 100 XP → see Level Up modal
4. Verify stats increased
5. Verify full heal occurred
6. Check HUD shows level and XP bar

---
Status: Ready to implement

