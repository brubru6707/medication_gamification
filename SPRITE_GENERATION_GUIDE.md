# Automatic Sprite Generation Setup

## How It Works Now

When you load the game in your browser:

1. **Browser** checks Firebase for a monster
2. If the monster **has no sprite** (`sprite_url` is empty)
3. **Browser automatically calls the backend server**
4. **Backend (Node.js)** generates:
   - AI-powered features (using Gemini)
   - AI-generated sprite image (using Gemini Image)
   - Processes the image (removes white background)
5. **Backend saves everything to Firebase**
6. **Browser reloads** and shows the new sprite!

## Setup Instructions

### Step 1: Start the Backend Server

Open a PowerShell terminal and run:

```powershell
npm run server
```

You should see:
```
🚀 Sprite Generation Server running on http://localhost:3000
📡 Endpoint: POST http://localhost:3000/generate-sprite
```

**Keep this terminal open!** The server needs to stay running.

### Step 2: Open the Game

Open `index.html` in your browser (using Live Server or file:///)

### Step 3: Watch the Magic ✨

- If a monster has no sprite, you'll see:
  ```
  ⚠️  Monster found but sprite is missing!
  🎨 Requesting AI sprite generation from backend...
  ```

- The backend will generate the sprite (takes 10-30 seconds)

- The page will automatically reload with the new sprite!

## Troubleshooting

### Error: "Failed to connect to backend"

**Problem:** The backend server isn't running.

**Solution:** Run `npm run server` in a separate terminal.

### Error: "Rate limit exceeded"

**Problem:** Too many Gemini API requests.

**Solution:** Wait 60 seconds and refresh the page.

### Sprite doesn't appear

**Problem:** Check the browser console for errors.

**Solution:** 
1. Make sure Firebase config is correct
2. Check that the backend server is running
3. Look for error messages in both browser console and server terminal

## Manual Generation (Alternative)

If you prefer to generate sprites manually:

```powershell
node add-random-monster.js
```

This will generate one random monster with AI sprite and save it to Firebase.

## Architecture

```
Browser (index.html)
    ↓
Firebase (check for monster)
    ↓
Missing sprite?
    ↓
Backend Server (localhost:3000)
    ↓
Gemini AI (generate features + sprite)
    ↓
Firebase (save monster with sprite)
    ↓
Browser (reload with new sprite)
```
