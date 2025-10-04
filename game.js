// Medication Gamification - Phaser Game with Gemini-Generated Characters
// Now with 2.5D perspective, idle animations, and camera rotation!

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
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
let scoreText;
let score = 0;
let currentCharacter = 'robitussin'; // Default character

// Idle animation variables
let idleTimer = 0;
let isIdle = false;
let idleAnimProgress = 0;
let bobDirection = 1;
let squishPhase = 0;

// Camera rotation variables
let cameraAngle = 0;
let platforms;
let isDragging = false;
let lastPointerX = 0;

// Create placeholder graphics only if sprites aren't loaded
function createPlaceholderGraphics(scene) {
    // Only create if the sprites don't exist
    if (!scene.textures.exists('platform')) {
        // Create 3D-looking platform with depth
        const platformGraphics = scene.add.graphics();
        
        // Top surface (bright green)
        platformGraphics.fillStyle(0x00DD00, 1);
        platformGraphics.fillRect(0, 0, 400, 32);
        
        // Front face (darker green for 3D effect)
        platformGraphics.fillStyle(0x009900, 1);
        platformGraphics.beginPath();
        platformGraphics.moveTo(0, 32);
        platformGraphics.lineTo(20, 42);
        platformGraphics.lineTo(420, 42);
        platformGraphics.lineTo(400, 32);
        platformGraphics.closePath();
        platformGraphics.fillPath();
        
        // Right side (darkest green)
        platformGraphics.fillStyle(0x006600, 1);
        platformGraphics.beginPath();
        platformGraphics.moveTo(400, 0);
        platformGraphics.lineTo(420, 10);
        platformGraphics.lineTo(420, 42);
        platformGraphics.lineTo(400, 32);
        platformGraphics.closePath();
        platformGraphics.fillPath();
        
        platformGraphics.generateTexture('platform', 420, 42);
        platformGraphics.destroy();
    }
}

function preload() {
    // Load your Gemini-generated character images with transparent backgrounds!
    // These are the processed sprites with white backgrounds removed
    
    this.load.image('robitussin', 'robitussin-sprite.png');
    this.load.image('albuterol', 'albuterol-sprite.png');
    
    // You can add more characters as you generate them
    // this.load.image('mucinex', 'mucinex-sprite.png');
    // this.load.image('vitamin-c', 'vitamin-c-sprite.png');
    
    // Create platform graphics procedurally (no need to load)
    // This happens in create() function
}

