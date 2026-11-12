import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const DIAS_SESION = 30;

export function hashPassword(password) {
  const sal = randomBytes(16);
  const hash = scryptSync(password, sal, 64);
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`;
}

export function comprobarPassword(password, guardado) {
  if (!guardado) return false;
  const [alg, sal, hash] = guardado.split('$');
  if (alg !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64');
  const calculado = scryptSync(password, Buffer.from(sal, 'base64'), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

const sha256 = (t) => createHash('sha256').update(t).digest('hex');

export function crearSesion(db, usuarioId) {
  const token = randomBytes(32).toString('base64url');
  const expira = new Date(Date.now() + DIAS_SESION * 864e5).toISOString();
  db.prepare('INSERT INTO sesiones (token_hash, usuario_id, expira_at) VALUES (?, ?, ?)').run(sha256(token), usuarioId, expira);
  return token;
}

export function cerrarSesion(db, token) {
  db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(sha256(token));
}

export function usuarioDeToken(db, token) {
  if (!token) return null;
  const fila = db
    .prepare(
      `SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = ? AND s.expira_at > ? AND u.activo = 1`,
    )
    .get(sha256(token), new Date().toISOString());
  return fila ?? null;
}

/** Middleware: exige sesión y, opcionalmente, uno de los roles indicados. */
export function requiere(db, ...roles) {
  return (req, res, next) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const usuario = usuarioDeToken(db, token);
    if (!usuario) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    if (roles.length && !roles.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto.' });
    }
    req.usuario = usuario;
    req.token = token;
    next();
  };
}
