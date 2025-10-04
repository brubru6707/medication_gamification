"# Medication Gamification

Generate cute, friendly medication character images using Google's Gemini AI (Imagen 3).

## 🚀 Quick Start

### Option 1: Browser-Based (Easiest)

1. Open `image-generator.html` in your web browser
2. Enter medication name and select type/style
3. Click "Generate Character Image"
4. Download your generated image!

**No installation required!** ✨

### Option 2: Node.js Script (Batch Generation)

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the generator:**
   ```bash
   npm run generate
   ```

4. **Customize:** Edit `generate-image-node.js` to generate different characters

## 🎨 Features

- ✅ **Native Image Generation** using Gemini 2.5 Flash Image model
- ✅ **Multiple Art Styles**: Pixel art, cartoon, chibi, flat design
- ✅ **Instant Downloads** of generated images
- ✅ **Browser & Node.js** support
- ✅ **Customizable** prompts for different medication types

## 📁 Files

- `image-generator.html` - Web interface for image generation
- `generate-image-node.js` - Node.js script for batch generation
- `gemini-config.js` - API configuration (browser version)
- `package.json` - Node.js dependencies
- `GEMINI_SETUP_GUIDE.md` - Detailed setup instructions

## 🔑 API Key

Your API key is already configured in the files!

**⚠️ Security Note:** For production apps, move API keys to environment variables!

## 🎮 Use in Your Game

### Example: Load generated image in Phaser.js

```javascript
// In your game.js
function preload() {
    this.load.image('robitussin', 'robitussin-character.png');
}

function create() {
    this.add.image(400, 300, 'robitussin');
}
```

## 🎯 Next Steps

1. ✅ Generate character images
2. ✅ Integrate into your Phaser.js game
3. ✅ Build your medication adherence game!

Happy generating! 🚀
" 
