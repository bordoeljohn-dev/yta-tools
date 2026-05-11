// Initiates a YouTube resumable upload and returns the upload URL
// The actual file upload happens from the client to avoid function timeout limits
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token provided' }) };

  try {
    const { title, description, tags, categoryId = '22', privacyStatus = 'public', madeForKids = false, fileSize, mimeType = 'video/mp4' } = JSON.parse(event.body || '{}');

    if (!title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Title is required' }) };

    const metadata = {
      snippet: {
        title,
        description: description || '',
        tags: tags || [],
        categoryId
      },
      status: {
        privacyStatus,
        madeForKids,
        selfDeclaredMadeForKids: madeForKids
      }
    };

    // Initiate resumable upload session
    const initResp = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          ...(fileSize ? { 'X-Upload-Content-Length': String(fileSize) } : {})
        },
        body: JSON.stringify(metadata)
      }
    );

    if (!initResp.ok) {
      const errData = await initResp.json();
      throw new Error(errData.error?.message || `HTTP ${initResp.status}`);
    }

    // The upload URI is in the Location header
    const uploadUri = initResp.headers.get('location');
    return { statusCode: 200, headers, body: JSON.stringify({ uploadUri, message: 'Upload session created. Use uploadUri to upload the file.' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
