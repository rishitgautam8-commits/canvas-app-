import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Required to allow your React frontend to communicate with this backend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze the makeup aesthetic in this image. Return exactly 5 descriptive tags for the style (e.g., 'Dewy Skin', 'Heavy Glam', 'Minimalist', 'Smokey Eye'). Return ONLY a comma-separated list of the 5 tags, nothing else." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        max_tokens: 50
      })
    })

    const data = await response.json()
    const tagsString = data.choices[0].message.content
    const tagsArray = tagsString.split(',').map((tag: string) => tag.trim().toLowerCase())

    return new Response(JSON.stringify({ tags: tagsArray }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})