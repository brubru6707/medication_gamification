# Medication Gamification - Character System

## System Overview

This system randomly selects medication entries, checks Firebase for existing characters, generates sprites using Gemini AI if needed, and assigns combat features based on medication descriptions.

## Quick Start

```bash
npm run load-character
```

This will:
1. Randomly select an entry from `entries.json`
2. Check Firebase for existing character
3. Generate sprite + features if new character
4. Update stats if streak changed
5. Return character data ready for game

## Character Stats

### HP (Health Points)
- **0-3 months**: 50-200 HP
- **3-6 months**: 200-500 HP
- **6+ months**: 500-1000 HP

### Attack Power
- **0-2 months**: 10 ATK
- **2-4 months**: 30-70 ATK
- **4-8 months**: 70-100 ATK
- **8-12 months**: 100-150 ATK
- **1+ year**: 175 ATK

### Sprite Scale
- **0-3 months**: 1x
- **3-7 months**: 1.5x
- **7-12 months**: 2x
- **1+ year**: 3x

## Features System

Each character has 3 features selected by AI:
- `black_smoke` - Dark offensive ability
- `fireball` - Fire offensive ability
- `poison_droplets` - Poison offensive ability
- `shield` - Defensive barrier
- `yellow_cloud` - Support/status ability
- `none` - No special feature

Features are chosen based on medication description and include AI-generated reasons.

## Firebase Structure

### Collection: `characters`

**Document ID**: `{account_id}_{med_id}`

**Fields**:
```javascript
{
  account_id: string,
  med_id: string,
  med_name: string,
  med_desc: string,
  streak: number,
  sprite_url: string,          // Firebase Storage URL
  feature_1: string,
  feature_2: string,
  feature_3: string,
  feature_1_reason: string,
  feature_2_reason: string,
  feature_3_reason: string,
  hp: number,
  attack: number,
  scale: number,
  created_at: string,
  updated_at: string
}
```

## File Structure

```
character-generator.js    - Main character logic
sprite-generator.js       - Gemini image + feature generation
firebase-config.js        - Firebase initialization
firebase-utils.js         - Database operations
stat-calculator.js        - HP/Attack/Scale calculation
load-character.js         - Entry point script
entries.json              - Medication data
```

## Usage in Game

```javascript
import { initializeCharacter } from './character-generator.js';

const character = await initializeCharacter();

// Use character data
console.log(character.sprite_url);  // Load this in Phaser
console.log(character.hp);          // Set character health
console.log(character.attack);      // Set damage output
console.log(character.scale);       // Set sprite scale
console.log(character.feature_1);   // Combat ability 1
console.log(character.feature_2);   // Combat ability 2
console.log(character.feature_3);   // Combat ability 3
```

## Stat Updates

Stats automatically update when streak crosses thresholds:
- HP thresholds: 3 months, 6 months
- Attack thresholds: 2, 4, 8, 12 months
- Scale thresholds: 3, 7, 12 months

System detects crossing (up or down) and recalculates stats accordingly.

## Firebase Configuration

Project: **medication-gamification**
- Firestore: Character storage
- Storage: Sprite images
- Auto-scaling based on usage

## Dependencies

```json
{
  "@google/genai": "^0.3.1",
  "firebase": "^12.3.0",
  "sharp": "^0.34.4"
}
```
