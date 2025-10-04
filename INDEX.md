# 🎮 Medication Gamification - Complete System Documentation

## 📚 Documentation Index

Welcome to the Medication Gamification system! This index will guide you through all documentation files.

---

## 🚀 Start Here

### For Users (Quick Start)
1. **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** ⭐ **START HERE**
   - Complete usage instructions
   - Examples and workflows
   - Integration guide
   - Troubleshooting

### For Developers (Understanding the System)
1. **[SYSTEM_SUMMARY.md](./SYSTEM_SUMMARY.md)** - Overview of what was built
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture diagrams
3. **[CHARACTER_SYSTEM.md](./CHARACTER_SYSTEM.md)** - Technical documentation
4. **[COMMANDS.md](./COMMANDS.md)** - Command reference

---

## 📖 Documentation Files

### 1. USAGE_GUIDE.md (Start Here!) ⭐
**What it covers**:
- ✅ What the system does
- ✅ How to run it
- ✅ Character stat explanations
- ✅ Combat features
- ✅ Firebase structure
- ✅ Example workflows
- ✅ Integration with game
- ✅ Troubleshooting

**Best for**: First-time users, integration developers

---

### 2. SYSTEM_SUMMARY.md
**What it covers**:
- ✅ File structure
- ✅ Quick commands
- ✅ Character data structure
- ✅ Stat progression tables
- ✅ Firebase setup
- ✅ System flow overview

**Best for**: Quick reference, high-level understanding

---

### 3. ARCHITECTURE.md
**What it covers**:
- ✅ Character generation flow (diagram)
- ✅ Stat calculation logic (diagram)
- ✅ Sprite generation pipeline (diagram)
- ✅ Feature selection AI flow (diagram)
- ✅ Firebase data model (diagram)
- ✅ Module dependencies (diagram)
- ✅ Threshold detection examples

**Best for**: Developers, system architects, visual learners

---

### 4. CHARACTER_SYSTEM.md
**What it covers**:
- ✅ System overview
- ✅ Character stats (detailed)
- ✅ Features system
- ✅ Firebase structure
- ✅ File structure
- ✅ Stat update logic
- ✅ Dependencies

**Best for**: Technical reference, API documentation

---

### 5. COMMANDS.md
**What it covers**:
- ✅ All available commands
- ✅ What each command does
- ✅ When to use each command
- ✅ Advanced usage
- ✅ Debugging commands
- ✅ Performance notes
- ✅ Error messages

**Best for**: Command-line reference, debugging

---

## 🗂️ Code Files

### Core System Files

| File | Purpose | Type |
|------|---------|------|
| `load-character.js` | Entry point | Script |
| `character-generator.js` | Main character logic | Module |
| `sprite-generator.js` | Gemini sprite + features | Module |
| `firebase-config.js` | Firebase setup | Config |
| `firebase-utils.js` | Database operations | Module |
| `stat-calculator.js` | HP/Attack/Scale formulas | Module |
| `test-system.js` | Testing script | Script |

### Game Files

| File | Purpose | Type |
|------|---------|------|
| `game.js` | Phaser game | Game |
| `index.html` | Game HTML | HTML |
| `entries.json` | Medication data | Data |

### Legacy Files

| File | Purpose | Type |
|------|---------|------|
| `generate-image-node.js` | Original sprite generator | Script |
| `gemini-config.js` | Browser Gemini config | Config |

---

## 🎯 Quick Navigation

### I want to...

