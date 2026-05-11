exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) };

  const { action, videoId, days = 28 } = event.queryStringParameters || {};
  const base = 'https://www.googleapis.com/youtube/v3';
  const aBase = 'https://youtubeanalytics.googleapis.com/v2';
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  try {
    // ── Channel info ──────────────────────────────────────
    if (action === 'channel') {
      const r = await fetch(`${base}/channels?part=snippet,statistics,brandingSettings&mine=true`, auth);
      const d = await r.json();
      const ch = d.items?.[0];
      if (!ch) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Channel not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify({
        id: ch.id,
        name: ch.snippet.title,
        thumbnail: ch.snippet.thumbnails?.default?.url,
        customUrl: ch.snippet.customUrl,
        stats: {
          subscribers: ch.statistics.subscriberCount,
          views: ch.statistics.viewCount,
          videos: ch.statistics.videoCount
        }
      })};
    }

    // ── Video list ────────────────────────────────────────
    if (action === 'videos') {
      const chR = await fetch(`${base}/channels?part=contentDetails&mine=true`, auth);
      const chD = await chR.json();
      const pid = chD.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!pid) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No uploads playlist' }) };

      const plR = await fetch(`${base}/playlistItems?part=contentDetails&playlistId=${pid}&maxResults=20`, auth);
      const plD = await plR.json();
      const ids = plD.items?.map(i => i.contentDetails.videoId).join(',');

      const vR = await fetch(`${base}/videos?part=snippet,statistics,contentDetails&id=${ids}`, auth);
      const vD = await vR.json();

      const videos = vD.items?.map(v => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        publishedAt: v.snippet.publishedAt,
        duration: v.contentDetails.duration,
        stats: {
          views: v.statistics.viewCount || 0,
          likes: v.statistics.likeCount || 0,
          comments: v.statistics.commentCount || 0
        }
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ videos, total: plD.pageInfo?.totalResults }) };
    }

    // ── Overview analytics ────────────────────────────────
    if (action === 'analytics') {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [ovR, trR, tvR] = await Promise.all([
        fetch(`${aBase}/reports?ids=channel%3D%3DMINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost&dimensions=day&sort=day`, auth),
        fetch(`${aBase}/reports?ids=channel%3D%3DMINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched&dimensions=insightTrafficSourceType&sort=-views&maxResults=8`, auth),
        fetch(`${aBase}/reports?ids=channel%3D%3DMINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained&dimensions=video&sort=-views&maxResults=10`, auth)
      ]);

      const [ovD, trD, tvD] = await Promise.all([ovR.json(), trR.json(), tvR.json()]);

      return { statusCode: 200, headers, body: JSON.stringify({
        period: { start, end, days },
        daily: { headers: ovD.columnHeaders?.map(h => h.name), rows: ovD.rows || [] },
        traffic: { headers: trD.columnHeaders?.map(h => h.name), rows: trD.rows || [] },
        topVideos: { headers: tvD.columnHeaders?.map(h => h.name), rows: tvD.rows || [] }
      })};
    }

    // ── Per-video analytics ───────────────────────────────
    if (action === 'video-analytics' && videoId) {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const f = `video%3D%3D${videoId}`;

      const [mR, tR] = await Promise.all([
        fetch(`${aBase}/reports?ids=channel%3D%3DMINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained&filters=${f}&dimensions=day&sort=day`, auth),
        fetch(`${aBase}/reports?ids=channel%3D%3DMINE&startDate=${start}&endDate=${end}&metrics=views&dimensions=insightTrafficSourceType&filters=${f}&sort=-views`, auth)
      ]);
      const [mD, tD] = await Promise.all([mR.json(), tR.json()]);

      return { statusCode: 200, headers, body: JSON.stringify({
        videoId, period: { start, end },
        daily: { headers: mD.columnHeaders?.map(h => h.name), rows: mD.rows || [] },
        traffic: { headers: tD.columnHeaders?.map(h => h.name), rows: tD.rows || [] }
      })};
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
