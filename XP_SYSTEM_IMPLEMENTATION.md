# 🌟 XP & Leveling System Implementation

## ✅ **What's Been Completed**

### **1. Combat XP Rewards** (CombatManager.jsx)
```javascript
const XP_REWARDS = {
  octorok: 10,
  moblin: 15,
  tektike: 12,
  keese: 8,
  stalfos: 20,
  default: 5
};
```

### **2. NPC Quest XP Rewards** (GameData.js)
- Shakespeare: 30 XP
- Zeus: Quest available
- Alexander Pope: 35 XP
- Oscar Wilde: 40 XP
- Ada Lovelace: 50 XP
- John Muir: 50 XP
- Hemingway: Quest available

### **3. NPC System**
- ✅ 7 NPCs across all maps
- ✅ Rich dialogue with historical quotes
- ✅ Quest systems configured
- ✅ T key to talk works

## 🔄 **What Needs Integration**

### **4. GameWorld Character State**
Need to add to GameWorld.jsx:
```javascript
const [characterStats, setCharacterStats] = useState({
  experience: 0,
  level: 1,
  maxHealth: 6, // 3 hearts
  attack: 1,
  defense: 0
});
```

### **5. Level-Up Formula**
```javascript
const calculateXPForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Level 1: 0 XP
// Level 2: 100 XP
// Level 3: 150 XP
// Level 4: 225 XP
// Level 5: 337 XP
// etc.
```

### **6. Stat Bonuses Per Level**
```javascript
// On level-up:
- maxHealth += 2 (one new heart)
- attack += 1
- defense += 1 (every 2 levels)
- Full health restore
```

### **7. XP Notification Component**
Float "+10 XP" text above enemy on defeat
- Yellow color
- Fade out animation (1s)
- Float upward

### **8. Level-Up Modal**
Show when player levels up:
- "LEVEL UP!" animation
- New level number
- Stat increases shown
- Zelda-style fanfare sound

### **9. Character Profile Page** (Transform Inventory.jsx → CharacterProfile.jsx)
Press **I** to open full-screen profile with tabs:

#### **Tab 1: Stats**
- Character name and avatar
- Level and XP bar
- Current/Max Health (hearts)
- Attack / Defense stats
- Rupees / Keys count

#### **Tab 2: Inventory**
- Items collected
- Equipped weapon
- Consumables

#### **Tab 3: Quests**
- Active quests
- Completed quests
- Quest objectives progress

#### **Tab 4: Achievements**
- Enemy defeats count
- Distance traveled
- NPCs met
- Artifacts collected

#### **Tab 5: Story**
- Character backstory (grows with progress)
- Map discovery %
- Lore unlocked

## 📋 **Implementation Order**

1. **Add character stats state to GameWorld** ✓ Next
2. **Connect CombatManager XP to state** 
3. **Add level-up logic**
4. **Create XP notification component**
5. **Create level-up modal**
6. **Transform Inventory into CharacterProfile**
7. **Add quest tracking**
8. **Add personality/story elements**

## 🎮 **Key Bindings**

- **I** = Character Profile (full screen)
- **T** = Talk to NPC
- **Z** = Attack
- **Q** = Saved Quotes

---

**Status**: Ready to integrate into GameWorld
**Next Step**: Add character stats state and onGainExperience callback

