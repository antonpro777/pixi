const webpush = require('web-push');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!supabaseUrl || !anonKey || !publicKey || !privateKey || !subject) {
    return res.status(503).json({ error: 'Push service is not configured' });
  }
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const accessToken = authorization.slice(7);
  try {
    const authResponse = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + accessToken }
    });
    if (!authResponse.ok) return res.status(401).json({ error: 'Invalid session' });
    const rpcResponse = await fetch(supabaseUrl + '/rest/v1/rpc/get_push_targets_for_announcement', {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    if (!rpcResponse.ok) {
      const detail = await rpcResponse.text();
      console.error('Announcement push target lookup failed:', rpcResponse.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'Could not load push subscriptions' });
    }
    const subscriptions = await rpcResponse.json();
    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(200).json({ sent: 0, failed: 0, message: 'No subscribed devices' });
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const payload = JSON.stringify({
      type: 'announcement',
      title: 'Новое обновление PIXY',
      body: 'В PIXY вышло новое обновление. Открой приложение и посмотри, что нового!',
      tag: 'update-2026-11',
      url: '/'
    });
    const results = await Promise.allSettled(
      subscriptions.map(subscription => webpush.sendNotification(subscription, payload, { TTL: 86400, urgency: 'normal' }))
    );
    const sent = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - sent;
    if (failed) console.warn('Some PIXY announcement pushes failed:', failed);
    return res.status(200).json({ sent, failed });
  } catch (error) {
    console.error('PIXY announcement push error:', error);
    return res.status(500).json({ error: 'Push delivery failed' });
  }
};