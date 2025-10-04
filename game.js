const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff',  // White background
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let character;
let cursors;
let keys;
let characterData;
let featureUI = [];
let cooldowns = {
    feature1: 0,
    feature2: 0,
    feature3: 0
};
let activeEffects = {
    shield: false,
    poisoned: false,
    healing: false
};
let projectiles;
let minimap;  // For minimap camera

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

const FEATURE_COLORS = {
    'fireball': 0xff4500,
    'black_smoke': 0x1a1a1a,
    'poison_droplets': 0x00ff00,
    'shield': 0x00ffff,
    'yellow_cloud': 0xffff00
};

function createPlatformGraphics(scene) {
    if (!scene.textures.exists('platform')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x00DD00, 1);
        graphics.fillRect(0, 0, 400, 32);
        graphics.generateTexture('platform', 400, 32);
        graphics.destroy();
    }
}

function preload() {
    this.load.image('character', 'robitussin-sprite.png');
    
    // Feature sprites
    this.load.image('fireball', 'assets/features/fireball.png');
    this.load.image('black_smoke', 'assets/features/black_smoke.png');
    this.load.image('poison_droplets', 'assets/features/posion_dropplets.png');
    this.load.image('shield', 'assets/features/shield.png');
    this.load.image('yellow_cloud', 'assets/features/yellow_cloud.png');
    
    // Tree sprites
    this.load.image('long_tree', 'assets/surroundings/long_tree.png');
    this.load.image('red_tree', 'assets/surroundings/red_tree.png');
    this.load.image('regular_tree', 'assets/surroundings/regular_tree.png');
}

function create() {
    // Set world bounds to 3000x3000
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;

    characterData = {
        hp: 150,
        maxHp: 150,
        attack: 50,
        scale: 1,
        feature_1: 'fireball',
        feature_2: 'shield',
        feature_3: 'yellow_cloud',
        feature_1_reason: 'High burst damage for offensive power',
        feature_2_reason: 'Defensive protection during combat',
        feature_3_reason: 'Healing support for sustainability'
    };

    character = this.physics.add.sprite(centerX, centerY, 'character');
    character.setScale(0.08 * characterData.scale);
    character.setCollideWorldBounds(true);
    
    // Camera follows character
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(character, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    
    // Create minimap in top-right corner
    createMinimap(this);

    projectiles = this.physics.add.group();
    
    // Create random trees throughout the world
    createTrees(this);

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
        one: Phaser.Input.Keyboard.KeyCodes.ONE,
        two: Phaser.Input.Keyboard.KeyCodes.TWO,
        three: Phaser.Input.Keyboard.KeyCodes.THREE
    });

    createControlsUI(this);
    createFeatureUI(this);
    createStatsUI(this);

    this.input.keyboard.on('keydown-ONE', () => activateFeature(this, 1));
    this.input.keyboard.on('keydown-TWO', () => activateFeature(this, 2));
    this.input.keyboard.on('keydown-THREE', () => activateFeature(this, 3));
}

function createTrees(scene) {
    const treeTypes = ['long_tree', 'red_tree', 'regular_tree'];
    const numTrees = 25; // Increased number of trees
    const trees = []; // Track all tree positions
    const minDistance = 200; // Minimum distance between trees
    
    let attempts = 0;
    const maxAttempts = 500; // Prevent infinite loop
    
    while (trees.length < numTrees && attempts < maxAttempts) {
        attempts++;
        
        // Random position across the full 3000x3000 world
        const x = Phaser.Math.Between(300, WORLD_WIDTH - 300);
        const y = Phaser.Math.Between(300, WORLD_HEIGHT - 300);
        
        // Check if position is too close to existing trees
        let tooClose = false;
        for (let existingTree of trees) {
            const distance = Phaser.Math.Distance.Between(x, y, existingTree.x, existingTree.y);
            if (distance < minDistance) {
                tooClose = true;
                break;
            }
        }
        
        // Skip this position if too close to existing tree
        if (tooClose) continue;
        
        // Random tree type
        const treeType = Phaser.Math.RND.pick(treeTypes);
        
        // Random scale between 1.5 and 3.5 (larger trees)
        const scale = Phaser.Math.FloatBetween(1.5, 3.5);
        
        // Create tree sprite with physics
        const tree = scene.physics.add.sprite(x, y, treeType);
        tree.setScale(scale * 0.1); // Scale down from 1024px original size
        tree.setDepth(-1); // Place behind character
        tree.setImmovable(true); // Trees don't move when hit
        tree.body.allowGravity = false;
        
        // Add to trees array
        trees.push(tree);
    }
    
    // Store trees in scene for collision detection
    scene.trees = scene.physics.add.group();
    trees.forEach(tree => scene.trees.add(tree));
    
    // Add collision between character and trees
    scene.physics.add.collider(character, scene.trees);
}

