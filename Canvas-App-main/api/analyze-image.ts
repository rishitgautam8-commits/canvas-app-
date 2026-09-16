export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  // SAFETY FIX: Strip data URL prefix if the frontend sent it by accident
  if (imageBase64.includes('base64,')) {
    imageBase64 = imageBase64.split('base64,')[1];
  }
  
  // Use globalThis cast to satisfy TypeScript's node types
  const env = (globalThis as any).process?.env || {};
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Analyze this makeup portfolio photo. Return a strict JSON array of 4 to 6 concise, uppercase aesthetic tags relevant to the makeup style (e.g., BRIDAL, SOFT GLAM, SATIN FINISH, WARM TONES, AIRBRUSH, SMOKEY EYE, SOUTH INDIAN, TELUGU BRIDAL, GLASS SKIN, DEWY FINISH, SHIMMER EYES, BOLD LIP). Return ONLY a raw JSON array of strings, with no markdown formatting like ```json or extra text.'
              },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return res.status(502).json({ error: 'Gemini API request failed' });
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';
    
    const cleanedJSON = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedTags = JSON.parse(cleanedJSON);

    return res.status(200).json({ tags: parsedTags });
  } catch (error) {
    console.error('Server vision analysis error:', error);
    return res.status(500).json({ error: 'Internal server error during image analysis' });
  }
}