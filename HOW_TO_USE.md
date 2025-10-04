# 🎮 How to Use Gemini for Image Generation in Your Game

## ✅ Your Setup is Complete!

Your API Key: `AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc`  
Model: `gemini-2.5-flash-image` (Imagen 3)

---

## 🚀 Two Ways to Generate Images

### Method 1: Browser Interface (Easiest!)

1. **Open the image generator:**
   - Double-click `image-generator.html` in your file explorer
   - OR right-click → "Open with" → Your browser

2. **Fill in the form:**
   ```
   Medication Name: Robitussin
   Medication Type: Cough Syrup
   Art Style: Pixel Art
   ```

3. **Click "Generate Character Image"**
   - Wait 10-30 seconds
   - Image will appear on screen
   - Click "Download Image" to save

4. **Save to your project folder:**
   - Images save as `robitussin-character.png`
   - Keep them in the same folder as `index.html`

### Method 2: Node.js Batch Generator

1. **Install dependencies** (one-time setup):
   ```powershell
   npm install
   ```

2. **Edit `generate-image-node.js`** to customize:
   ```javascript
   // Change these to generate different characters:
   await generateMedicationCharacter(
     "YourMedName",      // Medication name
     "pill",             // Type: pill, cough syrup, inhaler, etc.
     "pixel art"         // Style: pixel art, cartoon, chibi
   );
   ```

3. **Run the generator:**
   ```powershell
   npm run generate
   ```

4. **Images will be saved automatically** in your project folder

---

## 🎨 What Images to Generate

### For Your Medication Game:

1. **Main Character** (your primary medication):
   - Name: "Robitussin", "Mucinex", or your med
   - Type: Cough Syrup
   - Style: Pixel Art (works best in games)

2. **Secondary Characters** (power-ups or allies):
   - Name: "Vitamin C", "Albuterol", etc.
   - Type: Pill, Inhaler, etc.
   - Style: Same as main character for consistency

3. **Collectibles** (items to collect):
   - Name: "Health Boost", "Energy Pill"
   - Type: Pill or Capsule
   - Style: Chibi (cute and small)

4. **Environment** (optional):
   - Name: "Medicine Bottle Platform"
   - Type: Custom
   - Style: Flat Design

---

## 🎮 Using Images in Your Phaser Game

### Step 1: Generate Images

Generate at least one character image using either method above.

### Step 2: Update game.js

1. **Open `game.js`**

2. **In the `preload()` function, uncomment:**
   ```javascript
   this.load.image('robitussin', 'robitussin-character.png');
   ```

3. **Comment out the placeholder:**
   ```javascript
   // createPlaceholderGraphics(this);
   ```

### Step 3: Test Your Game

1. **Open `index.html` in your browser**
2. Your Gemini-generated character should appear!
3. Use arrow keys to move

---

## 📝 Prompt Tips for Better Images

### Good Prompts:
✅ "Cute cough syrup character, pixel art, friendly eyes, game sprite"  
✅ "Chibi style pill character with superhero cape"  
✅ "Cartoon inhaler character, bright colors, welcoming smile"

### Avoid:
❌ Too complex descriptions  
❌ Realistic medical imagery  
❌ Dark or scary themes  

The code already includes optimized prompts, but you can customize them in:
- `gemini-config.js` (browser version)
- `generate-image-node.js` (Node.js version)

---

## 🔧 Troubleshooting

### "API key not valid"
- Your key is already set correctly
- Check internet connection
- Verify the key hasn't been rate-limited

### "No image generated"
- Model might be busy, try again in a few minutes
- Check if image generation is available in your region
- Look at browser console (F12) for detailed errors

### Image is too big/small in game
Adjust the scale in `game.js`:
```javascript
character.setScale(0.3); // Change this number (0.1-1.0)
```

### CORS errors in browser
- Use the Node.js method instead
- Or install Live Server extension in VS Code

---

## 💡 Advanced: Dynamic Content Generation

You can use Gemini to generate more than just images!

### Generate encouragement messages:
```javascript
// In gemini-config.js, add:
async function generateEncouragement(medicationName) {
    const prompt = `Generate a short, positive encouragement message for someone taking ${medicationName}. Keep it under 20 words and make it motivating.`;
    // ... API call
}
```

### Generate game challenges:
```javascript
async function generateDailyChallenge() {
    const prompt = `Create a fun, simple medication adherence challenge for today. Make it achievable and positive.`;
    // ... API call
}
```

---

## 📊 API Usage & Limits

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day

**Tips:**
- Generate images in batches (use Node.js method)
- Cache generated images (don't regenerate each time)
- Use placeholder graphics during development

---

## 🎯 Complete Workflow

1. ✅ Generate character images (done via browser or Node.js)
2. ✅ Save images to project folder
3. ✅ Update `game.js` to load your images
4. ✅ Open `index.html` to test
5. ✅ Adjust character size/position as needed
6. ✅ Generate more assets (platforms, collectibles)
7. ✅ Add game logic (scoring, challenges)
8. ✅ Use Gemini for dynamic text content

---

## 🚀 You're Ready!

Your project is fully set up with:
- ✅ Gemini API configured
- ✅ Browser-based image generator
- ✅ Node.js batch generator
- ✅ Working Phaser game template
- ✅ Example code and documentation

**Next:** Generate your first character image and see it in the game! 🎮

Questions? Check:
- `QUICK_START.md` - Quick reference
- `GEMINI_SETUP_GUIDE.md` - Detailed API docs
- `README.md` - Project overview