function createMinimap(scene) {
    // Create a minimap camera
    const minimapWidth = 200;
    const minimapHeight = 200;
    const padding = 10;
    
    minimap = scene.cameras.add(
        scene.scale.width - minimapWidth - padding,  // x position (top-right)
        padding,  // y position
        minimapWidth,
        minimapHeight
    );
    
    // Set the minimap to view the entire world
    minimap.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    minimap.setZoom(minimapWidth / WORLD_WIDTH);  // Zoom to fit entire world
    minimap.setBackgroundColor(0xcccccc);  // Light gray background
    
    // Add border around minimap
    const border = scene.add.graphics();
    border.lineStyle(2, 0x000000, 1);
    border.strokeRect(
        scene.scale.width - minimapWidth - padding,
        padding,
        minimapWidth,
        minimapHeight
    );
    border.setScrollFactor(0);  // Fixed to screen
    border.setDepth(1000);  // On top of everything
    minimap.ignore(border);  // Don't show border in minimap
}

function createControlsUI(scene) {
    const controlsX = 20;
    const controlsY = 150;
    
    const title = scene.add.text(controlsX, controlsY, 'CONTROLS', {
        fontSize: '18px',
        fill: '#000000',  // Black text
        fontStyle: 'bold'
    });
    title.setScrollFactor(0);
    minimap.ignore(title);
    
    const move = scene.add.text(controlsX, controlsY + 30, '↑↓←→ Move', {
        fontSize: '14px',
        fill: '#333333'
    });
    move.setScrollFactor(0);
    minimap.ignore(move);
    
    const features = scene.add.text(controlsX, controlsY + 55, '1/2/3 Use Features', {
        fontSize: '14px',
        fill: '#333333'
    });
    features.setScrollFactor(0);
    minimap.ignore(features);
    
    const aim = scene.add.text(controlsX, controlsY + 80, 'Aim with arrows', {
        fontSize: '12px',
        fill: '#666666'
    });
    aim.setScrollFactor(0);
    minimap.ignore(aim);
}

