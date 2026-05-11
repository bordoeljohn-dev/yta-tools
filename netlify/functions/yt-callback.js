exports.handler = async (event) => {
  const { code, error } = event.queryStringParameters || {};
  const origin = process.env.URL || 'http://localhost:8888';

  if (error) return { statusCode: 302, headers: { Location: `${origin}/?error=${encodeURIComponent(error)}` }, body: '' };
  if (!code) return { statusCode: 302, headers: { Location: `${origin}/?error=no_code` }, body: '' };

  try {
    const redirect = process.env.GOOGLE_REDIRECT_URI || `${origin}/auth/callback`;

    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect,
        grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenResp.json();
    if (tokens.error) return { statusCode: 302, headers: { Location: `${origin}/?error=${encodeURIComponent(tokens.error_description || tokens.error)}` }, body: '' };

    // Get user profile
    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await profileResp.json();

    // Pass tokens to frontend via URL fragment (safe for SPA)
    const payload = encodeURIComponent(JSON.stringify({ tokens, profile }));
    return {
      statusCode: 302,
      headers: { Location: `${origin}/?auth=${payload}` },
      body: ''
    };
  } catch (err) {
    return { statusCode: 302, headers: { Location: `${origin}/?error=${encodeURIComponent(err.message)}` }, body: '' };
  }
};
