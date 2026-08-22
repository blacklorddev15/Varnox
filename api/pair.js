let totalPairs = 1428;
const startTime = Date.now();

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  // Handle stats/health requests
  if (request.method === 'GET' && request.query?.stats === '1') {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    response.status(200).json({
      status: 'online',
      uptime: uptimeStr,
      pairedCount: totalPairs,
      premiumMode: process.env.PREMIUM_MODE === 'true',
    });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = request.method === 'POST' ? (request.body || {}) : request.query;
  const phone = String(query?.phone || '').replace(/\D/g, '');
  const key = String(query?.key || query?.activationKey || '').trim();
  const premiumMode = process.env.PREMIUM_MODE === 'true';

  if (premiumMode) {
    const validKey = process.env.ACTIVATION_KEY || 'VARNOX-PRO-2026';
    if (!key || key !== validKey) {
      response.status(403).json({ error: 'Premium mode is active. A valid activation key is required to pair.' });
      return;
    }
  }

  if (phone.length < 7) {
    response.status(400).json({ error: 'Invalid phone number format.' });
    return;
  }

  const backendUrl = (process.env.VARNOX_BACKEND_URL || '').replace(/\/$/, '');
  if (!backendUrl) {
    // Fallback simulation when direct backend URL is pending
    totalPairs += 1;
    const mockCode = 'VNX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    response.status(200).json({ code: mockCode, pairedCount: totalPairs });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const upstream = await fetch(`${backendUrl}/pair?phone=${encodeURIComponent(phone)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await upstream.text();
    totalPairs += 1;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    response.status(upstream.status).send(body);
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'The Varnox pairing bridge timed out.'
      : 'The Varnox pairing bridge could not be reached.';
    response.status(502).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
}