function create() {
    // Add title with 3D text effect
    const titleShadow = this.add.text(403, 33, 'Medication Gamification', {
        fontSize: '32px',
        fill: '#000',
        fontStyle: 'bold'
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.3);
    
    const title = this.add.text(400, 30, 'Medication Gamification', {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);

    // Create platform graphics if needed
    createPlaceholderGraphics(this);

    // Add 3D-style platforms with depth
    platforms = this.physics.add.staticGroup();
    
    // Ground - with 3D offset
    const ground = platforms.create(400, 568, 'platform');
    ground.setScale(2, 1).refreshBody();
    ground.setDepth(0);
    ground.originalScaleX = 2;
    ground.originalScaleY = 1;
    
    // Ledges with 3D positioning
    const ledge1 = platforms.create(600, 400, 'platform');
    ledge1.setScale(0.5, 1);
    ledge1.setDepth(1);
    ledge1.originalScaleX = 0.5;
    ledge1.originalScaleY = 1;
    
    const ledge2 = platforms.create(50, 250, 'platform');
    ledge2.setScale(0.5, 1);
    ledge2.setDepth(2);
    ledge2.originalScaleX = 0.5;
    ledge2.originalScaleY = 1;
    
    const ledge3 = platforms.create(750, 220, 'platform');
    ledge3.setScale(0.5, 1);
    ledge3.setDepth(1);
    ledge3.originalScaleX = 0.5;
    ledge3.originalScaleY = 1;

    // Add character to the game (using your Gemini-generated sprite!)
    character = this.physics.add.sprite(100, 450, currentCharacter);
    
    // Scale the character appropriately
    character.setScale(0.08);
    character.originalScale = 0.08; // Store original scale for animations
    
    // Set character properties
    character.setBounce(0.2);
    character.setCollideWorldBounds(true);
    character.setDepth(10); // Always on top

    // Collider
    this.physics.add.collider(character, platforms);

    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Mouse drag for camera rotation (2.5D panning)
    this.input.on('pointerdown', (pointer) => {
        isDragging = true;
        lastPointerX = pointer.x;
    });
    
    this.input.on('pointermove', (pointer) => {
        if (isDragging) {
            const deltaX = pointer.x - lastPointerX;
            cameraAngle += deltaX * 0.005; // Sensitivity control
            lastPointerX = pointer.x;
        }
    });
    
    this.input.on('pointerup', () => {
        isDragging = false;
    });
    
    this.input.on('pointerout', () => {
        isDragging = false;
    });

    // Score text
    scoreText = this.add.text(16, 16, 'Adherence Score: 0', {
        fontSize: '18px',
        fill: '#000'
    });

    // Instructions with 2.5D controls
    const instructions = this.add.text(400, 100, 'Arrow Keys: Move & Jump\nMouse Drag: Rotate Camera', {
        fontSize: '16px',
        fill: '#fff',
        align: 'center',
        stroke: '#000',
        strokeThickness: 3
    });
    instructions.setOrigin(0.5);

    // Character selection instructions
    const charText = this.add.text(400, 580, 'Press 1: Robitussin  |  Press 2: Albuterol', {
        fontSize: '14px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 10, y: 5 }
    });
    charText.setOrigin(0.5);

    // Keyboard for character switching
    this.input.keyboard.on('keydown-ONE', () => switchCharacter(this, 'robitussin'));
    this.input.keyboard.on('keydown-TWO', () => switchCharacter(this, 'albuterol'));

    // Example: Add collectible items (generate these with Gemini too!)
    // const pills = this.physics.add.group({
    //     key: 'pill',
    //     repeat: 11,
    //     setXY: { x: 12, y: 0, stepX: 70 }
    // });
}

function switchCharacter(scene, characterName) {
    if (scene.textures.exists(characterName)) {
        currentCharacter = characterName;
        character.setTexture(characterName);
        console.log(`✅ Switched to ${characterName}`);
    } else {
        console.log(`⚠️ Character ${characterName} not loaded. Generate it first!`);
    }
}

function update(time, delta) {
    const deltaSeconds = delta / 1000; // Convert to seconds
    
    // === CAMERA ROTATION (2.5D Effect) ===
    // No keyboard rotation - handled by mouse drag in create()
    
    // Apply 2.5D perspective effect to platforms
    platforms.children.entries.forEach((platform, index) => {
        const baseDepth = platform.getData('baseDepth') || platform.depth;
        platform.setData('baseDepth', baseDepth);
        
        // Calculate 3D offset based on camera angle and depth
        const depthOffset = (baseDepth + 1) * 30;
        const xOffset = Math.sin(cameraAngle) * depthOffset;
        const yOffset = Math.cos(cameraAngle) * 10 * (baseDepth + 1);
        
        // Store original position once
        if (!platform.getData('originalX')) {
            platform.setData('originalX', platform.x);
            platform.setData('originalY', platform.y);
        }
        
        // Apply position offset
        platform.x = platform.getData('originalX') + xOffset;
        platform.y = platform.getData('originalY') + yOffset;
        
        // Apply scale based on original scale (don't accumulate!)
        const scaleEffect = 1 - (Math.abs(Math.sin(cameraAngle)) * 0.1);
        platform.setScale(
            platform.originalScaleX * scaleEffect,
            platform.originalScaleY
        );
    });
    
    // === CHARACTER MOVEMENT ===
    const isMoving = cursors.left.isDown || cursors.right.isDown || cursors.up.isDown;
    
    if (cursors.left.isDown) {
        character.setVelocityX(-160);
        character.flipX = true;
        idleTimer = 0; // Reset idle timer
        isIdle = false;
        idleAnimProgress = 0;
    }
    else if (cursors.right.isDown) {
        character.setVelocityX(160);
        character.flipX = false;
        idleTimer = 0;
        isIdle = false;
        idleAnimProgress = 0;
    }
    else {
        character.setVelocityX(0);
    }

    // Jump
    if (cursors.up.isDown && character.body.touching.down) {
        character.setVelocityY(-330);
        idleTimer = 0;
        isIdle = false;
        idleAnimProgress = 0;
    }
    
    // === IDLE ANIMATION SYSTEM ===
    if (!isMoving && character.body.touching.down) {
        idleTimer += deltaSeconds;
        
        // Start idle animation after 1 second
        if (idleTimer > 1.0) {
            if (!isIdle) {
                isIdle = true;
                idleAnimProgress = 0;
            }
            
            // Gradually build up the idle animation
            if (idleAnimProgress < 1.0) {
                idleAnimProgress += deltaSeconds * 0.5; // Build up over 2 seconds
                idleAnimProgress = Math.min(idleAnimProgress, 1.0);
            }
            
            // Apply idle animations
            applyIdleAnimation(time, idleAnimProgress);
        } else {
            // Reset to normal state if not idle long enough
            character.setScale(character.originalScale);
            character.y = character.y; // Keep current y position
        }
    } else {
        // Reset idle state when moving
        idleTimer = 0;
        isIdle = false;
        idleAnimProgress = 0;
        character.setScale(character.originalScale);
    }
}

/**
 * Apply idle animation effects (squishing, bobbing, side-to-side movement)
 */
function applyIdleAnimation(time, progress) {
    const originalScale = character.originalScale;
    
    // Squish animation (contract and expand)
    const squishSpeed = 0.002;
    const squishAmount = 0.08 * progress; // Max 8% squish, scaled by progress
    squishPhase += squishSpeed;
    
    const squish = Math.sin(squishPhase) * squishAmount;
    const scaleX = originalScale + squish;
    const scaleY = originalScale - squish;
    
    character.setScale(scaleX, scaleY);
    
    // Bobbing animation (up and down)
    const bobSpeed = 0.001;
    const bobAmount = 5 * progress; // Max 5 pixels, scaled by progress
    const bob = Math.sin(time * bobSpeed) * bobAmount;
    
    // Side-to-side sway
    const swaySpeed = 0.0008;
    const swayAmount = 3 * progress; // Max 3 pixels, scaled by progress
    const sway = Math.sin(time * swaySpeed) * swayAmount;
    
    // Store original position if not stored
    if (!character.getData('idleBaseY')) {
        character.setData('idleBaseY', character.y);
        character.setData('idleBaseX', character.x);
    }
    
    // Apply bobbing and swaying (only when not being moved by physics)
    if (character.body.velocity.y === 0) {
        character.y = character.getData('idleBaseY') + bob;
    }
    
    // Apply subtle rotation for extra life
    const rotationAmount = 0.02 * progress;
    character.angle = Math.sin(time * 0.001) * rotationAmount * (180 / Math.PI);
}

// Function to collect medication and increase score
function collectMedication(character, medication) {
    medication.disableBody(true, true);
    
    score += 10;
    scoreText.setText('Adherence Score: ' + score);

    // You can add Gemini-generated encouragement messages here!
    // showEncouragementMessage();
}

// Optional: Use Gemini to generate dynamic encouragement messages
async function showEncouragementMessage() {
    // This would call your Gemini API to generate personalized messages
    // Example: "Great job taking your medication! Keep up the healthy habits!"
}

/* 
 * NEXT STEPS TO COMPLETE YOUR GAME:
 * 
 * 1. Generate your character images:
 *    - Open image-generator.html
 *    - Generate "Robitussin", "Mucinex", etc.
 *    - Save images to your project folder
 * 
 * 2. Create platform images:
 *    - Generate pill/medicine-themed platforms
 *    - Replace the basic platform graphics
 * 
 * 3. Add collectible items:
 *    - Generate small pill/vitamin sprites
 *    - Use as collectibles in the game
 * 
 * 4. Add dynamic content:
 *    - Use Gemini to generate encouragement messages
 *    - Create daily challenges
 *    - Personalize based on medication schedule
 * 
 * 5. Add medication reminder system:
 *    - Track real medication schedules
 *    - Give bonuses for on-time adherence
 *    - Create streak systems
 */
