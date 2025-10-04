# 🎮 Medication Gamification System - Complete Guide

## ✨ What You Built

A complete character generation system that:
1. **Randomly selects** medication entries from `entries.json`
2. **Checks Firebase** for existing characters
3. **Generates sprites** using Gemini AI (white background, pixelated, transparent)
4. **Assigns combat features** (black_smoke, fireball, poison_droplets, shield, yellow_cloud)
5. **Calculates stats** based on medication adherence streak
6. **Stores everything** in Firebase for future use

---

## 🚀 How to Use

### Generate a Character

```bash
npm run load-character
```

This command:
- Picks a random medication from `entries.json`
- Checks if character exists in Firebase
- If **NEW**: Generates sprite + features with Gemini AI
- If **EXISTS**: Checks if stats need updating based on streak
- Returns complete character data

---

## 📊 Character Stats Explained

### HP (Health Points)
| Streak | HP Range | Explanation |
|--------|----------|-------------|
| 0-3 months | 50-200 | Beginner level |
| 3-6 months | 200-500 | Intermediate level |
| 6+ months | 500-1000 | Advanced level |

### Attack Power
| Streak | Attack | Explanation |
|--------|--------|-------------|
| 0-2 months | 10 | Starting power |
| 2-4 months | 30-70 | Growing strength |
| 4-8 months | 70-100 | Strong fighter |
| 8-12 months | 100-150 | Elite warrior |
| 1+ year | 175 | Maximum power |

### Sprite Scale
| Streak | Scale | Visual Size |
|--------|-------|-------------|
| 0-3 months | 1x | Normal |
| 3-7 months | 1.5x | Larger |
| 7-12 months | 2x | Much larger |
| 1+ year | 3x | Massive |

---

## ⚔️ Combat Features

Each character gets **3 features** chosen by AI based on medication description:

### Available Features
- **black_smoke** - Dark offensive ability (damage over time)
- **fireball** - Fire attack (high burst damage)
- **poison_droplets** - Poison attack (debuff + damage)
- **shield** - Defensive barrier (damage reduction)
- **yellow_cloud** - Support ability (heal/buff)
- **none** - No special ability

### How Features Are Chosen
The AI reads the medication description and matches abilities. For example:

**Medication**: "Kardio-Guard 80 - beta-blocker with barrier effect"
- **Feature 1**: `shield` - "Medication creates protective barrier"
- **Feature 2**: `black_smoke` - "Counter-damage effect"
- **Feature 3**: `none` - "No additional abilities needed"

---

## 🗄️ Firebase Structure

### Firestore Collection: `characters`

Each character is stored with ID: `{account_id}_{med_id}`

```javascript
{
  // Identity
  account_id: "user_alpha73",
  med_id: "MED_101A",
  med_name: "Claritinex Forte",
  med_desc: "A potent anti-inflammatory...",
  
  // Streak & Stats
  streak: 55,              // days
  hp: 137,
  attack: 10,
  scale: 1.5,
  
  // Sprite
  sprite_url: "https://firebasestorage.googleapis.com/...",
  
  // Combat Features
  feature_1: "fireball",
  feature_1_reason: "High damage from crystalline laser attack",
  feature_2: "shield",
  feature_2_reason: "Clarity effect provides protection",
  feature_3: "none",
  feature_3_reason: "Two features sufficient for this character",
  
  // Metadata
  created_at: "2025-10-04T12:34:56.789Z",
  updated_at: "2025-10-04T14:22:11.123Z"
}
```

---

## 📁 File System

```
medication_gamification/
├── entries.json                 # Medication data (INPUT)
├── load-character.js           # Main entry point (RUN THIS)
├── character-generator.js      # Core character logic
├── sprite-generator.js         # Gemini sprite + feature generation
├── firebase-config.js          # Firebase setup
├── firebase-utils.js           # Database operations
├── stat-calculator.js          # HP/Attack/Scale formulas
├── test-system.js              # Test without Firebase
└── CHARACTER_SYSTEM.md         # Technical documentation
```

---

## 🎯 Example Workflow

### First Time Running

```bash
npm run load-character
```

