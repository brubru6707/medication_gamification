# 🎮 Medication Battle Arena - Game Guide

## Overview
Transform your medication character into a battle-ready warrior in an open-world combat arena!

---

## 🎯 Controls

### Movement (Open World)
- **↑ Arrow Up** - Move Up
- **↓ Arrow Down** - Move Down
- **← Arrow Left** - Move Left
- **→ Arrow Right** - Move Right

### Combat Features
- **1 Key** - Activate Feature 1
- **2 Key** - Activate Feature 2  
- **3 Key** - Activate Feature 3

### Aiming (Projectiles)
- Hold arrow key direction when pressing 1/2/3 to aim projectiles
- Default direction: Right

---

## ⚔️ Features System

### 🔥 FIREBALL
- **Damage**: Full attack power (100%)
- **Cooldown**: 5 seconds
- **Effect**: Shoots fireball in aimed direction
- **Visual**: Orange projectile with glow
- **Type**: Offensive

### 🌫️ BLACK SMOKE
- **Damage**: 75% of attack power
- **Cooldown**: 5 seconds
- **Effect**: Shoots dark smoke in aimed direction
- **Visual**: Dark gray/black projectile
- **Type**: Offensive (Reduced)

### ☠️ POISON DROPLETS
- **Damage**: 10% HP per second for 6 seconds (60% total)
- **Cooldown**: 5 seconds
- **Effect**: Shoots poison that damages over time
- **Visual**: Green droplet with outline
- **Type**: Damage Over Time

### 🛡️ SHIELD
- **Effect**: Invincibility for 5 seconds
- **Cooldown**: 5 seconds
- **Visual**: Cyan circle around character (pulsing)
- **Type**: Defensive
- **Note**: Follows character movement

### ☁️ YELLOW CLOUD
- **Effect**: Restore to full HP after 13 seconds
- **Cooldown**: 13 seconds
- **Visual**: Yellow cloud around character (expanding/contracting)
- **Type**: Healing
- **Note**: Follows character movement

---

## 📊 Character Stats

### HP (Health Points)
- Displayed top-left with bar
- Green = Healthy (>50%)
- Yellow = Warning (25-50%)
- Red = Critical (<25%)

### Attack Power
- Determines damage output
- Affects fireball and black_smoke

### Scale
- Visual size multiplier
- Based on medication streak

---

## 🎨 Visual Features

### Background
- Pure black (#000000) for combat arena feel

### Character
- Sprite loaded from generated image
- Scales based on character stats
- Flips when moving left

### Effects
- **Shield**: Cyan pulsing circle
- **Healing**: Yellow expanding cloud
- **Projectiles**: Colored based on type
- **HP Bar**: Color-coded health indicator

---

## 📍 UI Layout

```
┌──────────────────────────────────────────────────┐
│  STATS (Top-Left)          TITLE (Top-Center)    │
│  HP: 150/150                                     │
│  ATK: 50                                         │
│  [HP Bar]                                        │
│                                                  │
│  CONTROLS                                        │
│  ↑↓←→ Move                                       │
│  1/2/3 Features                                  │
│                                                  │
│                                                  │
│           [Character in center]                  │
│                                                  │
│                                                  │
│                                                  │
│                              FEATURES (Bottom-R) │
│                              ┌─────────────────┐│
│                              │ [1] FIREBALL    ││
│                              │ High burst dmg  ││
│                              ├─────────────────┤│
│                              │ [2] SHIELD      ││
│                              │ Protection      ││
│                              ├─────────────────┤│
│                              │ [3] YELLOW CLOUD││
│                              │ Healing support ││
│                              └─────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## 🎯 Feature Descriptions (Bottom-Right)

Each feature shows:
1. **Key binding** [1], [2], or [3] (in yellow)
2. **Feature name** (e.g., FIREBALL)
3. **Reason for selection** (AI-generated explanation)
4. **Cooldown timer** (when active)

Example:
```
┌───────────────────────┐
│ [1] FIREBALL      3s  │  ← Cooldown
│ High burst damage for │
│ offensive power       │  ← AI Reason
└───────────────────────┘
```

---

## 🎮 Gameplay Tips

### Offensive Strategy
1. Use **Fireball** for maximum damage
2. Use **Black Smoke** when fireball on cooldown
3. Use **Poison Droplets** for sustained damage

### Defensive Strategy
1. Activate **Shield** when low HP
2. Use **Yellow Cloud** for guaranteed full heal
3. Shield + Cloud combo for safety

### Movement Strategy
1. Move constantly to avoid enemy attacks
2. Position for better projectile angles
3. Use world bounds strategically

---

## 🔧 Technical Details

### Canvas Size
- **Width**: 1200px
- **Height**: 800px
- **Background**: #000000 (Black)

### Physics
- **Gravity**: 0 (open world, not platformer)
- **Movement Speed**: 200 px/s
- **Projectile Speed**: 400 px/s
- **Collision**: World bounds enabled

### Cooldown System
- Real-time countdown in seconds
- Displayed on feature UI
- Prevents spam usage

---

## 📝 Feature Integration

Features are loaded from character data:
```javascript
characterData.feature_1 = 'fireball'
characterData.feature_1_reason = 'AI explanation...'
```

To customize, modify the character data object or load from Firebase.

---

## 🎨 Color Codes

| Feature | Color Code | Visual |
|---------|------------|--------|
| Fireball | #FF4500 | Orange-red |
| Black Smoke | #1A1A1A | Dark gray |
| Poison Droplets | #00FF00 | Bright green |
| Shield | #00FFFF | Cyan |
| Yellow Cloud | #FFFF00 | Yellow |

---

## 🚀 Next Steps

1. Load character from Firebase
2. Add enemy AI
3. Implement multiplayer
4. Add power-ups
5. Create battle modes

---

**Game Type**: Open-World Battle Arena  
**Genre**: Action/Combat  
**Players**: 1 (expandable to multiplayer)  
**Status**: ✅ Ready to Play!
