# 🌳 Tree Sprites System

## Overview
The game world now includes **randomized tree sprites** that populate the environment, creating a more immersive open-world experience!

---

## ✅ Tree Sprites

### Processed Tree Files

#### Original Files (With White Backgrounds)
- `raw_long_tree.jpg` → ❌ White background
- `raw_red_tree.jpg` → ❌ White background
- `raw_regular_tree.jpg` → ❌ White background

#### Processed Files (Transparent)
- `long_tree.png` → ✅ Transparent PNG (219,682 pixels made transparent)
- `red_tree.png` → ✅ Transparent PNG (182,295 pixels made transparent)
- `regular_tree.png` → ✅ Transparent PNG (172,759 pixels made transparent)

---

## 🎮 Tree Implementation

### Loading Trees
Trees are loaded in the `preload()` function:

```javascript
function preload() {
    // Tree sprites
    this.load.image('long_tree', 'assets/surroundings/long_tree.png');
    this.load.image('red_tree', 'assets/surroundings/red_tree.png');
    this.load.image('regular_tree', 'assets/surroundings/regular_tree.png');
}
```

### Creating Trees
Trees are randomly placed during game creation:

```javascript
function createTrees(scene) {
    const treeTypes = ['long_tree', 'red_tree', 'regular_tree'];
    const numTrees = 25; // Number of trees to spawn
    
    for (let i = 0; i < numTrees; i++) {
        // Random position
        const x = Phaser.Math.Between(100, scene.scale.width - 100);
        const y = Phaser.Math.Between(100, scene.scale.height - 100);
        
        // Random tree type
        const treeType = Phaser.Math.RND.pick(treeTypes);
        
        // Random scale between 1.0 and 2.5
        const scale = Phaser.Math.FloatBetween(1.0, 2.5);
        
        // Create tree sprite
        const tree = scene.add.sprite(x, y, treeType);
        tree.setScale(scale * 0.1); // Scale down from 1024px original size
        tree.setDepth(-1); // Place behind character
    }
}
```

---

## 🎨 Tree Specifications

| Tree Type | Original Size | Scale Range | Final Size Range | Transparency |
|-----------|--------------|-------------|------------------|--------------|
| Long Tree | 1024x1024 | 1.0-2.5 | ~100-250px | 219,682 pixels |
| Red Tree | 1024x1024 | 1.0-2.5 | ~100-250px | 182,295 pixels |
| Regular Tree | 1024x1024 | 1.0-2.5 | ~100-250px | 172,759 pixels |

### Randomization Features

#### 1. **Random Position**
- X: Between 100px and (screen width - 100px)
- Y: Between 100px and (screen height - 100px)
- Ensures trees don't spawn too close to edges

#### 2. **Random Type**
- Each tree randomly selected from 3 types
- Uses `Phaser.Math.RND.pick()` for equal distribution
- Creates variety in the environment

#### 3. **Random Scale**
- Scale: 1.0x to 2.5x
- Base scale: 0.1 (to fit 1024px sprites)
- Final range: 0.1x to 0.25x of original size
- Creates depth perception and variety

#### 4. **Depth Layering**
- All trees: `setDepth(-1)`
- Renders behind character
- Character always appears in front

---

## 🌲 Tree Count

- **Default**: 25 trees per world
- Adjustable by changing `numTrees` in `createTrees()`

```javascript
const numTrees = 25; // Change this to spawn more/fewer trees
```

---

## 🔧 Processing Script Updates

The `process-features.js` script now handles both feature sprites AND tree sprites:

```javascript
// Feature sprites
const featureDir = './assets/features';
const featureFiles = [
    'raw_black_smoke.jpg',
    'raw_fireball.jpg',
    'raw_posion_dropplets.jpg',
    'raw_shield.jpg',
    'raw_yellow_cloud.png'
];

// Surrounding sprites (trees)
const surroundingDir = './assets/surroundings';
const surroundingFiles = [
    'raw_long_tree.jpg',
    'raw_red_tree.jpg',
    'raw_regular_tree.jpg'
];
```

### Running the Processing Script

```bash
npm run process-features
```

Or directly:
```bash
node process-features.js
```

**Output:**
```
🎨 Processing Feature Sprites...
[Feature sprites processing...]
✨ Feature sprites processed!

🌳 Processing Surrounding Sprites (Trees)...
🔧 Processing: assets\surroundings\raw_long_tree.jpg
   📐 Size: 1024x1024
   ✅ Made 219682 pixels transparent
   💾 Saved: assets\surroundings\long_tree.png
[...]
✨ All sprites processed!
```

---

## 📁 File Structure

```
assets/
├── features/
│   ├── black_smoke.png
│   ├── fireball.png
│   └── [other features...]
└── surroundings/
    ├── raw_long_tree.jpg      (original)
    ├── raw_red_tree.jpg       (original)
    ├── raw_regular_tree.jpg   (original)
    ├── long_tree.png          (✅ processed)
    ├── red_tree.png           (✅ processed)
    └── regular_tree.png       (✅ processed)
```

---

## 🎯 Visual Effect

### Environment Features
- ✅ **Randomized placement** - Trees appear in different locations each game
- ✅ **Size variety** - Trees range from 1.0x to 2.5x scale
- ✅ **Type variety** - 3 different tree types
- ✅ **Depth layering** - Trees behind character
- ✅ **Transparent backgrounds** - No white squares!

### Game World Feel
- Creates a **natural environment**
- Adds **depth** to the world
- Provides **visual interest**
- Makes the world feel **alive**

---

## 🔄 Adding More Tree Types

1. **Add raw tree image** to `/assets/surroundings/`
   - Name format: `raw_tree_name.jpg` or `.png`
   - Should have white background

2. **Update `process-features.js`**
   ```javascript
   const surroundingFiles = [
       'raw_long_tree.jpg',
       'raw_red_tree.jpg',
       'raw_regular_tree.jpg',
       'raw_new_tree.jpg'  // Add here
   ];
   ```

3. **Process sprites**
   ```bash
   npm run process-features
   ```

4. **Load in game** (`preload()`)
   ```javascript
   this.load.image('new_tree', 'assets/surroundings/new_tree.png');
   ```

5. **Add to tree types** (`createTrees()`)
   ```javascript
   const treeTypes = ['long_tree', 'red_tree', 'regular_tree', 'new_tree'];
   ```

---

## 🎮 Customization Options

### Adjust Tree Density
```javascript
const numTrees = 50; // More trees = denser forest
const numTrees = 10; // Fewer trees = sparse environment
```

### Adjust Tree Size Range
```javascript
// Smaller trees
const scale = Phaser.Math.FloatBetween(0.5, 1.5);

// Larger trees
const scale = Phaser.Math.FloatBetween(2.0, 4.0);

// Uniform size
const scale = 1.5; // All trees same size
```

### Adjust Spawn Area
```javascript
// More padding from edges
const x = Phaser.Math.Between(200, scene.scale.width - 200);
const y = Phaser.Math.Between(200, scene.scale.height - 200);

// Spawn across entire screen
const x = Phaser.Math.Between(0, scene.scale.width);
const y = Phaser.Math.Between(0, scene.scale.height);
```

---

## ✨ Result

✅ **25 randomly placed trees**  
✅ **3 unique tree types**  
✅ **Random scaling (1.0x - 2.5x)**  
✅ **Transparent backgrounds**  
✅ **Depth layering (behind character)**  
✅ **Dynamic environment creation**

---

**Status**: ✅ Tree system fully integrated!
