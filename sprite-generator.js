import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";

const GEMINI_API_KEY = "AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc";

const AVAILABLE_FEATURES = ['black_smoke', 'fireball', 'poison_droplets', 'shield', 'yellow_cloud', 'none'];

async function processImage(inputPath, outputPath, pixelSize = 8) {
  console.log(`🔧 Processing image: pixelating and removing background...`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`   📐 Original size: ${metadata.width}x${metadata.height}`);
    
    const smallWidth = Math.floor(metadata.width / pixelSize);
    const smallHeight = Math.floor(metadata.height / pixelSize);
    
    console.log(`   🎨 Pixelating to ${smallWidth}x${smallHeight}, then scaling back...`);
    
    const pixelatedBuffer = await image
      .resize(smallWidth, smallHeight, {
        kernel: 'nearest'
      })
      .resize(metadata.width, metadata.height, {
        kernel: 'nearest'
      })
      .toBuffer();
    
    console.log(`   🎭 Removing white background...`);
    
    const finalImage = await sharp(pixelatedBuffer)
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
    
    console.log(`   💾 Saved processed image: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error processing image:`, error.message);
    throw error;
  }
}

export async function generateFeatures(medName, medDesc) {
  console.log(`🧠 Generating features and reasons for ${medName}...`);
  
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
      feature_1: "none",
      feature_1_reason: "Default feature",
      feature_2: "none",
      feature_2_reason: "Default feature",
      feature_3: "none",
      feature_3_reason: "Default feature"
    };
  }
}

export async function generateCharacterSprite(medData, accountId) {
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
        console.log(`✅ Raw image saved as ${rawFileName}`);
        
        await processImage(rawFileName, finalFileName, 8);
        console.log(`🎮 Sprite saved as ${finalFileName}`);
        
        const base64Image = fs.readFileSync(finalFileName, { encoding: 'base64' });
        const dataUrl = `data:image/png;base64,${base64Image}`;
        
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
