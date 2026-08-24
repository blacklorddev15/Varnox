import crypto from 'node:crypto';
let totalPairs = 0;
const startTime = Date.now();

const currentConfig = {
  panelDomain: process.env.PANEL_DOMAIN || 'https://pterodactyl.mzazi.shop',
  serverPort: process.env.SERVER_PORT || '25572',
  serverId: process.env.SERVER_ID || '5574df2c',
  backendSecret: String(process.env.BACKEND_API_SECRET || process.env.API_SECRET || process.env.PANEL_API_KEY || process.env.PANEL_APIKEY || '').trim(),
  premiumMode: process.env.PREMIUM_MODE === 'true',
  adminPassword: String(process.env.ADMIN_PASSWORD || process.env.WEBSITE_ADMIN_PASSWORD || process.env.API_SECRET || '').trim(),
};

const generatedKeys = new Set(['VARNOX-PRO-2026', 'SKYLAR-VIP-777']);
function signingSecret() { return currentConfig.backendSecret || currentConfig.adminPassword || ''; }
function issueActivationKey() {
  const prefix = 'VNX-PRO';
  const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const payload = prefix + '-' + nonce + '-' + timestamp;
  const signature = crypto.createHmac('sha256', signingSecret()).update(payload).digest('hex').slice(0, 16).toUpperCase();
  return payload + '-' + signature;
}
function validActivationKey(key) {
  if (generatedKeys.has(key) || key === 'VARNOX-PRO-2026') return true;
  const match = String(key || '').match(/^(VNX-PRO)-([A-Z0-9]{6})-([A-Z0-9]+)-([A-F0-9]{16})$/);
  if (!match || !signingSecret()) return false;
  const payload = match[1] + '-' + match[2] + '-' + match[3];
  const expected = crypto.createHmac('sha256', signingSecret()).update(payload).digest('hex').slice(0, 16).toUpperCase();
  return match[4] === expected;
}


