import { hashPassword } from './auth.js';
import { abrirDB } from './db.js';
import { sembrar } from './seed.js';

/**
 * Abre la base de datos y la deja lista:
 * - crea el primer usuario de marketing con ADMIN_EMAIL y ADMIN_PASSWORD
 *   si todavía no hay ninguno;
 * - con DATOS_EJEMPLO=1 y la base vacía, carga los datos de ejemplo.
 */
export async function prepararDB(env = process.env) {
  const db = await abrirDB();
  if (env.DATOS_EJEMPLO === '1') await sembrar(db);
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD && !(await db.uno("SELECT 1 FROM usuarios WHERE rol = 'marketing' LIMIT 1"))) {
    await db.query("INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, 'Marketing Issaline', 'marketing') ON CONFLICT (email) DO NOTHING", [
      ADMIN_EMAIL.toLowerCase(),
      hashPassword(ADMIN_PASSWORD),
    ]);
    console.log(`Creado el usuario de marketing ${ADMIN_EMAIL}`);
  }
  return db;
}
