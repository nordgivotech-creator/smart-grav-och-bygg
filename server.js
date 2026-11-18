// Smart Gräv och Bygg – webbserver utan externa beroenden (Node 18+)
// Start: node server.js   →  http://localhost:3000   (personalpanel: /admin)
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data'); // på hosting: peka på en persistent disk
const TRUST_PROXY = process.env.TRUST_PROXY === '1'; // sätt till 1 bakom Render/Fly/Nginx
const DB_FILE = path.join(DATA, 'inquiries.json');
const AUTH_FILE = path.join(DATA, 'admin.json');
const WEBHOOK = process.env.NOTIFY_WEBHOOK_URL || ''; // valfritt: Discord/Slack/ntfy-URL
fs.mkdirSync(DATA, { recursive: true });

/* ---------- Admin-lösenord (hashat, genereras vid första start) ---------- */
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
let auth;
if (fs.existsSync(AUTH_FILE)) {
  auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
} else {
  const initial = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const salt = crypto.randomBytes(16).toString('hex');
  auth = { salt, hash: hashPw(initial, salt), secret: crypto.randomBytes(32).toString('hex') };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2));
  console.log('\n  ┌────────────────────────────────────────────┐');
  console.log('  │  Personalpanel skapad                      │');
  console.log('  │  Adress:   /admin                          │');
  console.log('  │  Lösenord: ' + initial.padEnd(32) + '│');
  console.log('  │  (visas bara denna gång – spara det!)      │');
  console.log('  └────────────────────────────────────────────┘\n');
}
function checkPw(pw) {
  const a = Buffer.from(hashPw(String(pw), auth.salt), 'hex');
  const b = Buffer.from(auth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const SESSION_MS = 1000 * 60 * 60 * 12;
function makeToken() {
  const exp = String(Date.now() + SESSION_MS);
  const sig = crypto.createHmac('sha256', auth.secret).update(exp).digest('hex');
  return exp + '.' + sig;
}
function validToken(t) {
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = crypto.createHmac('sha256', auth.secret).update(exp).digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(good);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
const isAdmin = req => validToken(cookies(req).sgb_session);

/* ---------- Lagring (JSON-fil, atomiska skrivningar) ---------- */
let inquiries = [];
try { inquiries = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { inquiries = []; }
function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(inquiries, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/* ---------- Hjälpare ---------- */
const STATUSES = ['ny', 'kontaktad', 'offert', 'vunnen', 'förlorad'];
const SERVICES = ['Snickeri / Näjari', 'Måleri', 'Fasad', 'Stenarbete / Stenläggning', 'Murning / Byggnation',
  'Kakel & Tapet', 'Grävning & Markarbete', 'Annat / Vet ej'];
const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);

const buckets = new Map(); // enkel rate limit per IP
function limited(ip, key, max, windowMs) {
  const k = key + ip, now = Date.now();
  const arr = (buckets.get(k) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { buckets.set(k, arr); return true; }
  arr.push(now); buckets.set(k, arr); return false;
}
setInterval(() => buckets.clear(), 1000 * 60 * 60).unref();

function readJson(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function send(res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(code, {
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store', ...headers
  });
  res.end(isObj ? JSON.stringify(body) : body);
}
const SEC = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // skydd mot formelinjektion i Excel
  return '"' + s.replace(/"/g, '""') + '"';
}

async function notify(inq) {
  if (!WEBHOOK) return;
  try {
    const text = `🔔 Ny förfrågan: ${inq.name} (${inq.phone}) – ${inq.service}${inq.city ? ', ' + inq.city : ''}\n${inq.message.slice(0, 300)}`;
    await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, text }) });
  } catch (e) { console.error('Webhook misslyckades:', e.message); }
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const ip = (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'x';
  const p = url.pathname;

  if (req.method === 'POST' && p === '/api/inquiries') {
    if (limited(ip, 'inq', 5, 1000 * 60 * 15)) return send(res, 429, { error: 'För många förfrågningar. Försök igen om en stund eller ring oss.' });
    let b; try { b = await readJson(req); } catch { return send(res, 400, { error: 'Ogiltig begäran.' }); }
    if (b.website) return send(res, 200, { ok: true }); // honeypot: låtsas lyckas för botar
    const inq = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'ny', note: '',
      name: clip(b.name, 100), phone: clip(b.phone, 30), email: clip(b.email, 150),
      city: clip(b.city, 100), service: clip(b.service, 60), message: clip(b.message, 3000),
      budget: clip(b.budget, 40), timing: clip(b.timing, 40), contactPref: clip(b.contactPref, 20)
    };
    const errs = {};
    if (inq.name.length < 2) errs.name = 'Ange ditt namn.';
    if (!/^[+\d][\d\s\-()]{6,}$/.test(inq.phone)) errs.phone = 'Ange ett giltigt telefonnummer.';
    if (inq.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inq.email)) errs.email = 'Ogiltig e-postadress.';
    if (!SERVICES.includes(inq.service)) errs.service = 'Välj typ av arbete.';
    if (inq.message.length < 10) errs.message = 'Beskriv kort vad du behöver hjälp med.';
    if (b.consent !== true) errs.consent = 'Du behöver godkänna att vi lagrar dina uppgifter.';
    if (Object.keys(errs).length) return send(res, 422, { error: 'Kontrollera formuläret.', fields: errs });
    inquiries.unshift(inq); save(); notify(inq);
    console.log(`[${inq.createdAt}] Ny förfrågan: ${inq.name} – ${inq.service}`);
    return send(res, 201, { ok: true });
  }

  if (p === '/api/admin/login' && req.method === 'POST') {
    if (limited(ip, 'login', 8, 1000 * 60 * 15)) return send(res, 429, { error: 'För många försök. Vänta 15 minuter.' });
    let b; try { b = await readJson(req, 1000); } catch { return send(res, 400, { error: 'Ogiltig begäran.' }); }
    if (!checkPw(b.password)) return send(res, 401, { error: 'Fel lösenord.' });
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    return send(res, 200, { ok: true }, { 'Set-Cookie': `sgb_session=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure}` });
  }
  if (p === '/api/admin/logout' && req.method === 'POST')
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sgb_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });

  if (!p.startsWith('/api/admin/')) return send(res, 404, { error: 'Hittades inte.' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Inte inloggad.' });

  if (p === '/api/admin/me') return send(res, 200, { ok: true });
  if (p === '/api/admin/inquiries' && req.method === 'GET') return send(res, 200, { inquiries, statuses: STATUSES });

  if (p === '/api/admin/export.csv' && req.method === 'GET') {
    const head = ['Datum', 'Status', 'Namn', 'Telefon', 'E-post', 'Ort', 'Tjänst', 'Tidpunkt', 'Budget', 'Meddelande', 'Anteckning'];
    const rows = inquiries.map(i => [i.createdAt, i.status, i.name, i.phone, i.email, i.city, i.service, i.timing, i.budget, i.message, i.note].map(csvCell).join(';'));
    return send(res, 200, '﻿' + [head.map(csvCell).join(';'), ...rows].join('\r\n'),
      { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="forfragningar.csv"' });
  }

  const m = p.match(/^\/api\/admin\/inquiries\/([0-9a-f-]{36})$/);
  if (m) {
    const idx = inquiries.findIndex(i => i.id === m[1]);
    if (idx < 0) return send(res, 404, { error: 'Hittades inte.' });
    if (req.method === 'PATCH') {
      let b; try { b = await readJson(req, 5000); } catch { return send(res, 400, { error: 'Ogiltig begäran.' }); }
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return send(res, 422, { error: 'Ogiltig status.' }); inquiries[idx].status = b.status; }
      if (b.note !== undefined) inquiries[idx].note = clip(b.note, 2000);
      inquiries[idx].updatedAt = new Date().toISOString();
      save(); return send(res, 200, inquiries[idx]);
    }
    if (req.method === 'DELETE') { inquiries.splice(idx, 1); save(); return send(res, 200, { ok: true }); }
  }
  return send(res, 405, { error: 'Metoden stöds inte.' });
}

/* ---------- Statiska filer ---------- */
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/admin' || p === '/admin/') p = '/admin.html';
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Förbjudet');
  fs.readFile(file, (err, buf) => {
    if (err) return fs.readFile(path.join(PUBLIC, '404.html'), (e2, b2) => e2 ? send(res, 404, 'Sidan hittades inte', SEC) : (res.writeHead(404, { 'Content-Type': MIME['.html'], ...SEC }), res.end(b2)));
    const ext = path.extname(file).toLowerCase();
    const h = { 'Content-Type': MIME[ext] || 'application/octet-stream', ...SEC,
      'Cache-Control': 'no-cache' };
    if (p === '/admin.html') { h['Cache-Control'] = 'no-store'; h['X-Robots-Tag'] = 'noindex, nofollow'; }
    res.writeHead(200, h); res.end(buf);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/healthz') return send(res, 200, 'ok');
    if (url.pathname.startsWith('/api/')) {
      // Skydd mot CSRF: mutationer måste vara same-origin
      if (req.method !== 'GET') {
        const o = req.headers.origin;
        if (o && new URL(o).host !== req.headers.host) return send(res, 403, { error: 'Förbjudet.' });
      }
      return await api(req, res, url);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Metoden stöds inte');
    serveStatic(req, res, url);
  } catch (e) {
    console.error(e); if (!res.headersSent) send(res, 500, { error: 'Serverfel.' });
  }
}).listen(PORT, () => console.log(`Smart Gräv och Bygg kör på http://localhost:${PORT}  (personalpanel: /admin)`));
