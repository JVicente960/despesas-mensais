-- =====================================================================
-- schema.sql · Banco de dados (Cloudflare D1 / SQLite)
-- Use só se quiser contas REAIS, sincronizadas entre dispositivos.
-- Como aplicar:
--   wrangler d1 create aurora-db
--   wrangler d1 execute aurora-db --file=./schema.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  salt     TEXT NOT NULL,
  hash     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_data (
  username TEXT PRIMARY KEY,
  json     TEXT NOT NULL
);
