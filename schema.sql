-- =====================================================================
-- schema.sql · Banco de dados (Cloudflare D1 / SQLite)
-- Use só se quiser contas REAIS, sincronizadas entre dispositivos.
-- Como aplicar:
--   wrangler d1 create aurora-db
--   wrangler d1 execute aurora-db --file=./schema.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  username   TEXT PRIMARY KEY,
  salt       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  google_sub TEXT,
  email      TEXT
);

-- Garante no máximo uma conta por identidade do Google
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
  ON users(google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_data (
  username TEXT PRIMARY KEY,
  json     TEXT NOT NULL
);

-- Controle de tentativas de login (rate-limit contra força bruta), por IP
CREATE TABLE IF NOT EXISTS login_attempts (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  first_ts INTEGER NOT NULL
);
