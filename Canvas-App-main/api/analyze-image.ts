import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Call Gemini to analyze the makeup look and extract real aesthetic tags
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        },
        {
          text: "Analyze this makeup look in detail. Return ONLY a valid JSON array of 4 to 6 short, uppercase aesthetic tags describing the style (e.g. ['SOFT GLAM', 'DEWY SKIN', 'GRAPHIC LINER', 'NUDE LIPS', 'BRIDAL']). Do not include markdown formatting or backticks, just the raw JSON array."
        }
      ]
    });

    const textResult = response.text ? response.text.trim() : '[]';
    const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const tags = JSON.parse(cleanJson);

    return res.status(200).json({ tags: Array.isArray(tags) ? tags : ['BRIDAL', 'GLAM'] });

  } catch (error: any) {
    console.error('Gemini Vision Server Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
}