import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Base de datos PostgreSQL.
 *
 * - En producción (Netlify u otro hosting) se conecta a la URL de
 *   NETLIFY_DATABASE_URL o DATABASE_URL (Netlify DB / Neon, Supabase...).
 * - En local y en las pruebas, sin URL, usa PGlite: un Postgres completo
 *   que corre dentro de Node, sin instalar nada. Guarda en data/pglite
 *   (o en memoria con ':memory:').
 *
 * Fase 1 usa: usuarios (rol maker, marketing o almacén), sesiones,
 * productos, pedidos con sus líneas e historial, y registro de emails.
 *
 * Preparado para las fases 2 y 3 sin migrar datos:
 * - usuarios.perfil distingue embajador, singular_worker y maker_evento.
 * - usuarios.origen_alta, acepta_privacidad_at y acepta_comunicaciones
 *   cubren el registro abierto con RGPD de la fase 2.
 * - eventos guarda de qué evento viene un maker (p. ej. Territorio Makers).
 * - pedidos.tipo ya admite muestra, regalo y welcome_pack.
 */
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  lugar TEXT,
  fecha DATE,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
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
  activo BOOLEAN NOT NULL DEFAULT true,
  origen_alta TEXT NOT NULL DEFAULT 'marketing' CHECK (origen_alta IN ('marketing', 'registro', 'importacion')),
  evento_id INTEGER REFERENCES eventos(id),
  acepta_privacidad_at TIMESTAMPTZ,
  acepta_comunicaciones BOOLEAN NOT NULL DEFAULT false,
  notas_internas TEXT,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_at TIMESTAMPTZ NOT NULL,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  tallas JSONB NOT NULL DEFAULT '[]',
  tipo TEXT NOT NULL DEFAULT 'prenda' CHECK (tipo IN ('prenda', 'accesorio', 'muestra', 'regalo')),
  tono TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
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
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS pedidos_estado ON pedidos(estado);

CREATE TABLE IF NOT EXISTS pedido_lineas (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  talla TEXT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS pedido_historial (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  nota TEXT,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  para TEXT NOT NULL,
  asunto TEXT NOT NULL,
  texto TEXT NOT NULL,
  pedido_id INTEGER REFERENCES pedidos(id),
  estado TEXT NOT NULL CHECK (estado IN ('enviado', 'solo_registro', 'error')),
  error TEXT,
  creado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** Envuelve un cliente con query(sql, params) → filas. */
function envolver(query) {
  return {
    query,
    async todos(sql, params = []) {
      return query(sql, params);
    },
    async uno(sql, params = []) {
      return (await query(sql, params))[0] ?? null;
    },
  };
}

/**
 * Abre la base de datos y crea las tablas si no existen.
 * Devuelve { query, todos, uno, tx(fn), cerrar() }.
 */
export async function abrirDB({ url = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL, ruta = process.env.DB_PATH ?? 'data/pglite' } = {}) {
  let db;
  if (url) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: url, max: 3 });
    db = {
      ...envolver(async (sql, params) => (await pool.query(sql, params?.length ? params : undefined)).rows),
      async tx(fn) {
        const cliente = await pool.connect();
        try {
          await cliente.query('BEGIN');
          const r = await fn(envolver(async (sql, params) => (await cliente.query(sql, params)).rows));
          await cliente.query('COMMIT');
          return r;
        } catch (e) {
          await cliente.query('ROLLBACK');
          throw e;
        } finally {
          cliente.release();
        }
      },
      cerrar: () => pool.end(),
    };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
    const pg = ruta === ':memory:' ? new PGlite() : new PGlite(ruta);
    db = {
      ...envolver(async (sql, params) => (await pg.query(sql, params)).rows),
      tx: (fn) => pg.transaction((t) => fn(envolver(async (sql, params) => (await t.query(sql, params)).rows))),
      cerrar: () => pg.close(),
    };
    db.exec = (sql) => pg.exec(sql);
  }
  if (db.exec) await db.exec(ESQUEMA);
  else await db.query(ESQUEMA);
  return db;
}
