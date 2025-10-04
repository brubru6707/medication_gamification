import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";
import path from "node:path";

const GEMINI_API_KEY = "AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc";

async function processImage(inputPath, outputPath) {
  console.log(`🔧 Processing image: removing white background...`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
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
    
    console.log(`   💾 Saved: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error processing image:`, error.message);
    throw error;
  }
}

async function generateSprite(name, prompt, outputDir) {
  console.log(`\n🎨 Generating ${name}...`);
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        const rawFileName = path.join(outputDir, `raw_${name}.png`);
        const finalFileName = path.join(outputDir, `${name}.png`);
        
        fs.writeFileSync(rawFileName, buffer);
        console.log(`   ✅ Raw image saved`);
        
        await processImage(rawFileName, finalFileName);
        
        fs.unlinkSync(rawFileName);
        
        return finalFileName;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error(`   ❌ Error generating ${name}:`, error.message);
    throw error;
  }
}

async function regenerateFeatures() {
  console.log('🔥 Regenerating Feature Sprites...');
  console.log('====================================');
  
  const featuresDir = './assets/features';
  
  // Check which features are missing
  const features = [
    { name: 'yellow_cloud', desc: 'A glowing yellow cloud or mist that looks toxic and magical' }
  ];
  
  for (const feature of features) {
    const outputPath = path.join(featuresDir, `${feature.name}.png`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`\n✅ ${feature.name}.png already exists, skipping...`);
      continue;
    }
    
    const prompt = `Create a pixel art game sprite of ${feature.desc}.

CRITICAL REQUIREMENTS:
- Pure WHITE background (#FFFFFF)
- Clean 8-bit/16-bit pixel art style (like NES/SNES era)
- Centered in the image
- No background objects
- High contrast colors
- Clear black outlines
- Approximately 64x64 to 128x128 pixels
- Bright, saturated colors
- Game-ready sprite design

Style: Retro video game sprite, simple but expressive`;

    await generateSprite(feature.name, prompt, featuresDir);
  }
}

async function regenerateSurroundings() {
  console.log('\n\n🌳 Regenerating Surrounding Sprites (Trees & Boulders)...');
  console.log('=========================================================');
  
  const surroundingsDir = './assets/surroundings';
  
  const surroundings = [
    { name: 'long_tree', desc: 'A tall, slender pixelated tree with a thin trunk and small canopy at the top' },
    { name: 'red_tree', desc: 'A pixelated tree with bright red/autumn colored leaves' },
    { name: 'regular_tree', desc: 'A standard pixelated tree with green leaves and brown trunk' },
    { name: 'crystal_boulder', desc: 'A large crystalline boulder with angular facets that shimmer' },
    { name: 'rectangluar_boulder', desc: 'A rectangular-shaped boulder with flat surfaces' },
    { name: 'regular_boulder', desc: 'A rounded boulder with natural irregular surface' }
  ];
  
  for (const surrounding of surroundings) {
    const outputPath = path.join(surroundingsDir, `${surrounding.name}.png`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`\n✅ ${surrounding.name}.png already exists, skipping...`);
      continue;
    }
    
    const prompt = `Create a pixel art game sprite of ${surrounding.desc}.

CRITICAL REQUIREMENTS:
- Pure WHITE background (#FFFFFF)
- Clean 8-bit/16-bit pixel art style (like NES/SNES era)
- Centered in the image
- No background objects or ground
- High contrast colors
- Clear black outlines
- Approximately 128x128 to 256x256 pixels
- Bright, saturated colors
- Game-ready environmental sprite
- Object should cast no shadow on white background

Style: Retro video game environment sprite, simple but detailed enough to be recognizable`;

    await generateSprite(surrounding.name, prompt, surroundingsDir);
  }
}

async function main() {
  try {
    await regenerateFeatures();
    await regenerateSurroundings();
    
    console.log('\n\n✨ All sprites regenerated successfully!');
    console.log('==========================================');
    console.log('Generated files:');
    console.log('  Features: yellow_cloud.png');
    console.log('  Surroundings: long_tree.png, red_tree.png, regular_tree.png,');
    console.log('                crystal_boulder.png, rectangluar_boulder.png, regular_boulder.png');
  } catch (error) {
    console.error('\n❌ Failed to regenerate sprites:', error);
    process.exitCode = 1;
  }
}

main();
