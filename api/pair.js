import crypto from 'node:crypto';
import { neon as neonClient } from '@neondatabase/serverless';

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

// ── Neon (Option B channel) ──────────────────────────────────
// The website and the bot never talk to each other directly.
// Pairing requests live in Neon; the bot polls them and writes
// the code back. Set NEON_DATABASE_URL in the Vercel project.
const DB_URL = String(process.env.NEON_DATABASE_URL || '').trim();
const sql = DB_URL ? neonClient(DB_URL, { fetchOptions: { cache: 'no-store' } }) : null;

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
    channel: 'neon',
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

// Simple per-IP rate limit (per function instance — best effort).
const rateBuckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < 60_000);
  if (hits.length >= 6) { rateBuckets.set(ip, hits); return true; }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

function clientIp(request) {
  return String(request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
}

async function dbStats() {
  if (!sql) return { online: false, pairedCount: 0 };
  try {
    const rows = await sql`SELECT count(*)::int AS c FROM sessions WHERE status = 'connected'`;
    return { online: true, pairedCount: rows[0]?.c || 0 };
  } catch {
    return { online: false, pairedCount: 0 };
  }
}

// Create a pairing request (or return the active one for the same phone).
async function createPairingRequest(phone) {
  const existing = await sql`
    SELECT id, status, pairing_code
      FROM varnox_pairing_requests
     WHERE phone = ${phone} AND status IN ('pending', 'processing', 'code_generated') AND expires_at > now()
     ORDER BY id DESC LIMIT 1`;
  if (existing.length) {
    const row = existing[0];
    return {
      requestId: String(row.id),
      reused: true,
      pairingCode: row.pairing_code || null,
      message: row.pairing_code
        ? 'This number already has an active pairing code — enter it in WhatsApp now.'
        : 'A pairing request for this number is already active — the bot is generating the code.',
    };
  }
  const inserted = await sql`INSERT INTO varnox_pairing_requests (phone) VALUES (${phone}) RETURNING id`;
  return { requestId: String(inserted[0].id), reused: false };
}

async function getPairingStatus(requestId) {
  const rows = await sql`
    SELECT id, status, pairing_code, error, expires_at
      FROM varnox_pairing_requests
     WHERE id = ${Number(requestId)}`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    requestId: String(r.id),
    status: r.status,
    pairingCode: r.pairing_code || null,
    error: r.error || null,
    expiresAt: r.expires_at,
  };
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password, x-api-secret');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const body = request.method === 'POST' ? readBody(request) : (request.query || {});

  // ── Status polling / stats ────────────────────────────────
  if (request.method === 'GET' && request.query?.stats === '1') {
    const stats = await dbStats();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    response.status(200).json({
      status: stats.online ? 'online' : 'offline',
      uptime: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      pairedCount: totalPairs || stats.pairedCount,
      premiumMode: currentConfig.premiumMode,
      panelDomain: currentConfig.panelDomain,
      serverPort: currentConfig.serverPort,
      serverId: currentConfig.serverId,
      channel: 'neon',
    });
    return;
  }

  // ── Poll a pairing request by id (GET ?id=NNN) ────────────
  if (request.method === 'GET' && request.query?.id) {
    const status = await getPairingStatus(String(request.query.id));
    if (!status) {
      response.status(404).json({ error: 'Pairing request not found.' });
      return;
    }
    if (status.status === 'connected') totalPairs += 1;
    response.status(200).json(status);
    return;
  }

  // ── Admin actions ─────────────────────────────────────────
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
    response.status(200).json({ success: true, message: 'Varnox settings updated successfully.', config: publicConfig() });
    return;
  }

  if (request.method === 'POST' && action === 'test_connection') {
    if (!adminAuthorized(request, body)) {
      response.status(401).json({ error: 'Unauthorized admin access.' });
      return;
    }
    const stats = await dbStats();
    response.status(200).json({
      success: true,
      backendOnline: stats.online,
      statusCode: stats.online ? 200 : 0,
      message: stats.online
        ? 'Neon channel reachable — pairing requests are delivered to the bot automatically, no server address needed.'
        : 'Neon database is not reachable. Check the NEON_DATABASE_URL environment variable in Vercel.',
    });
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

  // ── Pairing request (Neon channel) ────────────────────────
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
  if (!sql) {
    response.status(503).json({ error: 'The pairing channel is not configured. Set NEON_DATABASE_URL in the Vercel project.' });
    return;
  }
  if (rateLimited(clientIp(request))) {
    response.status(429).json({ error: 'Too many pairing requests. Wait a minute and try again.' });
    return;
  }

  try {
    const result = await createPairingRequest(phone);
    response.status(200).json({
      success: true,
      requestId: result.requestId,
      reused: result.reused,
      pairingCode: result.pairingCode || null,
      message: result.message || 'Pairing request created. The bot will generate your code within a few seconds — it expires in 5 minutes.',
      expiresIn: 300,
    });
  } catch (e) {
    response.status(500).json({ error: `Could not create pairing request: ${e.message}` });
  }
}
