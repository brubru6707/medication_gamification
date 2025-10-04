# 🎨 Feature Sprites System

## Overview
The game now uses **actual sprite images** for all combat features instead of simple colored circles!

---

## ✅ Processed Feature Sprites

All feature sprites have been processed from the `/assets/features/` folder:

### Original Files (With White Backgrounds)
- `raw_black_smoke.jpg` → ❌ White background
- `raw_fireball.jpg` → ❌ White background
- `raw_posion_dropplets.jpg` → ❌ White background
- `raw_shield.jpg` → ❌ White background
- `raw_yellow_cloud.png` → ❌ White background

### Processed Files (Transparent)
- `black_smoke.png` → ✅ Transparent PNG
- `fireball.png` → ✅ Transparent PNG
- `posion_dropplets.png` → ✅ Transparent PNG
- `shield.png` → ✅ Transparent PNG
- `yellow_cloud.png` → ✅ Transparent PNG

---

## 🎮 Feature Sprites in Game

### 🔥 FIREBALL
- **Sprite**: `fireball.png`
- **Scale**: 0.05x (50px from 1024px)
- **Effect**: Rotates 360° while moving
- **Tint**: Orange-red (#ff4500)
- **Behavior**: Shoots in aimed direction
- **Lifetime**: 3 seconds

### 🌫️ BLACK SMOKE
- **Sprite**: `black_smoke.png`
- **Scale**: 0.05x (50px)
- **Effect**: Rotates 360° while moving
- **Alpha**: 0.8 (slightly transparent)
- **Behavior**: Shoots in aimed direction
- **Lifetime**: 3 seconds

### ☠️ POISON DROPLETS
- **Sprite**: `posion_dropplets.png` (note: kept typo from original filename)
- **Scale**: 0.04x (40px - smaller than others)
- **Effect**: Rotates 360° while moving
- **Behavior**: Shoots in aimed direction
- **Lifetime**: 3 seconds

### 🛡️ SHIELD
- **Sprite**: `shield.png`
- **Scale**: 0.12x (120px)
- **Effect**: 
  - Pulsing (0.12x ↔ 0.14x scale)
  - Rotating (360° in 3 seconds)
  - Alpha pulse (0.7 ↔ 0.4)
- **Behavior**: Follows character
- **Duration**: 5 seconds

### ☁️ YELLOW CLOUD
- **Sprite**: `yellow_cloud.png`
- **Scale**: 0.1x (100px)
- **Effect**:
  - Expanding (0.1x ↔ 0.13x scale)
  - Counter-rotating (-360° in 4 seconds)
  - Alpha pulse (0.5 ↔ 0.3)
- **Behavior**: Follows character
- **Duration**: 13 seconds

---

## 🔧 Processing Script

### `process-features.js`

Automatically processes all feature sprites:
1. Reads from `/assets/features/`
2. Removes white backgrounds (threshold: 240)
3. Converts to PNG with transparency
4. Saves processed sprites

### Run Processing

```bash
npm run process-features
```

Or directly:
```bash
node process-features.js
```

---

## 🎨 Visual Improvements

### Before (Simple Shapes)
```javascript
// Old: Simple colored circles
const projectile = scene.add.circle(x, y, 10, 0xff0000);
```

### After (Actual Sprites)
```javascript
// New: Actual sprite images with animations
const projectile = scene.add.sprite(x, y, 'fireball');
projectile.setScale(0.05);
scene.tweens.add({
    targets: projectile,
    angle: 360,
    duration: 1000,
    repeat: -1
});
```

---

## 📊 Sprite Specifications

| Feature | Original Size | Game Scale | Final Size | Alpha | Rotation |
|---------|--------------|------------|------------|-------|----------|
| Fireball | 1024x1024 | 0.05 | ~50px | 1.0 | 360°/1s |
| Black Smoke | 1024x1024 | 0.05 | ~50px | 0.8 | 360°/1s |
| Poison Droplets | 1024x1024 | 0.04 | ~40px | 1.0 | 360°/1s |
| Shield | 1024x1024 | 0.12-0.14 | ~120-140px | 0.4-0.7 | 360°/3s |
| Yellow Cloud | 1024x1024 | 0.1-0.13 | ~100-130px | 0.3-0.5 | -360°/4s |

---

## 🎯 Animation Details

### Projectiles (Fireball, Smoke, Poison)
```javascript
// Continuous rotation while flying
scene.tweens.add({
    targets: projectile,
    angle: 360,
    duration: 1000,
    repeat: -1
});
```

### Shield
```javascript
// Pulsing scale
scene.tweens.add({
    targets: sprite,
    scaleX: 0.14,
    scaleY: 0.14,
    alpha: 0.4,
    duration: 500,
    yoyo: true,
    repeat: -1
});

// Rotation
scene.tweens.add({
    targets: sprite,
    angle: 360,
    duration: 3000,
    repeat: -1
});
```

### Yellow Cloud
```javascript
// Expanding/contracting
scene.tweens.add({
    targets: sprite,
    scaleX: 0.13,
    scaleY: 0.13,
    alpha: 0.3,
    duration: 1000,
    yoyo: true,
    repeat: -1
});

// Counter-clockwise rotation
scene.tweens.add({
    targets: sprite,
    angle: -360,
    duration: 4000,
    repeat: -1
});
```

---

## 🔄 Adding New Feature Sprites

1. **Add raw image** to `/assets/features/`
   - Name format: `raw_feature_name.jpg` or `.png`
   - Should have white background

2. **Update `process-features.js`**
   ```javascript
   const files = [
       'raw_black_smoke.jpg',
       // ... existing files
       'raw_new_feature.jpg'  // Add here
   ];
   ```

3. **Process sprites**
   ```bash
   npm run process-features
   ```

4. **Load in game** (`preload()`)
   ```javascript
   this.load.image('new_feature', 'assets/features/new_feature.png');
   ```

5. **Use in game code**
   ```javascript
   const sprite = scene.add.sprite(x, y, 'new_feature');
   ```

---

## 📁 File Structure

```
assets/
└── features/
    ├── raw_black_smoke.jpg      (original)
    ├── raw_fireball.jpg         (original)
    ├── raw_posion_dropplets.jpg (original)
    ├── raw_shield.jpg           (original)
    ├── raw_yellow_cloud.png     (original)
    ├── black_smoke.png          (✅ processed)
    ├── fireball.png             (✅ processed)
    ├── posion_dropplets.png     (✅ processed)
    ├── shield.png               (✅ processed)
    └── yellow_cloud.png         (✅ processed)
```

---

## 🎮 In-Game Usage

### Preload
```javascript
function preload() {
    this.load.image('fireball', 'assets/features/fireball.png');
    this.load.image('black_smoke', 'assets/features/black_smoke.png');
    this.load.image('poison_droplets', 'assets/features/posion_dropplets.png');
    this.load.image('shield', 'assets/features/shield.png');
    this.load.image('yellow_cloud', 'assets/features/yellow_cloud.png');
}
```

### Create Projectile
```javascript
const projectile = scene.add.sprite(x, y, 'fireball');
projectile.setScale(0.05);
scene.physics.add.existing(projectile);
projectile.body.setVelocity(vx, vy);
```

### Create Shield Effect
```javascript
const shield = scene.add.sprite(character.x, character.y, 'shield');
shield.setScale(0.12);
shield.setAlpha(0.7);
```

---

## ✨ Visual Enhancements

### Rotating Projectiles
All projectiles spin as they fly, creating dynamic visual feedback.

### Pulsing Effects
Shield and healing cloud pulse in size and transparency for living, breathing effects.

### Smooth Animations
Phaser tweens create smooth, professional-looking animations.

---

## 🎯 Result

✅ **Professional sprite-based combat**  
✅ **Transparent PNG sprites**  
✅ **Smooth rotating animations**  
✅ **Pulsing shield/heal effects**  
✅ **Easy to add new features**  
✅ **Automated processing pipeline**

---

**Status**: ✅ Feature sprites fully integrated!
