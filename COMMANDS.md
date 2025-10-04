# 🎮 Medication Gamification - Command Reference

## Quick Commands

### Primary Commands

```bash
# Generate/Load Character (MAIN COMMAND)
npm run load-character

# Test System Without Firebase
node test-system.js

# Original Sprite Generator
npm run generate
```

---

## What Each Command Does

### `npm run load-character`
**Purpose**: Main character generation system

**What it does**:
1. Randomly selects entry from `entries.json`
2. Checks Firebase for existing character
3. If new: Generates sprite + features with Gemini AI
4. If exists: Checks if stats need updating
5. Returns complete character data

**When to use**:
- Starting the game
- Loading a character for battle
- Testing the full system
- Generating new characters

**Example output**:
```
🎲 Randomly selected: Claritinex Forte
✅ Found existing character: Claritinex Forte
✨ Character ready for battle!
Name: Claritinex Forte
HP: 137
Attack: 10
Scale: 1x
Features: fireball, shield, none
Sprite: https://firebasestorage.googleapis.com/...
```

---

### `node test-system.js`
**Purpose**: Quick system test without Firebase/Gemini

**What it does**:
1. Tests random entry selection
2. Tests stat calculations
3. Shows stat progression for different streaks
4. No API calls, no Firebase

**When to use**:
- Quick validation of logic
- Testing stat formulas
- Debugging without hitting API limits
- Understanding stat progression

**Example output**:
```
🧪 Testing Character System...
1️⃣ Testing Random Entry Selection:
   Selected: Roto-Heal Patch
   Streak: 30 days

2️⃣ Testing Stat Calculations:
   HP: 137
   Attack: 10
   Scale: 1x

3️⃣ Testing Different Streak Levels:
   0 days (0.0 months):
     HP: 64, ATK: 10, Scale: 1x
   365 days (12.2 months):
     HP: 729, ATK: 175, Scale: 3x
```

---

### `npm run generate`
**Purpose**: Original sprite generator (for custom characters)

**What it does**:
1. Runs original `generate-image-node.js`
2. Generates Robitussin, Albuterol, Vitamin C sprites
3. Does NOT use Firebase
4. Saves sprites locally

**When to use**:
- Creating custom characters manually
- Testing Gemini image generation
- Generating specific sprites outside the system

**Files created**:
- `robitussin-raw.png` → `robitussin-sprite.png`
- `albuterol-raw.png` → `albuterol-sprite.png`
- `vitamin-c-raw.png` → `vitamin-c-sprite.png`

---

## Advanced Usage

### Generate Multiple Characters

```bash
# Run multiple times to test different entries
npm run load-character
npm run load-character
npm run load-character
```

Each run randomly selects a different medication.

---

### Test Specific Streak Levels

Edit `test-system.js` and change this line:

```javascript
const testStreaks = [0, 30, 90, 120, 240, 365];
```

To test custom streak values:

```javascript
const testStreaks = [1, 60, 180, 500]; // Your custom days
```

Then run:
```bash
node test-system.js
```

---

### Manual Character Creation

```javascript
// In Node.js REPL or custom script
import { loadOrCreateCharacter } from './character-generator.js';

const customEntry = {
  account_id: "my_account",
  med_id: "MED_999",
  med_name: "Custom Med",
  med_desc: "My custom medication description",
  streak: 100
};

const character = await loadOrCreateCharacter(customEntry);
console.log(character);
```

---

### Check Firebase Directly

```javascript
import { getCharacter } from './firebase-utils.js';

const char = await getCharacter("user_alpha73", "MED_101A");
console.log(char);
```

---

### Update Character Stats Manually

```javascript
import { updateCharacterStats } from './firebase-utils.js';

await updateCharacterStats(
  "user_alpha73",  // account_id
  "MED_101A",      // med_id
  200,             // new streak
  500,             // new hp
  85,              // new attack
  2                // new scale
);
```

---

## Debugging Commands

### Check Installed Packages
```bash
npm list
```

Should show:
- `@google/genai@^0.3.1`
- `firebase@^12.3.0`
- `sharp@^0.34.4`

---

### Verify Firebase Config
```bash
node -e "import('./firebase-config.js').then(m => console.log('✅ Firebase configured'))"
```

---

### Test Gemini API
```bash
node -e "import { GoogleGenAI } from '@google/genai'; const ai = new GoogleGenAI({apiKey:'AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc'}); console.log('✅ Gemini configured')"
```

---

### List All Characters in Firebase

```javascript
import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';

const snapshot = await getDocs(collection(db, 'characters'));
snapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data().med_name);
});
```

---

## File Locations

### Input Files
- `entries.json` - Medication data (10 entries)

### Generated Sprites
- `{account_id}_{med_id}-sprite.png` - Local sprite files

### Firebase Storage
- `sprites/{account_id}_{med_id}.png` - Cloud sprites

### Logs
- Console output only (no log files)

---

## Common Workflows

### Workflow 1: First Time Setup
```bash
# 1. Install dependencies (already done)
npm install

# 2. Test system
node test-system.js

# 3. Generate first character
npm run load-character
```

---

### Workflow 2: Daily Character Loading
```bash
# Just run this every time
npm run load-character
```

System automatically:
- Picks random entry
- Loads or creates character
- Updates stats if needed

---

### Workflow 3: Testing All Entries

```bash
# Create script: test-all.js
for (let i = 0; i < 10; i++) {
  await initializeCharacter();
}

# Run it
node test-all.js
```

---

## Performance Notes

### First Run (New Character)
- Time: ~10-30 seconds
- API Calls: 2 (features + sprite)
- Storage: 1 upload
- Database: 1 write

### Subsequent Runs (Existing Character)
- Time: ~1-2 seconds
- API Calls: 0
- Storage: 0
- Database: 1 read (+ 1 write if stats update)

---

## Quota Limits

### Gemini API
- Free tier: 15 requests/minute
- Our usage: 2 requests per new character
- Max new characters/minute: 7

### Firebase
- Firestore: 50K reads/day (free)
- Storage: 1GB (free)
- Our usage: Minimal

---

## Error Messages

### "429 Rate Limit"
**Solution**: Wait 60 seconds, try again

### "Permission denied"
**Solution**: Check Firebase rules, verify config

### "Module not found"
**Solution**: Run `npm install`

### "No image generated"
**Solution**: Check API key, verify billing enabled

---

## Next Steps After Running

After `npm run load-character` completes:

1. **Copy sprite URL** - Use in game
2. **Note character stats** - HP, Attack, Scale
3. **Check features** - Plan combat system
4. **Integrate with game.js** - Load sprite in Phaser

---

## Quick Reference Card

| Command | Purpose | Speed | API Calls |
|---------|---------|-------|-----------|
| `npm run load-character` | Main system | Slow* | 0-2 |
| `node test-system.js` | Quick test | Fast | 0 |
| `npm run generate` | Custom sprites | Slow | 3 |

*Slow on first run (new character), fast on subsequent runs (cached)

---

**💡 Pro Tip**: Use `node test-system.js` for quick iterations, then `npm run load-character` when ready for production.
