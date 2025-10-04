import sharp from 'sharp';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Feature sprites
const featureDir = './assets/features';
const featureFiles = [
    'raw_yellow_cloud.jpg'
];

// Surrounding sprites (trees and boulders)
const surroundingDir = './assets/surroundings';
const surroundingFiles = [
    'raw_long_tree.jpg',
    'raw_red_tree.jpg',
    'raw_regular_tree.jpg',
    'raw_crystal_boulder.jpg',
    'raw_rectangular_boulder.jpg',
    'raw_regular_boulder.jpg'
];

async function processFeatureSprite(inputPath, outputPath) {
    console.log(`🔧 Processing: ${inputPath}`);
    
    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        console.log(`   📐 Size: ${metadata.width}x${metadata.height}`);
        
        const finalImage = await image
            .removeAlpha()
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        const { data, info } = finalImage;
        const pixels = new Uint8Array(data);
        
        const whiteThreshold = 240;
        let pixelsChanged = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            if (r > whiteThreshold && g > whiteThreshold && b > whiteThreshold) {
                pixels[i + 3] = 0;
                pixelsChanged++;
            }
        }
        
        console.log(`   ✅ Made ${Math.floor(pixelsChanged / 4)} pixels transparent`);
        
        await sharp(pixels, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
        .png()
        .toFile(outputPath);
        
        console.log(`   💾 Saved: ${outputPath}\n`);
        
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
    }
}

async function processAllSprites() {
    // Process feature sprites
    console.log('🎨 Processing Feature Sprites...\n');
    
    for (const file of featureFiles) {
        const inputPath = path.join(featureDir, file);
        const outputName = file.replace('raw_', '').replace('.jpg', '.png');
        const outputPath = path.join(featureDir, outputName);
        
        await processFeatureSprite(inputPath, outputPath);
    }
    
    console.log('✨ Feature sprites processed!');
    
    // Process surrounding sprites (trees)
    console.log('\n🌳 Processing Surrounding Sprites (Trees)...\n');
    
    for (const file of surroundingFiles) {
        const inputPath = path.join(surroundingDir, file);
        const outputName = file.replace('raw_', '').replace('.jpg', '.png');
        const outputPath = path.join(surroundingDir, outputName);
        
        await processFeatureSprite(inputPath, outputPath);
    }
    
    console.log('✨ All sprites processed!');
    console.log('\n📁 Generated files:');
    console.log('   Features:');
    console.log('     - yellow_cloud.png');
    console.log('   Surroundings (Trees):');
    console.log('     - long_tree.png');
    console.log('     - red_tree.png');
    console.log('     - regular_tree.png');
    console.log('   Surroundings (Boulders):');
    console.log('     - crystal_boulder.png');
    console.log('     - rectangular_boulder.png');
    console.log('     - regular_boulder.png');
}

processAllSprites().catch(console.error);
