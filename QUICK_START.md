# 🚀 Quick Test Guide

## Your API Key is Already Set Up! ✅
API Key: AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc

---

## Method 1: Browser Test (EASIEST!) 🌐

1. **Open `image-generator.html` in your browser:**
   - Right-click on `image-generator.html` in VS Code
   - Select "Open with Live Server" (if you have it)
   - OR just double-click the file to open in your default browser

2. **Generate an image:**
   - Enter: "Robitussin" in the medication name
   - Select: "Cough Syrup"
   - Choose: "Pixel Art"
   - Click: "Generate Character Image"
   - Wait 10-30 seconds
   - Download your image!

---

## Method 2: Node.js Test (For Batch Generation) 💻

1. **Install Node.js dependencies:**
   ```powershell
   npm install
   ```

2. **Run the generator:**
   ```powershell
   npm run generate
   ```

3. **Check your folder for:**
   - `robitussin-character.png`
   - `albuterol-character.png`
   - `vitamin-c-character.png`

---

## Troubleshooting 🔧

### Browser: "API key not valid"
- The API key is already set in `gemini-config.js`
- Make sure you're connected to the internet
- Check browser console (F12) for errors

### Browser: CORS Error
- This is normal! The API might have CORS restrictions
- Try the Node.js method instead
- OR use a local server (Live Server extension)

### Node.js: "Cannot find module"
- Run: `npm install` first
- Make sure you have Node.js installed

### "Image generation not available"
- Gemini image generation might have regional restrictions
- Check if the model is available in your region
- Try waiting and retrying (API might be busy)

---

## What You Can Do Now 🎨

### 1. Generate Different Styles
Try these combinations:
- "Mucinex" + "Cough Syrup" + "Cartoon"
- "Advil" + "Pill" + "Chibi Style"
- "Flonase" + "Nasal Spray" + "Pixel Art"

### 2. Use in Your Phaser Game
Once you have images, add to `game.js`:

```javascript
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Load your generated character
    this.load.image('robitussin', 'robitussin-character.png');
}

function create() {
    // Add to game
    const character = this.add.image(400, 300, 'robitussin');
    character.setScale(0.5); // Adjust size as needed
}
```

### 3. Create Sprite Sheets
- Generate multiple angles/poses
- Use tools like TexturePacker to create sprite sheets
- Animate in Phaser!

---

## Examples to Try 💡

### Cough Medicine Characters:
- Robitussin (Cough Syrup)
- Mucinex (Pill)
- Delsym (Cough Syrup)

### Allergy Medicine:
- Claritin (Tablet)
- Zyrtec (Pill)
- Flonase (Nasal Spray)

### Respiratory:
- Albuterol (Inhaler)
- Symbicort (Inhaler)

---

## Next Steps 🎯

1. ✅ Test browser version NOW
2. ✅ Generate 3-5 character images
3. ✅ Update `game.js` with your game logic
4. ✅ Build your medication gamification app!

---

## Support 💬

If something doesn't work:
1. Check browser console (F12)
2. Verify internet connection
3. Make sure API key is correct
4. Try Node.js version instead

**Your API is configured and ready to go!** 🚀
