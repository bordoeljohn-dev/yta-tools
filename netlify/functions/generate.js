exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    const key = process.env.GEMINI_API_KEY;

    if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
    if (!key) return { statusCode: 500, headers, body: JSON.stringify({ error: 'API configuration missing' }) };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.85 }
      })
    });

    const data = await resp.json();

    // Check for API-level errors
    if (!resp.ok) {
      return { 
        statusCode: resp.status, 
        headers, 
        body: JSON.stringify({ error: data.error?.message || 'API request failed' }) 
      };
    }

    // Extract text safely
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ result: '', notice: 'No response generated (check safety filters).' }) 
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ result: text }) };

  } catch (err) {
    console.error('Function Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
