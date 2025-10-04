# 🎮 System Architecture Diagram

## Character Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     npm run load-character                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  load-character.js: Entry Point                                  │
│  └─> Calls initializeCharacter()                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  character-generator.js: getRandomEntry()                        │
│  └─> Reads entries.json                                         │
│  └─> Randomly selects one medication entry                      │
│                                                                  │
│  OUTPUT: { account_id, med_id, med_name, med_desc, streak }    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  firebase-utils.js: getCharacter(account_id, med_id)            │
│  └─> Queries Firestore: characters/{account_id}_{med_id}       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼ EXISTS                        ▼ NOT FOUND
┌───────────────────────┐      ┌───────────────────────────────┐
│ Load existing char    │      │ CREATE NEW CHARACTER          │
│                       │      │                               │
│ Check if streak       │      │ 1. sprite-generator.js        │
│ crossed threshold     │      │    generateFeatures()         │
│                       │      │    └─> Gemini AI analyzes     │
│ If YES:               │      │        med_desc              │
│   Calculate new stats │      │    └─> Selects 3 features    │
│   updateCharacterStats│      │    └─> Generates reasons     │
│                       │      │                               │
│ If NO:                │      │ 2. sprite-generator.js        │
│   Return existing     │      │    generateCharacterSprite()  │
│                       │      │    └─> Gemini creates image   │
│                       │      │    └─> Pixelate (8x8 grid)    │
│                       │      │    └─> Remove white bg        │
│                       │      │    └─> Upload to Firebase     │
│                       │      │                               │
│                       │      │ 3. stat-calculator.js         │
│                       │      │    └─> calculateHP(streak)    │
│                       │      │    └─> calculateAttack(streak)│
│                       │      │    └─> calculateScale(streak) │
│                       │      │                               │
│                       │      │ 4. firebase-utils.js          │
│                       │      │    saveCharacter()            │
│                       │      │    └─> Store in Firestore     │
└───────────┬───────────┘      └──────────────┬────────────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  RETURN COMPLETE CHARACTER OBJECT                                │
│                                                                  │
│  {                                                               │
│    account_id: "user_alpha73",                                  │
│    med_id: "MED_101A",                                          │
│    med_name: "Claritinex Forte",                                │
│    med_desc: "...",                                             │
│    streak: 55,                                                  │
│    hp: 137,                                                     │
│    attack: 10,                                                  │
│    scale: 1,                                                    │
│    sprite_url: "https://firebasestorage...",                   │
│    feature_1: "fireball",                                       │
│    feature_2: "shield",                                         │
│    feature_3: "none",                                           │
│    feature_1_reason: "High damage from crystalline laser",      │
│    feature_2_reason: "Clarity effect provides protection",      │
│    feature_3_reason: "Two features sufficient"                  │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stat Calculation Logic

```
Input: streak (days)
    │
    ├─> Convert to months: streakMonths = streak / 30
    │
    ├─> Calculate HP:
    │   ├─ < 3mo:  random(50, 200)
    │   ├─ 3-6mo:  random(200, 500)
    │   └─ 6+mo:   random(500, 1000)
    │
    ├─> Calculate Attack:
    │   ├─ < 2mo:    10
    │   ├─ 2-4mo:    random(30, 70)
    │   ├─ 4-8mo:    random(70, 100)
    │   ├─ 8-12mo:   random(100, 150)
    │   └─ 12+mo:    175
    │
    └─> Calculate Scale:
        ├─ < 3mo:    1
        ├─ 3-7mo:    1.5
        ├─ 7-12mo:   2
        └─ 12+mo:    3
```

---

## Sprite Generation Pipeline

```
medication data
    │
    ▼
┌─────────────────────────┐
│ Gemini AI Prompt        │
│ "Create pixel art char" │
│ "White background"      │
│ "8-bit style"           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Gemini 2.5-flash-image  │
│ Returns base64 PNG      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Save raw image          │
│ {id}-raw.png            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Sharp: Resize to 1/8    │
│ (1024x1024 → 128x128)   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Sharp: Resize to 8x     │
│ (128x128 → 1024x1024)   │
│ Kernel: nearest         │
│ Result: Pixelated!      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Remove white pixels     │
│ Threshold: RGB > 240    │
│ Set alpha = 0           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Save final sprite       │
│ {id}-sprite.png         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Convert to base64       │
│ Upload to Firebase      │
│ Storage                 │
└──────────┬──────────────┘
           │
           ▼
       Firebase URL
```

---

## Feature Selection AI Flow

```
med_desc
    │
    ▼
┌──────────────────────────────────────┐
│ Gemini AI Prompt                     │
│ "Based on this medication desc..."   │
│ "Select 3 features from list..."     │
│ "Explain reasoning for each..."      │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ Gemini 2.0-flash-exp                 │
│ Returns JSON:                        │
│ {                                    │
│   feature_1: "fireball",             │
│   feature_1_reason: "...",           │
│   feature_2: "shield",               │
│   feature_2_reason: "...",           │
│   feature_3: "none",                 │
│   feature_3_reason: "..."            │
│ }                                    │
└─────────────┬────────────────────────┘
              │
              ▼
     Store in character object
```

---

## Firebase Data Model

```
Firestore: /characters
    │
    ├─ user_alpha73_MED_101A/
    │   ├─ account_id: "user_alpha73"
    │   ├─ med_id: "MED_101A"
    │   ├─ med_name: "Claritinex Forte"
    │   ├─ med_desc: "..."
    │   ├─ streak: 55
    │   ├─ hp: 137
    │   ├─ attack: 10
    │   ├─ scale: 1
    │   ├─ sprite_url: "https://..."
    │   ├─ feature_1: "fireball"
    │   ├─ feature_1_reason: "..."
    │   ├─ feature_2: "shield"
    │   ├─ feature_2_reason: "..."
    │   ├─ feature_3: "none"
    │   ├─ feature_3_reason: "..."
    │   ├─ created_at: "2025-10-04..."
    │   └─ updated_at: "2025-10-04..."
    │
    └─ user_beta48_MED_202B/
        └─ ...

Storage: /sprites
    │
    ├─ user_alpha73_MED_101A.png
    ├─ user_beta48_MED_202B.png
    └─ ...
```

---

## Module Dependencies

```
load-character.js
    └─> character-generator.js
            ├─> firebase-utils.js
            │       └─> firebase-config.js
            ├─> stat-calculator.js
            └─> sprite-generator.js
                    ├─> @google/genai
                    ├─> sharp
                    └─> firebase-utils.js
```

---

## Threshold Detection Example

```
User streak changes: 89 days → 91 days

Step 1: Convert to months
    89 / 30 = 2.97 months
    91 / 30 = 3.03 months

Step 2: Check thresholds
    HP threshold at 3 months: CROSSED! ✅
    Scale threshold at 3 months: CROSSED! ✅

Step 3: Recalculate stats
    Old HP: 150 (range 50-200)
    New HP: 350 (range 200-500) ⬆️
    
    Old Scale: 1x
    New Scale: 1.5x ⬆️
    
    Old Attack: 10 (unchanged, threshold at 2 months)
    New Attack: 10

Step 4: Update Firebase
    updateCharacterStats(account_id, med_id, 91, 350, 10, 1.5)
```