function getBackendUrl() {
  const panel = String(currentConfig.panelDomain || '').trim();
  const port = String(currentConfig.serverPort || '').trim();
  if (!panel) return '';
  try {
    const parsed = new URL(/^https?:\/\//i.test(panel) ? panel : `https://${panel}`);
    return `http://${parsed.hostname}${port ? `:${port}` : ''}`;
  } catch { return ''; }
}

function maskSecret(value) {
  const secret = String(value || '');
  if (!secret) return 'Not configured';
  if (secret.length <= 4) return '••••';
  return secret.slice(0, 2) + '•'.repeat(Math.max(4, secret.length - 4)) + secret.slice(-2);
}

function publicConfig() {
  return {
    panelDomain: currentConfig.panelDomain,
    serverPort: currentConfig.serverPort,
    serverId: currentConfig.serverId,
    premiumMode: currentConfig.premiumMode,
    backendSecretConfigured: Boolean(currentConfig.backendSecret),
    backendSecretMasked: maskSecret(currentConfig.backendSecret),
  };
}

function readBody(request) {
  if (!request.body) return {};
  if (typeof request.body === 'object') return request.body;
  try { return JSON.parse(request.body); } catch { return {}; }
}

function adminAuthorized(request, body) {
  const supplied = String(request.headers['x-admin-password'] || request.headers['x-api-secret'] || body.password || '').trim();
  return Boolean(currentConfig.adminPassword && supplied === currentConfig.adminPassword);
}

async function checkBackend() {
  const base = String(getBackendUrl() || '').trim();
  if (!base) return { online: false, statusCode: 0, error: 'Pterodactyl panel domain and allocation port are not configured.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let lastStatus = 0;
  try {
    for (const path of ['/api/status', '/api/health', '']) {
      try {
        const upstream = await fetch(`${base}${path}`, {
          headers: { Accept: 'application/json', ...(currentConfig.backendSecret ? { 'x-api-secret': currentConfig.backendSecret } : {}) },
          signal: controller.signal,
        });
        lastStatus = upstream.status;
        if (upstream.ok) return { online: true, statusCode: upstream.status };
      } catch {
        // Try the next conventional health path before declaring the backend offline.
      }
    }
    return { online: false, statusCode: lastStatus, error: lastStatus ? `Backend returned HTTP ${lastStatus}.` : 'Backend is offline or not reachable.' };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password, x-api-secret');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method === 'GET' && request.query?.stats === '1') {
    const health = await checkBackend();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    response.status(200).json({
      status: health.online ? 'online' : 'offline',
      uptime: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      pairedCount: totalPairs,
      premiumMode: currentConfig.premiumMode,
      panelDomain: currentConfig.panelDomain,
        serverPort: currentConfig.serverPort,
      serverId: currentConfig.serverId,
    });
    return;
  }

  const body = request.method === 'POST' ? readBody(request) : (request.query || {});
  const action = body.action;

  if (request.method === 'POST' && (action === 'admin_login' || action === 'login')) {
    const pass = String(body.password || '').trim();
    if (!currentConfig.adminPassword) {
      response.status(503).json({ error: 'Website admin authentication is not configured.' });
      return;
    }
    if (pass !== currentConfig.adminPassword) {
      response.status(401).json({ error: 'Incorrect admin password.' });
      return;
    }
    response.status(200).json({ success: true, authenticated: true, config: publicConfig() });
    return;
  }

  if (request.method === 'POST' && action === 'update_settings') {
    if (!adminAuthorized(request, body)) {
      response.status(401).json({ error: 'Unauthorized admin access.' });
      return;
    }
    if (body.panelDomain !== undefined) currentConfig.panelDomain = String(body.panelDomain).trim();
    if (body.serverPort !== undefined) currentConfig.serverPort = String(body.serverPort).trim();
    if (body.serverId !== undefined) currentConfig.serverId = String(body.serverId).trim();
    const newSecret = body.backendSecret ?? body.panelApiKey;
    if (newSecret !== undefined && String(newSecret).trim()) currentConfig.backendSecret = String(newSecret).trim();
    if (typeof body.premiumMode === 'boolean') currentConfig.premiumMode = body.premiumMode;
    response.status(200).json({ success: true, message: 'Varnox Pterodactyl settings updated successfully.', config: publicConfig() });
    return;
  }

  if (request.method === 'POST' && action === 'test_connection') {
    if (!adminAuthorized(request, body)) {
      response.status(401).json({ error: 'Unauthorized admin access.' });
      return;
    }
    const health = await checkBackend();
    response.status(200).json({ success: true, backendOnline: health.online, statusCode: health.statusCode, message: health.message || health.error || (health.online ? 'Backend is reachable.' : 'Backend is offline or not reachable.') });
    return;
  }

  if (request.method === 'POST' && action === 'generate_key') {
    if (!adminAuthorized(request, body)) {
      response.status(401).json({ error: 'Unauthorized admin access.' });
      return;
    }
    const newKey = issueActivationKey();
    generatedKeys.add(newKey);
    response.status(200).json({ success: true, key: newKey, keys: Array.from(generatedKeys) });
    return;
  }

  const phone = String(body?.phone || '').replace(/\D/g, '');
  const key = String(body?.key || body?.activationKey || '').trim();
  if (currentConfig.premiumMode && !validActivationKey(key)) {
    response.status(403).json({ error: 'Premium mode is active. A valid activation key generated from the admin panel is required to pair.' });
    return;
  }
  if (phone.length < 7) {
    response.status(400).json({ error: 'Invalid phone number format.' });
    return;
  }

  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    response.status(503).json({ error: 'Pterodactyl panel domain and allocation port are not configured.' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(`${backendUrl}/pair?phone=${encodeURIComponent(phone)}`, {
      headers: { Accept: 'application/json', ...(currentConfig.backendSecret ? { 'x-api-secret': currentConfig.backendSecret } : {}) },
      signal: controller.signal,
    });
    const upstreamBody = await upstream.text();
    if (upstream.ok) totalPairs += 1;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    response.status(upstream.status).send(upstreamBody);
  } catch {
    response.status(502).json({ error: 'Varnox backend is offline. Check the Pterodactyl panel domain, allocation port, and that the backend is running.' });
  } finally {
    clearTimeout(timeout);
  }
}
