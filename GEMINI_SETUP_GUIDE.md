# 🤖 Gemini API Setup Guide

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 2: Add Your API Key

Open `gemini-config.js` and replace:
```javascript
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

With your actual key:
```javascript
const GEMINI_API_KEY = 'AIzaSyC...your-actual-key...';
```

## Step 3: Test the Image Generator

1. Open `image-generator.html` in your browser
2. Enter a medication name (e.g., "Robitussin")
3. Select the type and art style
4. Click "Generate Character Description"
5. Copy the generated description

## Step 4: Generate Actual Images

### Option A: Use DALL-E (OpenAI)
1. Go to [ChatGPT](https://chat.openai.com/) with DALL-E access
2. Paste the description from Gemini
3. Add: "Create this as an image"

### Option B: Use Stable Diffusion
1. Go to [DreamStudio](https://beta.dreamstudio.ai/)
2. Paste the description
3. Generate images

### Option C: Use Midjourney
1. Join [Midjourney Discord](https://discord.gg/midjourney)
2. Use `/imagine` command with the description

## How Gemini Helps

✅ **What Gemini CAN do:**
- Generate creative character descriptions
- Create game mechanics ideas
- Design personality traits for medication characters
- Suggest visual styles and themes
- Generate story elements

❌ **What Gemini CANNOT do (yet):**
- Directly generate images (use Imagen/Vertex AI for that)
- Create actual sprite sheets
- Generate pixel art programmatically

## Using Gemini in Your Game

You can use Gemini to:

1. **Generate Dynamic Content:**
```javascript
// Generate personalized encouragement messages
async function getEncouragementMessage(medicationName) {
    const prompt = `Generate a short, encouraging message for taking ${medicationName}. Keep it positive and supportive. Max 20 words.`;
    // Call Gemini API...
}
```

2. **Create Character Backstories:**
```javascript
// Generate fun character lore
async function generateCharacterStory(character) {
    const prompt = `Create a fun, short backstory for a game character named ${character}. Make it medication-themed but playful.`;
    // Call Gemini API...
}
```

3. **Adaptive Game Difficulty:**
```javascript
// Generate challenge ideas based on user progress
async function generateChallenge(userLevel) {
    const prompt = `Create a fun medication adherence challenge for level ${userLevel}...`;
    // Call Gemini API...
}
```

## API Limits (Free Tier)

- **60 requests per minute**
- **1,500 requests per day**
- Keep this in mind when designing your game

## Security Best Practices

⚠️ **IMPORTANT:** Never expose your API key in production!

For production apps:
1. Create a backend server (Node.js, Python, etc.)
2. Store API key in environment variables
3. Make API calls from backend only
4. Your frontend calls your backend

Example backend (Node.js):
```javascript
// server.js
const express = require('express');
const app = express();
require('dotenv').config();

app.post('/api/generate-prompt', async (req, res) => {
    // Use process.env.GEMINI_API_KEY here
    // Call Gemini API
    // Return result
});
```

## Troubleshooting

### Error: "API key not valid"
- Check that you copied the entire key
- Make sure there are no extra spaces
- Verify the key is active in Google AI Studio

### Error: "429 Too Many Requests"
- You've hit the rate limit
- Wait a minute and try again
- Consider implementing request throttling

### Error: "CORS policy"
- This is normal for browser-based apps
- For production, use a backend server
- Or use a CORS proxy (not recommended for production)

## Next Steps

1. ✅ Set up your API key
2. ✅ Test the image generator
3. ✅ Generate character descriptions
4. ✅ Use descriptions to create actual images
5. ✅ Integrate dynamic content in your game

Happy coding! 🚀
