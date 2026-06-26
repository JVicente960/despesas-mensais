/* =====================================================================
   functions/api/[[route]].js
   Backend em Cloudflare Pages Functions + D1 (roda no mesmo deploy do site).

   Rotas:
     POST /api/register   { username, password }
     POST /api/login      { username, password }  -> { token }
     POST /api/logout     (Authorization: Bearer <token>)
     GET  /api/data       (Authorization: Bearer <token>) -> { data }
     PUT  /api/data       (Authorization: Bearer <token>)  body = JSON dos dados

   Pré-requisitos:
     1. Criar o D1 (ver schema.sql) e ligar o binding "DB" ao projeto Pages.
        Dashboard: Pages > seu projeto > Settings > Functions > D1 bindings
        Variable name: DB   |   D1 database: aurora-db
   ===================================================================== */

const SESSION_TTL = 1000 * 60 * 60 * 24 * 60; // sessão válida por 60 dias

// Client ID do Google (público, pode ficar no código). Usado pra conferir o "aud" do token.
const GOOGLE_CLIENT_ID = '528000890824-kgndiholp2r5kq91f1hsn4i4ls2jddia.apps.googleusercontent.com';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

// Hash de senha com PBKDF2 (100k iterações, SHA-256) — bem mais seguro que SHA-256 puro.
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparação em tempo constante (evita timing attacks)
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ----------- validação do token de identidade do Google (RS256) ----------- */
function b64urlToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function b64urlToJson(s) { return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))); }

// chaves públicas do Google (JWKS), com cache de 1h em memória do isolate
let _googleKeys = { keys: null, exp: 0 };
async function fetchGoogleKeys() {
  const now = Date.now();
  if (_googleKeys.keys && _googleKeys.exp > now) return _googleKeys.keys;
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!res.ok) throw new Error('Falha ao obter chaves do Google.');
  const data = await res.json();
  _googleKeys = { keys: data.keys, exp: now + 60 * 60 * 1000 };
  return data.keys;
}

// Verifica assinatura + claims. Lança erro se algo não bater. Retorna o payload.
export async function verifyGoogleIdToken(idToken, clientId, keyProvider) {
  keyProvider = keyProvider || fetchGoogleKeys;
  const parts = String(idToken).split('.');
  if (parts.length !== 3) throw new Error('Formato de token inválido.');
  const header = b64urlToJson(parts[0]);
  const payload = b64urlToJson(parts[1]);
  if (header.alg !== 'RS256') throw new Error('Algoritmo inesperado.');

  const keys = await keyProvider();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Chave de assinatura não encontrada.');

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), signed);
  if (!ok) throw new Error('Assinatura inválida.');

  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com')
    throw new Error('Emissor inválido.');
  if (payload.aud !== clientId) throw new Error('Audiência inválida.');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now - 60) throw new Error('Token expirado.');
  if (!payload.sub) throw new Error('Identificador ausente.');
  if (payload.email && payload.email_verified === false) throw new Error('E-mail não verificado.');
  return payload;
}

// Garante um username único (usado ao criar conta via Google a partir do e-mail)
async function uniqueUsername(env, base) {
  base = (base || 'user').trim() || 'user';
  let candidate = base, n = 1;
  while (await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(candidate).first()) {
    n += 1; candidate = base + '-' + n;
  }
  return candidate;
}

async function userFromToken(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const row = await env.DB.prepare('SELECT username, created_at FROM sessions WHERE token = ?')
    .bind(token).first();
  if (!row) return null;
  // sessão expirada -> remove e nega
  if (Date.now() - row.created_at > SESSION_TTL) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return row.username;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = (params.route || []).join('/');
  const method = request.method;

  try {
    /* ---- registrar ---- */
    if (route === 'register' && method === 'POST') {
      const { username, password } = await request.json();
      const u = (username || '').trim();
      if (!u) return json({ error: 'Informe um nome de usuário.' }, 400);
      if ((password || '').length < 4) return json({ error: 'A senha precisa ter ao menos 4 caracteres.' }, 400);

      const exists = await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(u).first();
      if (exists) return json({ error: 'Esse usuário já existe.' }, 409);

      const salt = crypto.randomUUID() + crypto.randomUUID();
      const hash = await hashPassword(password, salt);
      await env.DB.prepare('INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)')
        .bind(u, salt, hash).run();
      return json({ ok: true });
    }

    /* ---- login ---- */
    if (route === 'login' && method === 'POST') {
      const { username, password } = await request.json();
      const u = (username || '').trim();
      const user = await env.DB.prepare('SELECT salt, hash FROM users WHERE username = ?').bind(u).first();
      if (!user) return json({ error: 'Usuário ou senha incorretos.' }, 401);
      const hash = await hashPassword(password, user.salt);
      if (!safeEqual(hash, user.hash)) return json({ error: 'Usuário ou senha incorretos.' }, 401);

      const token = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO sessions (token, username, created_at) VALUES (?, ?, ?)')
        .bind(token, u, Date.now()).run();
      return json({ token, username: u });
    }

    /* ---- login com Google ---- */
    if (route === 'auth/google' && method === 'POST') {
      const { credential } = await request.json();
      if (!credential) return json({ error: 'Credencial ausente.' }, 400);

      let payload;
      try { payload = await verifyGoogleIdToken(credential, GOOGLE_CLIENT_ID); }
      catch (e) { return json({ error: 'Login Google inválido.' }, 401); }

      const sub = payload.sub;
      const email = (payload.email || '').toLowerCase();

      // já existe conta ligada a esse Google?
      const existing = await env.DB.prepare('SELECT username FROM users WHERE google_sub = ?').bind(sub).first();
      let username;
      if (existing) {
        username = existing.username;
      } else {
        username = await uniqueUsername(env, email || ('google_' + sub.slice(0, 8)));
        // salt/hash vazios: conta Google não tem login por senha
        await env.DB.prepare('INSERT INTO users (username, salt, hash, google_sub, email) VALUES (?, ?, ?, ?, ?)')
          .bind(username, '', '', sub, email).run();
      }

      const token = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO sessions (token, username, created_at) VALUES (?, ?, ?)')
        .bind(token, username, Date.now()).run();
      return json({ token, username });
    }

    /* ---- logout ---- */
    if (route === 'logout' && method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '').trim();
      if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return json({ ok: true });
    }

    /* ---- dados do usuário ---- */
    if (route === 'data') {
      const username = await userFromToken(env, request);
      if (!username) return json({ error: 'Não autenticado.' }, 401);

      if (method === 'GET') {
        const row = await env.DB.prepare('SELECT json FROM user_data WHERE username = ?').bind(username).first();
        return json({ data: row ? JSON.parse(row.json) : null });
      }
      if (method === 'PUT') {
        const body = await request.text();
        try { JSON.parse(body); } catch (e) { return json({ error: 'JSON inválido.' }, 400); }
        await env.DB.prepare(
          'INSERT INTO user_data (username, json) VALUES (?, ?) ' +
          'ON CONFLICT(username) DO UPDATE SET json = excluded.json'
        ).bind(username, body).run();
        return json({ ok: true });
      }
    }

    return json({ error: 'Rota não encontrada.' }, 404);
  } catch (err) {
    return json({ error: 'Erro no servidor.', detail: String(err) }, 500);
  }
}
