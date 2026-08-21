export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const backendUrl = (process.env.VARNOX_BACKEND_URL || '').replace(/\/$/, '');
  if (!backendUrl) {
    response.status(503).json({ error: 'Varnox backend URL is not configured.' });
    return;
  }

  const phone = String(request.query?.phone || '').replace(/\D/g, '');
  if (phone.length < 7) {
    response.status(400).json({ error: 'Invalid phone number format.' });
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
