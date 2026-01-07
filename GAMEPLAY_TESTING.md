# Level 4 Shooter - Gameplay Testing & Tuning Guide

## ✅ Completed Features

### Super Mario Bros Mechanics
- ✅ Momentum-based movement with acceleration/deceleration
- ✅ Variable jump height (hold jump longer = higher jump)
- ✅ Jump-on-enemies mechanic (basic enemies)
- ✅ Improved platform layouts for better platforming

### Contra Mechanics
- ✅ Multi-directional shooting (8 directions: up, down, left, right, diagonals)
- ✅ Bullet system for player and enemies
- ✅ Spread gun power-up (shoots 5 bullets in spread pattern)
- ✅ Enemy shooting (snipers shoot back at player)
- ✅ Run-and-gun gameplay

## 🎮 Controls

- **Arrow Keys / WASD**: Move (Mario-style momentum)
- **Up / W**: Jump (hold for higher jump)
- **Space**: Shoot (Contra-style multi-directional)
- **Arrow Keys + Space**: Aim and shoot in that direction
- **ESC**: Exit game

## 🧪 Testing Checklist

### Movement & Physics
- [ ] Movement feels smooth with momentum
- [ ] Acceleration builds up naturally when starting to move
- [ ] Deceleration feels right when stopping
- [ ] Jump height varies based on button hold duration
- [ ] Landing feels solid and responsive
- [ ] Can chain jumps between platforms smoothly

### Shooting
- [ ] Can shoot in all 8 directions (up, down, left, right, 4 diagonals)
- [ ] Shooting feels responsive
- [ ] Bullets move at appropriate speed
- [ ] Spread gun power-up works correctly (5 bullets)
- [ ] Shooting cooldown feels balanced

### Enemies & Combat
- [ ] Can jump on basic enemies (Mario-style)
- [ ] Enemies take damage from bullets
- [ ] Sniper enemies shoot back at player
- [ ] Enemy bullets are visible and dodgeable
- [ ] Collision detection works correctly

### Platforming
- [ ] Platform gaps are appropriate for jumping
- [ ] Can navigate platforms smoothly
- [ ] Camera scrolling works correctly
- [ ] No getting stuck on platform edges

### Power-ups & Collectibles
- [ ] Spread gun power-up collected from weapon items
- [ ] Spread gun lasts 30 seconds
- [ ] Health pickups work
- [ ] Manuscripts collected and tracked

## 📊 Current Physics Values

```javascript
GRAVITY = 0.65
JUMP_FORCE = -14
PLAYER_ACCELERATION = 0.5
PLAYER_DECELERATION = 0.4
PLAYER_MAX_SPEED = 5.5
BULLET_SPEED = 12
SHOOT_COOLDOWN_TIME = 150ms
SPREAD_SHOOT_COOLDOWN = 200ms
```

## 🎯 Tuning Recommendations

After testing, consider adjusting:
- **Gravity**: Increase for snappier falls, decrease for floatier feel
- **Jump Force**: Increase for higher jumps, decrease for lower jumps
- **Acceleration/Deceleration**: Balance for responsive but not slippery feel
- **Bullet Speed**: Faster = more responsive, slower = more strategic
- **Cooldown**: Faster = more spammy, slower = more tactical


