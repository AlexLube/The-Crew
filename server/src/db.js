import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Esquema de la base de datos (SQLite).
 *
 * Fase 1 usa: usuarios (rol maker o marketing), sesiones, productos,
 * pedidos con sus líneas e historial, y el registro de emails enviados.
 *
 * Preparado para las fases 2 y 3 sin tener que migrar datos:
 * - usuarios.perfil distingue embajador, singular_worker y maker_evento.
 * - usuarios.origen_alta, acepta_privacidad_at y acepta_comunicaciones
 *   cubren el registro abierto con RGPD de la fase 2.
 * - eventos guarda de qué evento viene un maker (p. ej. Territorio Makers).
 * - pedidos.tipo ya admite muestra, regalo y welcome_pack para campañas,
 *   muestras y sorteos de la fase 3.
 */
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  lugar TEXT,
  fecha TEXT,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('maker', 'marketing', 'almacen')),
  perfil TEXT CHECK (perfil IN ('embajador', 'singular_worker', 'maker_evento')),
  telefono TEXT,
  oficio TEXT,
  taller TEXT,
  instagram TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT,
  provincia TEXT,
  tallas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  origen_alta TEXT NOT NULL DEFAULT 'marketing' CHECK (origen_alta IN ('marketing', 'registro', 'importacion')),
  evento_id INTEGER REFERENCES eventos(id),
  acepta_privacidad_at TEXT,
  acepta_comunicaciones INTEGER NOT NULL DEFAULT 0,
  notas_internas TEXT,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_at TEXT NOT NULL,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  tallas TEXT NOT NULL DEFAULT '[]',
  tipo TEXT NOT NULL DEFAULT 'prenda' CHECK (tipo IN ('prenda', 'accesorio', 'muestra', 'regalo')),
  tono TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'en_almacen', 'enviado', 'rechazado', 'cancelado')),
  tipo TEXT NOT NULL DEFAULT 'mensual'
    CHECK (tipo IN ('mensual', 'reposicion', 'welcome_pack', 'muestra', 'regalo', 'otro')),
  origen TEXT NOT NULL DEFAULT 'app' CHECK (origen IN ('app', 'email', 'telefono', 'marketing')),
  notas TEXT,
  nota_marketing TEXT,
  motivo_rechazo TEXT,
  seguimiento TEXT,
  envio_nombre TEXT,
  envio_telefono TEXT,
  envio_direccion TEXT,
  envio_codigo_postal TEXT,
  envio_ciudad TEXT,
  envio_provincia TEXT,
  creado_por INTEGER NOT NULL REFERENCES usuarios(id),
  creado_at TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS pedidos_estado ON pedidos(estado);

CREATE TABLE IF NOT EXISTS pedido_lineas (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  talla TEXT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS pedido_historial (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  nota TEXT,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY,
  para TEXT NOT NULL,
  asunto TEXT NOT NULL,
  texto TEXT NOT NULL,
  pedido_id INTEGER REFERENCES pedidos(id),
  estado TEXT NOT NULL CHECK (estado IN ('enviado', 'solo_registro', 'error')),
  error TEXT,
  creado_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function abrirDB(ruta = process.env.DB_PATH ?? 'data/the-crew.db') {
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(ESQUEMA);
  return db;
}

/** Ejecuta fn dentro de una transacción. */
export function transaccion(db, fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