**→ Run the system for the first time**
- Read: [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Quick Start" section
- Run: `npm run load-character`

**→ Understand how it works**
- Read: [ARCHITECTURE.md](./ARCHITECTURE.md) - Flow diagrams
- Read: [SYSTEM_SUMMARY.md](./SYSTEM_SUMMARY.md) - System overview

**→ Integrate with my game**
- Read: [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Integration with Game" section
- Read: [CHARACTER_SYSTEM.md](./CHARACTER_SYSTEM.md) - "Firebase Structure"

**→ Debug an issue**
- Read: [COMMANDS.md](./COMMANDS.md) - "Debugging Commands" section
- Read: [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Common Issues" section

**→ Modify stat formulas**
- File: `stat-calculator.js`
- Read: [ARCHITECTURE.md](./ARCHITECTURE.md) - "Stat Calculation Logic"

**→ Change sprite generation**
- File: `sprite-generator.js`
- Read: [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Sprite Generation Details"

**→ Add new features**
- File: `sprite-generator.js` - Line 7: `AVAILABLE_FEATURES`
- Read: [CHARACTER_SYSTEM.md](./CHARACTER_SYSTEM.md) - "Features System"

---

## 📊 System Overview Diagram

```
entries.json (Random Entry)
        ↓
Firebase Check (Exists?)
        ↓
    ┌───┴───┐
    ↓       ↓
  YES      NO
    ↓       ↓
  Load   Generate
    ↓       ↓
Update? Create
    ↓       ↓
    └───┬───┘
        ↓
Return Character
```

---

## 🔑 Key Concepts

### Character Stats
- **HP**: 50-1000 based on streak (0-6+ months)
- **Attack**: 10-175 based on streak (0-12+ months)
- **Scale**: 1-3x based on streak (0-12+ months)

### Features
- 3 per character
- AI-selected from: black_smoke, fireball, poison_droplets, shield, yellow_cloud, none
- Each has AI-generated reason

### Firebase
- **Firestore**: Characters stored in `characters` collection
- **Storage**: Sprites stored in `sprites/` folder
- **Document ID**: `{account_id}_{med_id}`

### Gemini AI
- **Image Model**: gemini-2.5-flash-image (sprite generation)
- **Text Model**: gemini-2.0-flash-exp (feature selection)
- **API Key**: AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc

---

## 🎓 Learning Path

### Beginner
1. Read **USAGE_GUIDE.md** (20 min)
2. Run `node test-system.js` (1 min)
3. Run `npm run load-character` (30 sec - 1 min)

### Intermediate
1. Read **SYSTEM_SUMMARY.md** (10 min)
2. Read **ARCHITECTURE.md** - Flow diagrams (15 min)
3. Explore code files (30 min)

### Advanced
1. Read **CHARACTER_SYSTEM.md** (15 min)
2. Read **COMMANDS.md** - Advanced usage (10 min)
3. Modify `stat-calculator.js` or `sprite-generator.js` (∞)

---

## 📦 Dependencies

```json
{
  "@google/genai": "^0.3.1",   // Gemini AI SDK
  "firebase": "^12.3.0",        // Firebase SDK
  "sharp": "^0.34.4"            // Image processing
}
```

---

## 🚀 Quick Commands

```bash
npm run load-character    # Main system (generate/load character)
node test-system.js       # Quick test (no Firebase/Gemini)
npm run generate          # Original sprite generator
```

---

## 📞 Support

### Common Questions

**Q: Character not generating?**
A: Check [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Common Issues"

**Q: How do stats work?**
A: Check [ARCHITECTURE.md](./ARCHITECTURE.md) - "Stat Calculation Logic"

**Q: How to integrate with game?**
A: Check [USAGE_GUIDE.md](./USAGE_GUIDE.md) - "Integration with Game"

**Q: What commands are available?**
A: Check [COMMANDS.md](./COMMANDS.md)

---

## 🎯 Project Status

✅ **COMPLETE AND READY TO USE**

### What's Working
- ✅ Random entry selection
- ✅ Firebase character storage/retrieval
- ✅ Gemini sprite generation
- ✅ AI feature selection
- ✅ Stat calculation
- ✅ Automatic stat updates
- ✅ Complete documentation

### Ready For
- ✅ Game integration
- ✅ Production use
- ✅ Expansion/modification

---

## 📝 File Tree

```
medication_gamification/
├── 📚 DOCUMENTATION
│   ├── INDEX.md (this file)
│   ├── USAGE_GUIDE.md ⭐ START HERE
│   ├── SYSTEM_SUMMARY.md
│   ├── ARCHITECTURE.md
│   ├── CHARACTER_SYSTEM.md
│   └── COMMANDS.md
│
├── 🎮 CORE SYSTEM
│   ├── load-character.js (entry point)
│   ├── character-generator.js
│   ├── sprite-generator.js
│   ├── stat-calculator.js
│   ├── firebase-config.js
│   └── firebase-utils.js
│
├── 🧪 TESTING
│   └── test-system.js
│
├── 🎲 GAME
│   ├── game.js
│   ├── index.html
│   └── entries.json
│
└── 📦 CONFIG
    ├── package.json
    └── gemini-config.js
```

---

## 🎉 Success!

You have a complete, documented, production-ready medication gamification system with:
- AI-powered character generation
- Firebase persistence
- Automatic stat scaling
- Complete documentation

**Next Step**: Read [USAGE_GUIDE.md](./USAGE_GUIDE.md) and run `npm run load-character`!

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