function createFeatureUI(scene) {
    const startX = scene.scale.width - 190;
    const startY = scene.scale.height - 240;
    const spacing = 80;

    const features = [
        { name: characterData.feature_1, reason: characterData.feature_1_reason, key: '1' },
        { name: characterData.feature_2, reason: characterData.feature_2_reason, key: '2' },
        { name: characterData.feature_3, reason: characterData.feature_3_reason, key: '3' }
    ];

    features.forEach((feature, index) => {
        const y = startY + (index * spacing);
        
        const bg = scene.add.rectangle(startX, y, 180, 70, 0x333333, 0.8);
        
        const keyText = scene.add.text(startX - 80, y - 20, `[${feature.key}]`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontStyle: 'bold'
        });
        
        const nameText = scene.add.text(startX - 80, y, feature.name.replace('_', ' ').toUpperCase(), {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        
        const reasonText = scene.add.text(startX - 80, y + 20, feature.reason, {
            fontSize: '10px',
            fill: '#aaaaaa',
            wordWrap: { width: 160 }
        });
        
        const cooldownText = scene.add.text(startX + 70, y, '', {
            fontSize: '12px',
            fill: '#ff0000',
            fontStyle: 'bold'
        });
        
        featureUI.push({
            bg,
            keyText,
            nameText,
            reasonText,
            cooldownText,
            feature: feature.name
        });
        
        // Set all UI elements to not scroll with camera AND ignore minimap
        bg.setScrollFactor(0);
        keyText.setScrollFactor(0);
        nameText.setScrollFactor(0);
        reasonText.setScrollFactor(0);
        cooldownText.setScrollFactor(0);
        
        // Ignore minimap camera
        minimap.ignore([bg, keyText, nameText, reasonText, cooldownText]);
    });
}

function createStatsUI(scene) {
    const statsX = 20;
    const statsY = 20;
    
    const title = scene.add.text(statsX, statsY, 'STATS', {
        fontSize: '20px',
        fill: '#000000',  // Black text
        fontStyle: 'bold'
    });
    title.setScrollFactor(0);
    minimap.ignore(title);
    
    characterData.hpText = scene.add.text(statsX, statsY + 30, `HP: ${characterData.hp}/${characterData.maxHp}`, {
        fontSize: '16px',
        fill: '#ff0000'  // Red for HP
    });
    characterData.hpText.setScrollFactor(0);
    minimap.ignore(characterData.hpText);
    
    characterData.attackText = scene.add.text(statsX, statsY + 55, `ATK: ${characterData.attack}`, {
        fontSize: '16px',
        fill: '#ff6600'  // Orange for attack
    });
    characterData.attackText.setScrollFactor(0);
    minimap.ignore(characterData.attackText);
    
    characterData.hpBar = scene.add.rectangle(statsX, statsY + 85, 200, 20, 0x00ff00);
    characterData.hpBar.setOrigin(0, 0.5);
    characterData.hpBar.setScrollFactor(0);
    minimap.ignore(characterData.hpBar);
    
    const hpBarBg = scene.add.rectangle(statsX, statsY + 85, 200, 20, 0x333333);
    hpBarBg.setOrigin(0, 0.5);
    hpBarBg.setDepth(-1);
    hpBarBg.setScrollFactor(0);
    minimap.ignore(hpBarBg);
}

function activateFeature(scene, featureNum) {
    const featureKey = `feature${featureNum}`;
    
    if (cooldowns[featureKey] > 0) {
        console.log(`Feature ${featureNum} on cooldown!`);
        return;
    }
    
    const featureName = characterData[`feature_${featureNum}`];
    
    console.log(`Activating: ${featureName}`);
    
    switch(featureName) {
        case 'fireball':
            shootProjectile(scene, 'fireball', characterData.attack, 0xff0000);
            cooldowns[featureKey] = 5;
            break;
            
        case 'black_smoke':
            shootProjectile(scene, 'black_smoke', characterData.attack * 0.75, 0x333333);
            cooldowns[featureKey] = 5;
            break;
            
        case 'poison_droplets':
            shootProjectile(scene, 'poison_droplets', 0, 0x00ff00);
            cooldowns[featureKey] = 5;
            break;
            
        case 'shield':
            activateShield(scene);
            cooldowns[featureKey] = 5;
            break;
            
        case 'yellow_cloud':
            activateHealing(scene);
            cooldowns[featureKey] = 13;
            break;
    }
}

function shootProjectile(scene, type, damage, color) {
    let direction = { x: 0, y: 0 };
    
    if (cursors.up.isDown) {
        direction = { x: 0, y: -1 };
    } else if (cursors.down.isDown) {
        direction = { x: 0, y: 1 };
    } else if (cursors.left.isDown) {
        direction = { x: -1, y: 0 };
    } else if (cursors.right.isDown) {
        direction = { x: 1, y: 0 };
    } else {
        direction = { x: 1, y: 0 };
    }
    
    console.log('Shooting projectile:', type, 'Direction:', direction);
    
    // Create projectile sprite (not physics sprite yet)
    let projectile = scene.add.sprite(character.x, character.y, type);
    
    // Configure sprite appearance
    if (type === 'fireball') {
        projectile.setScale(0.05);
        projectile.setTint(0xff4500);
    } else if (type === 'black_smoke') {
        projectile.setScale(0.05);
        projectile.setAlpha(0.8);
    } else if (type === 'poison_droplets') {
        projectile.setScale(0.04);
    }
    
    // Add physics body
    scene.physics.world.enable(projectile);
    
    // Set velocity to shoot the projectile
    projectile.body.setVelocity(direction.x * 400, direction.y * 400);
    
    console.log('Projectile velocity set:', projectile.body.velocity);
    
    projectile.projectileType = type;
    projectile.damage = damage;
    
    // Add collision with trees - projectile disappears when hitting tree
    if (scene.trees) {
        scene.physics.add.overlap(projectile, scene.trees, (proj, tree) => {
            proj.destroy();
            const index = scene.activeProjectiles.indexOf(proj);
            if (index > -1) {
                scene.activeProjectiles.splice(index, 1);
            }
        });
    }
    
    // Store projectile reference
    if (!scene.activeProjectiles) {
        scene.activeProjectiles = [];
    }
    scene.activeProjectiles.push(projectile);
    
    // Destroy after 3 seconds
    scene.time.delayedCall(3000, () => {
        if (projectile && projectile.active) {
            projectile.destroy();
            const index = scene.activeProjectiles.indexOf(projectile);
            if (index > -1) {
                scene.activeProjectiles.splice(index, 1);
            }
        }
    });
}

function activateShield(scene) {
    if (activeEffects.shieldSprite) {
        activeEffects.shieldSprite.destroy();
    }
    
    activeEffects.shield = true;
    activeEffects.shieldSprite = scene.add.sprite(character.x, character.y, 'shield');
    activeEffects.shieldSprite.setScale(0.12);
    activeEffects.shieldSprite.setAlpha(0.7);
    
    const text = scene.add.text(character.x, character.y - 80, 'INVINCIBLE!', {
        fontSize: '16px',
        fill: '#00ffff',
        fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    // Pulsing effect only (no rotation)
    scene.tweens.add({
        targets: activeEffects.shieldSprite,
        alpha: 0.4,
        scaleX: 0.14,
        scaleY: 0.14,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
    
    scene.time.delayedCall(5000, () => {
        activeEffects.shield = false;
        if (activeEffects.shieldSprite) {
            activeEffects.shieldSprite.destroy();
            activeEffects.shieldSprite = null;
        }
        text.destroy();
    });
}

function activateHealing(scene) {
    if (activeEffects.healingSprite) {
        activeEffects.healingSprite.destroy();
    }
    
    activeEffects.healing = true;
    activeEffects.healingSprite = scene.add.sprite(character.x, character.y, 'yellow_cloud');
    activeEffects.healingSprite.setScale(0.1);
    activeEffects.healingSprite.setAlpha(0.5);
    
    const text = scene.add.text(character.x, character.y - 80, 'HEALING...', {
        fontSize: '16px',
        fill: '#ffff00',
        fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    // Pulsing effect only (no rotation)
    scene.tweens.add({
        targets: activeEffects.healingSprite,
        scaleX: 0.13,
        scaleY: 0.13,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });
    
    scene.time.delayedCall(13000, () => {
        characterData.hp = characterData.maxHp;
        updateStatsUI();
        
        const healText = scene.add.text(character.x, character.y - 80, 'FULL HP!', {
            fontSize: '20px',
            fill: '#00ff00',
            fontStyle: 'bold'
        });
        healText.setOrigin(0.5);
        
        scene.tweens.add({
            targets: healText,
            y: character.y - 120,
            alpha: 0,
            duration: 1000,
            onComplete: () => healText.destroy()
        });
        
        activeEffects.healing = false;
        if (activeEffects.healingSprite) {
            activeEffects.healingSprite.destroy();
            activeEffects.healingSprite = null;
        }
        text.destroy();
    });
}

function updateStatsUI() {
    if (characterData.hpText) {
        characterData.hpText.setText(`HP: ${Math.floor(characterData.hp)}/${characterData.maxHp}`);
        
        const hpPercent = characterData.hp / characterData.maxHp;
        characterData.hpBar.width = 200 * hpPercent;
        
        if (hpPercent > 0.5) {
            characterData.hpBar.setFillStyle(0x00ff00);
        } else if (hpPercent > 0.25) {
            characterData.hpBar.setFillStyle(0xffff00);
        } else {
            characterData.hpBar.setFillStyle(0xff0000);
        }
    }
}

function update(time, delta) {
    const speed = 200;
    
    if (cursors.left.isDown) {
        character.setVelocityX(-speed);
        character.flipX = true;
    } else if (cursors.right.isDown) {
        character.setVelocityX(speed);
        character.flipX = false;
    } else {
        character.setVelocityX(0);
    }
    
    if (cursors.up.isDown) {
        character.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        character.setVelocityY(speed);
    } else {
        character.setVelocityY(0);
    }
    
    if (activeEffects.shieldSprite) {
        activeEffects.shieldSprite.x = character.x;
        activeEffects.shieldSprite.y = character.y;
    }
    
    if (activeEffects.healingSprite) {
        activeEffects.healingSprite.x = character.x;
        activeEffects.healingSprite.y = character.y;
    }
    
    const deltaSeconds = delta / 1000;
    
    Object.keys(cooldowns).forEach((key, index) => {
        if (cooldowns[key] > 0) {
            cooldowns[key] -= deltaSeconds;
            cooldowns[key] = Math.max(0, cooldowns[key]);
            
            if (featureUI[index]) {
                featureUI[index].cooldownText.setText(cooldowns[key] > 0 ? Math.ceil(cooldowns[key]) + 's' : '');
            }
        }
    });
}
