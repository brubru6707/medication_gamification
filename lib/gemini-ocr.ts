import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyBq5m6S2PKJ-DuHCsi72bP5x7PuMYIaDLc"
});

export async function extractMedicationInfo(imageBase64: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract medication information from this image. Return only a JSON object with these exact fields: name (medication name), dosage (dose and frequency), description (brief description), rxNumber (prescription number if visible). If any field cannot be determined, use empty string. Example: {\"name\":\"Ibuprofen\",\"dosage\":\"200mg twice daily\",\"description\":\"Pain reliever\",\"rxNumber\":\"RX123456\"}"
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          name: parsed.name || '',
          dosage: parsed.dosage || '',
          description: parsed.description || '',
          rxNumber: parsed.rxNumber || ''
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }
    }
    
    return { name: '', dosage: '', description: '', rxNumber: '' };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return { name: '', dosage: '', description: '', rxNumber: '' };
  }
}