import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";

// Your Gemini API Key
const GEMINI_API_KEY = "AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc";

/**
 * Process image: pixelate and remove white background
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to output image
 * @param {number} pixelSize - Size of pixels for pixelation (default: 8)
 */
async function processImage(inputPath, outputPath, pixelSize = 8) {
  console.log(`🔧 Processing image: pixelating and removing background...`);
  
  try {
    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Step 1: Pixelate the image
    console.log(`   📐 Original size: ${metadata.width}x${metadata.height}`);
    
    // Calculate pixelated size
    const smallWidth = Math.floor(metadata.width / pixelSize);
    const smallHeight = Math.floor(metadata.height / pixelSize);
    
    console.log(`   🎨 Pixelating to ${smallWidth}x${smallHeight}, then scaling back...`);
    
    // Resize down then up to create pixelation effect
    const pixelatedBuffer = await image
      .resize(smallWidth, smallHeight, {
        kernel: 'nearest'  // Use nearest neighbor for sharp pixel edges
      })
      .resize(metadata.width, metadata.height, {
        kernel: 'nearest'  // Keep it pixelated when scaling back up
      })
      .toBuffer();
    
    // Step 2: Remove white background (make it transparent)
    console.log(`   🎭 Removing white background...`);
    
    const finalImage = await sharp(pixelatedBuffer)
      .removeAlpha() // Remove any existing alpha
      .ensureAlpha() // Add alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Process pixels to make white transparent
    const { data, info } = finalImage;
    const pixels = new Uint8Array(data);
    
    // Threshold for "whiteness" (pixels close to white become transparent)
    const whiteThreshold = 240; // Adjust if needed (0-255)
    let pixelsChanged = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // If pixel is close to white, make it transparent
      if (r > whiteThreshold && g > whiteThreshold && b > whiteThreshold) {
        pixels[i + 3] = 0; // Set alpha to 0 (transparent)
        pixelsChanged++;
      }
    }
    
    console.log(`   ✅ Made ${Math.floor(pixelsChanged / 4)} pixels transparent`);
    
    // Save the final image
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

/**
 * Generate a medication character image using Gemini native image generation
 * @param {string} medicationName - Name of the medication
 * @param {string} medicationType - Type (e.g., "cough syrup", "pill", "inhaler")
 * @param {string} artStyle - Desired art style
 */
async function generateMedicationCharacter(medicationName, medicationType, artStyle = "pixel art") {
  console.log(`🎨 Generating ${artStyle} character for ${medicationName} (${medicationType})...`);
  
  // Initialize the GoogleGenAI client - EXACTLY like your example!
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  // Enhanced prompt for white background and clean sprite design
  const prompt = `Create a pixel art game sprite character based on ${medicationType} medication called "${medicationName}".

CRITICAL REQUIREMENTS:
- Pure WHITE background (#FFFFFF) - absolutely no shadows, gradients, or colors in the background
- Clean, simple 8-bit/16-bit pixel art style
- Character centered in the image
- No background objects or decorations
- Character should be clearly separated from the white background
- High contrast colors on the character itself

CHARACTER DESIGN:
- Cute, friendly, and welcoming appearance
- Big expressive eyes with clear outlines
- Warm smile or friendly expression
- Bright, saturated colors (NOT pastel)
- Clear black outlines around character features
- Simple, game-ready sprite design
- Health/wellness themed but playful
- Approximately 64x64 to 128x128 pixel size appearance

STYLE: Retro 8-bit video game sprite, like from NES or SNES era games. Think Mario, Kirby, or Pokemon style - simple, iconic, and clean.`;


  try {
    // Generate content - EXACTLY like your example!
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    let imageSaved = false;

    // Process the response - EXACTLY like your example!
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log("📝 Description:", part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        // Create filenames
        const baseName = medicationName.toLowerCase().replace(/\s+/g, '-');
        const rawFileName = `${baseName}-raw.png`;
        const finalFileName = `${baseName}-sprite.png`;
        
        // Save raw image first
        fs.writeFileSync(rawFileName, buffer);
        console.log(`✅ Raw image saved as ${rawFileName}`);
        
        // Process the image: pixelate and remove background
        await processImage(rawFileName, finalFileName, 8); // 8 = pixel size for 8-bit effect
        
        console.log(`🎮 Game-ready sprite saved as ${finalFileName}`);
        imageSaved = true;
      }
    }

    if (!imageSaved) {
      console.log("⚠️  No image was generated. The API may have returned only text.");
      console.log("💡 This usually means:");
      console.log("   1. The image model isn't available yet in your region");
      console.log("   2. You need special access to image generation");
      console.log("   3. The model returned a description instead");
    }
  } catch (error) {
    console.error("❌ Error generating image:", error.message);
    
    if (error.message.includes('429')) {
      console.log("\n⏱️  Rate Limit Hit! Wait 60 seconds and try again.");
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      console.log("\n🔒 Model not available. Try these alternatives:");
      console.log("   • Use text generation for descriptions");
      console.log("   • Wait for model access");
      console.log("   • Check Google AI Studio for model availability");
    }
    
    throw error;
  }
}

/**
 * Main function - Edit this to generate your characters
 */
async function main() {
  console.log("🚀 Medication Gamification - Image Generator");
  console.log("============================================\n");

  // Example 1: Cough Medicine Character
  await generateMedicationCharacter(
    "Robitussin",
    "cough syrup",
    "pixel art"
  );

  console.log("\n---\n");

  // Example 2: Inhaler Character
  await generateMedicationCharacter(
    "Albuterol",
    "inhaler",
    "cartoon style"
  );

  console.log("\n---\n");

  // Example 3: Pill Character
  await generateMedicationCharacter(
    "Vitamin C",
    "pill",
    "chibi style"
  );

  console.log("\n✨ All images generated successfully!");
  console.log("Check your current directory for the PNG files.");
}

// Run the main function
main().catch(console.error);