**Output:**
```
🎲 Randomly selected: Claritinex Forte (Account: user_alpha73)
🔍 Checking Firebase for character: user_alpha73_MED_101A
🆕 Character not found, creating new one...
🧠 Generating features and reasons for Claritinex Forte...
✅ Features generated: {feature_1: 'fireball', ...}
🎨 Generating sprite for Claritinex Forte...
✅ Raw image saved as user_alpha73_MED_101A-raw.png
🎮 Sprite saved as user_alpha73_MED_101A-sprite.png
☁️ Uploaded to Firebase: https://firebasestorage...
✅ Character created and saved to Firebase!
   HP: 137, Attack: 10, Scale: 1x
   Features: fireball, shield, none

✨ Character ready for battle!
Name: Claritinex Forte
HP: 137
Attack: 10
Scale: 1x
Features: fireball, shield, none
Sprite: https://firebasestorage.googleapis.com/...
```

### Second Time (Character Exists)

```bash
npm run load-character
```

**Output:**
```
🎲 Randomly selected: Claritinex Forte (Account: user_alpha73)
🔍 Checking Firebase for character: user_alpha73_MED_101A
✅ Found existing character: Claritinex Forte
✅ Stats still valid for current streak

✨ Character ready for battle!
Name: Claritinex Forte
HP: 137
Attack: 10
Scale: 1x
Features: fireball, shield, none
Sprite: https://firebasestorage.googleapis.com/...
```

### Character with Updated Streak

If streak changed from 30 days to 120 days:

```
✅ Found existing character: Claritinex Forte
📊 Streak changed, updating stats...
✅ Stats updated: HP=321, ATK=91, Scale=1.5
```

---

## 🔧 Integration with Game

### In your game.js or main file:

```javascript
import { initializeCharacter } from './character-generator.js';

// Load character
const character = await initializeCharacter();

// In Phaser preload()
this.load.image('character', character.sprite_url);

// In Phaser create()
const sprite = this.add.sprite(100, 100, 'character');
sprite.setScale(character.scale * 0.08); // Adjust base scale

// Set game stats
const playerHP = character.hp;
const playerAttack = character.attack;

// Access features
console.log('Feature 1:', character.feature_1);
console.log('Why?', character.feature_1_reason);
```

---

## 🧪 Testing

### Test Without Firebase (Quick)
```bash
node test-system.js
```
Tests random selection and stat calculations only.

### Test With Firebase (Full)
```bash
npm run load-character
```
Tests everything including Gemini AI and Firebase.

---

## 🎨 Sprite Generation Details

### Process:
1. **Gemini generates** image with white background
2. **Pixelate** to 8x8 grid (8-bit style)
3. **Remove white** background (threshold: 240/255)
4. **Save locally** as `{account_id}_{med_id}-sprite.png`
5. **Upload to Firebase Storage**
6. **Return URL** for game use

### Customization:
Edit `sprite-generator.js` to change:
- Pixel size (currently 8x8)
- Art style prompt
- White threshold
- Image dimensions

---

## 🔄 Automatic Stat Updates

Stats automatically recalculate when crossing thresholds:

**Example**: User goes from 89 days → 91 days (crosses 3-month mark)
- HP: 180 → 350 (new range: 200-500)
- Scale: 1x → 1.5x

**Example**: User goes from 125 days → 55 days (drops below 4-month mark)
- Attack: 85 → 10 (new range: 10 fixed)

---

## 🚨 Common Issues

### "No image generated"
- Check Gemini API key
- Verify billing is enabled
- Check API quota

### "Firebase permission denied"
- Verify Firebase config
- Check Firestore rules
- Ensure Storage is enabled

### "Character not updating"
- Check if streak actually crossed a threshold
- Verify `shouldUpdateStats()` logic in `stat-calculator.js`

---

## 📝 Next Steps

1. **Test character generation**: `npm run load-character`
2. **Integrate with game.js**: Load sprite URL in Phaser
3. **Implement combat system**: Use features for attacks
4. **Add visual effects**: Create sprites for black_smoke, fireball, etc.
5. **Track streaks**: Update Firebase when user takes medication

---

## 🎯 Quick Reference

**Generate character**: `npm run load-character`
**Test system**: `node test-system.js`
**Firebase console**: https://console.firebase.google.com/project/medication-gamification
**Files**: All new files have clear comments and exports

---

**🎮 You now have a complete character generation system with AI-powered sprites and combat features!**
