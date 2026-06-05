import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'vta.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

// Crear tablas solo si no existen (los datos persisten entre reinicios)
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id                TEXT PRIMARY KEY,
    apodo             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash     TEXT NOT NULL,
    password_plain    TEXT NOT NULL DEFAULT '',
    tipo              TEXT NOT NULL CHECK(tipo IN ('pareja', 'unicornio')),
    pareja_de         TEXT COLLATE NOCASE,
    creditos          INTEGER NOT NULL DEFAULT 100,
    activo            INTEGER NOT NULL DEFAULT 1,
    timestamp_entrada INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ofertas (
    id             TEXT PRIMARY KEY,
    vendedor_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vendedor_apodo TEXT NOT NULL,
    titulo         TEXT NOT NULL,
    descripcion    TEXT NOT NULL,
    categoria      TEXT NOT NULL CHECK(categoria IN ('tentador', 'atrevido', 'sin-limite')),
    ponderacion    INTEGER,
    disponible     INTEGER NOT NULL DEFAULT 1,
    timestamp      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tratos (
    id                    TEXT PRIMARY KEY,
    oferta_id             TEXT NOT NULL REFERENCES ofertas(id),
    comprador_id          TEXT NOT NULL REFERENCES usuarios(id),
    vendedor_id           TEXT NOT NULL REFERENCES usuarios(id),
    creditos_transferidos INTEGER NOT NULL,
    timestamp             INTEGER NOT NULL
  );
`);

// Migración: agregar password_plain si la BD es antigua (sin romper datos existentes)
try {
  db.exec(`ALTER TABLE usuarios ADD COLUMN password_plain TEXT NOT NULL DEFAULT ''`);
} catch {
  // Columna ya existe, ignorar
}

export default db;
