import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = "AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc";

app.use(cors());
app.use(express.json());

// Image processing function
async function processImage(inputPath, outputPath, pixelSize = 8) {
  console.log(`🔧 Processing image: pixelating and removing background...`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const smallWidth = Math.floor(metadata.width / pixelSize);
    const smallHeight = Math.floor(metadata.height / pixelSize);
    
    const pixelatedBuffer = await image
      .resize(smallWidth, smallHeight, { kernel: 'nearest' })
      .resize(metadata.width, metadata.height, { kernel: 'nearest' })
      .toBuffer();
    
    const finalImage = await sharp(pixelatedBuffer)
      .removeAlpha()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = finalImage;
    const pixels = new Uint8Array(data);
    
    const whiteThreshold = 240;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      if (r > whiteThreshold && g > whiteThreshold && b > whiteThreshold) {
        pixels[i + 3] = 0;
      }
    }
    
    await sharp(pixels, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error processing image:`, error.message);
    throw error;
  }
}

// Generate features with AI
async function generateFeatures(medName, medDesc) {
  console.log(`🧠 Generating features for ${medName}...`);
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `Based on this medication description, select EXACTLY 3 features from the available list and explain why each was chosen.

Medication: ${medName}
Description: ${medDesc}

Available features: black_smoke, fireball, poison_droplets, shield, yellow_cloud, none

Rules:
- Choose EXACTLY 3 features (can include "none" if the medication doesn't fit any feature)
- Features should match the medication's purpose (offensive, defensive, or healing)
- Each feature must have a clear, specific reason based on the description

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "feature_1": "feature_name",
  "feature_1_reason": "specific reason based on description",
  "feature_2": "feature_name",
  "feature_2_reason": "specific reason based on description",
  "feature_3": "feature_name",
  "feature_3_reason": "specific reason based on description"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const text = response.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const features = JSON.parse(cleanedText);
    
    console.log(`✅ Features generated:`, features);
    return features;
  } catch (error) {
    console.error(`❌ Error generating features:`, error.message);
    
    return {
      feature_1: "fireball",
      feature_1_reason: "Default offensive ability",
      feature_2: "shield",
      feature_2_reason: "Default defensive ability",
      feature_3: "yellow_cloud",
      feature_3_reason: "Default healing ability"
    };
  }
}

// Generate sprite with AI
async function generateCharacterSprite(medData, accountId) {
  console.log(`🎨 Generating sprite for ${medData.med_name}...`);
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `Create a pixel art game sprite character for the medication "${medData.med_name}".

Description: ${medData.med_desc}

CRITICAL REQUIREMENTS:
- Pure WHITE background (#FFFFFF)
- Clean, simple 8-bit/16-bit pixel art style
- Character centered in the image
- No background objects or decorations
- High contrast colors on the character
- Clear black outlines

CHARACTER DESIGN:
- Cute, friendly, powerful appearance
- Big expressive eyes
- Confident expression
- Bright, saturated colors
- Game-ready sprite design
- Approximately 128x128 pixel size

Style: Retro 8-bit video game sprite (NES/SNES era)`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        const baseName = `${accountId}_${medData.med_id}`;
        const rawFileName = `${baseName}-raw.png`;
        const finalFileName = `${baseName}-sprite.png`;
        
        fs.writeFileSync(rawFileName, buffer);
        console.log(`✅ Raw image saved`);
        
        await processImage(rawFileName, finalFileName, 8);
        console.log(`🎮 Sprite processed`);
        
        // Resize to 256x256 for better quality and compress to reduce file size for Firebase
        console.log(`📦 Compressing sprite for Firebase...`);
        const compressedBuffer = await sharp(finalFileName)
          .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png({ quality: 95, compressionLevel: 6 })
          .toBuffer();
        
        // Save compressed version
        fs.writeFileSync(finalFileName, compressedBuffer);
        
        const base64Image = compressedBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;
        
        console.log(`📏 Final sprite size: ${Math.round(base64Image.length / 1024)}KB`);
        
        fs.unlinkSync(rawFileName);
        
        return { localPath: finalFileName, base64: dataUrl };
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("❌ Error generating sprite:", error.message);
    throw error;
  }
}

// Endpoint to generate a sprite for a specific monster
app.post('/generate-sprite', async (req, res) => {
  try {
    const { account_id, med_id, med_name, med_desc, streak } = req.body;

    console.log(`🎨 Generating sprite for: ${med_name}`);

    // Import Firebase utils
    const { saveMonster } = await import('./firebase-utils-node.js');

    // Generate features using AI
    console.log('🧠 Generating features...');
    const features = await generateFeatures(med_name, med_desc);

    // Generate sprite using AI
    console.log('🖼️  Generating sprite image...');
    const spriteResult = await generateCharacterSprite(
      { med_name, med_desc, med_id },
      account_id
    );

    // Create monster document
    const monsterDoc = {
      account_id,
      med_id,
      med_name,
      med_desc,
      streak,
      feature_1: features.feature_1,
      feature_2: features.feature_2,
      feature_3: features.feature_3,
      feature_1_reason: features.feature_1_reason,
      feature_2_reason: features.feature_2_reason,
      feature_3_reason: features.feature_3_reason,
      sprite_url: spriteResult.base64
    };

    // Save to Firebase
    console.log('💾 Saving to Firebase...');
    const docId = await saveMonster(monsterDoc);

    console.log(`✅ Monster created: ${docId}`);

    // Return the monster data
    res.json({
      success: true,
      monster: monsterDoc
    });

  } catch (error) {
    console.error('❌ Error generating sprite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Sprite Generation Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/generate-sprite`);
});
