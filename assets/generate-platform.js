// Simple colored rectangles as platform placeholders until you generate better ones
// You can replace these with Gemini-generated platform images later

const platformCanvas = document.createElement('canvas');
platformCanvas.width = 400;
platformCanvas.height = 32;
const ctx = platformCanvas.getContext('2d');

// Create a simple green platform
ctx.fillStyle = '#00AA00';
ctx.fillRect(0, 0, 400, 32);
ctx.strokeStyle = '#008800';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, 400, 32);

// Convert to base64 and create downloadable image
const platformDataUrl = platformCanvas.toDataURL('image/png');

// You can use this in your Phaser game's preload:
// this.textures.addBase64('platform', platformDataUrl);
