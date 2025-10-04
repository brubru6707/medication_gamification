// Gemini API Configuration
// Get your API key from: https://makersuite.google.com/app/apikey

const GEMINI_API_KEY = 'AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc'; // Your actual API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'; // Image generation model

/**
 * Generate actual images using Gemini's native image generation (Imagen 3)
 * @param {string} medicationName - Name of the medication
 * @param {string} medicationType - Type (e.g., "cough syrup", "pill", "inhaler")
 * @param {string} artStyle - Art style preference
 * @returns {Promise<string>} - Base64 encoded image data
 */
async function generateMedicationImage(medicationName, medicationType, artStyle = 'pixel art') {
    const prompt = `Create a picture of a cute, friendly game character for Medication Gamification game. The character is based on ${medicationType} medication called "${medicationName}". Style: ${artStyle}. The character should have:
    - Bright, cheerful colors
    - Big friendly eyes
    - Welcoming smile
    - Game-ready design (sprite-like)
    - Health/wellness themed
    - Professional but playful
    Make it suitable for a medication adherence gamification app.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        
        // Log the full response for debugging
        console.log('API Response:', data);
        
        // Check for rate limit error
        if (response.status === 429) {
            throw new Error('Rate limit exceeded! Please wait a minute and try again. Free tier: 60 requests/minute, 1,500/day.');
        }
        
        // Check for other errors
        if (data.error) {
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        if (data.candidates && data.candidates[0]) {
            // Check for both text and image data
            for (const part of data.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return {
                        imageData: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'image/png'
                    };
                }
            }
            
            // If no image, check if there's text (might be a prompt instead)
            for (const part of data.candidates[0].content.parts) {
                if (part.text) {
                    console.warn('Received text instead of image:', part.text);
                    throw new Error('Image generation not available. Model returned text description instead. Try using the Node.js method or wait for API access.');
                }
            }
            
            throw new Error('No image data in response. The model might not support image generation yet.');
        } else {
            throw new Error('No response from Gemini API. Check console for details.');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

/**
 * Generate game mechanics ideas using Gemini
 * @param {string} medicationType - Type of medication
 * @returns {Promise<string>} - Generated game mechanics
 */
async function generateGameMechanics(medicationType) {
    const prompt = `Generate creative game mechanics for a medication gamification app featuring ${medicationType}. 
    
    Include:
    - 3 unique power-ups or abilities
    - 2 mini-game ideas
    - Reward system suggestions
    
    Keep it fun, educational, and encourage medication adherence. Format as JSON.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No response from Gemini API');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

/**
 * FALLBACK: Generate detailed image description (if image generation fails)
 * Use this description with DALL-E, Midjourney, or Stable Diffusion
 */
async function generateImageDescription(medicationName, medicationType, artStyle = 'pixel art') {
    const prompt = `Create a detailed, vivid description for an AI image generator to create a cute, friendly game character. The character is based on ${medicationType} medication called "${medicationName}". Art style: ${artStyle}.

Include specific details about:
- Exact colors (use hex codes or specific color names)
- Shape and proportions
- Facial features (eyes, mouth, expression)
- Any accessories or decorative elements
- Pose and positioning
- Background or effects
- Overall mood and personality

Make it detailed enough for an image AI like DALL-E or Midjourney to create exactly what we want. Keep it game-appropriate, friendly, and health-themed.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        
        if (response.status === 429) {
            throw new Error('Rate limit exceeded! Please wait 60 seconds and try again.');
        }
        
        if (data.error) {
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        if (data.candidates && data.candidates[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No response from Gemini API');
        }
    } catch (error) {
        console.error('Error generating description:', error);
        throw error;
    }
}
