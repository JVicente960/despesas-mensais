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
