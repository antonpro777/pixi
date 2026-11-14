module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Announcement publisher is not configured' });
  try {
    const response = await fetch(url + '/rest/v1/rpc/publish_due_pixy_announcements', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: '{}'
    });
    const detail = await response.text();
    if (!response.ok) {
      console.error('PIXY scheduled announcement failed:', response.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'Could not publish announcement' });
    }
    return res.status(200).json({ published: Number(detail) || 0 });
  } catch (error) {
    console.error('PIXY announcement cron error:', error);
    return res.status(500).json({ error: 'Announcement publishing failed' });
  }
};
