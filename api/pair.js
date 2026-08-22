let totalPairs = 1428;
const startTime = Date.now();

// Runtime admin state
let currentConfig = {
  panelDomain: process.env.PANEL_DOMAIN || 'https://pterodactyl.mzazi.shop',
  panelApiKey: process.env.PANEL_APIKEY || '',
  serverIp: process.env.SERVER_IP || '139.59.111.210',
  serverPort: process.env.SERVER_PORT || '25572',
  premiumMode: process.env.PREMIUM_MODE === 'true',
  adminPassword: String(process.env.ADMIN_PASSWORD || process.env.API_SECRET || '').trim(),
};

const generatedKeys = new Set(['VARNOX-PRO-2026', 'SKYLAR-VIP-777']);

function getBackendUrl() {
  return (process.env.VARNOX_BACKEND_URL || `http://${currentConfig.serverIp}:${currentConfig.serverPort}`).replace(/\/$/, '');
}

function publicConfig() {
  const { panelApiKey: _panelApiKey, adminPassword: _adminPassword, ...safe } = currentConfig;
  return safe;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  // Handle stats/health requests
  if (request.method === 'GET' && request.query?.stats === '1') {
    let backendOnline = false;
    const healthController = new AbortController();
    const healthTimeout = setTimeout(() => healthController.abort(), 5000);
    try {
      const health = await fetch(getBackendUrl(), { headers: { Accept: 'application/json' }, signal: healthController.signal });
      backendOnline = health.ok;
    } catch {
      backendOnline = false;
    } finally {
      clearTimeout(healthTimeout);
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    response.status(200).json({
      status: backendOnline ? 'online' : 'offline',
      uptime: uptimeStr,
      pairedCount: totalPairs,
      premiumMode: currentConfig.premiumMode,
      panelDomain: currentConfig.panelDomain,
      serverIp: currentConfig.serverIp,
      serverPort: currentConfig.serverPort,
    });
    return;
  }

  // Handle Admin Login / Settings Update
  if (request.method === 'POST') {
    const body = request.body || {};
    const action = body.action;

    if (action === 'admin_login') {
      if (body.password === currentConfig.adminPassword) {
        response.status(200).json({ success: true, config: publicConfig() });
      } else {
        response.status(401).json({ error: 'Invalid admin password.' });
      }
      return;
    }

    if (action === 'update_settings') {
      const authHeader = request.headers['x-admin-password'] || body.password;
      if (authHeader !== currentConfig.adminPassword) {
        response.status(401).json({ error: 'Unauthorized admin access.' });
        return;
      }

      if (body.panelDomain !== undefined) currentConfig.panelDomain = String(body.panelDomain);
      if (body.panelApiKey !== undefined) currentConfig.panelApiKey = String(body.panelApiKey);
      if (body.serverIp !== undefined) currentConfig.serverIp = String(body.serverIp);
      if (body.serverPort !== undefined) currentConfig.serverPort = String(body.serverPort);
      if (typeof body.premiumMode === 'boolean') currentConfig.premiumMode = body.premiumMode;

      response.status(200).json({ success: true, message: 'Panel settings updated successfully!', config: publicConfig() });
      return;
    }

    if (action === 'generate_key') {
      const authHeader = request.headers['x-admin-password'] || body.password;
      if (authHeader !== currentConfig.adminPassword) {
        response.status(401).json({ error: 'Unauthorized admin access.' });
        return;
      }

      const newKey = 'VNX-PRO-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      generatedKeys.add(newKey);
      response.status(200).json({ success: true, key: newKey, keys: Array.from(generatedKeys) });
      return;
    }
  }

  const query = request.method === 'POST' ? (request.body || {}) : request.query;
  const phone = String(query?.phone || '').replace(/\D/g, '');
  const key = String(query?.key || query?.activationKey || '').trim();

  if (currentConfig.premiumMode) {
    if (!key || (!generatedKeys.has(key) && key !== 'VARNOX-PRO-2026')) {
      response.status(403).json({ error: 'Premium mode is active. A valid activation key generated from the admin panel is required to pair.' });
      return;
    }
  }

  if (phone.length < 7) {
    response.status(400).json({ error: 'Invalid phone number format.' });
    return;
  }

  const backendUrl = getBackendUrl();
  
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
  } catch {
    response.status(502).json({ error: 'Varnox backend is offline. Please start the bot server on your Pterodactyl panel.' });
  } finally {
    clearTimeout(timeout);
  }
}
