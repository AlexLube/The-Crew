import cors from 'cors';
import express from 'express';
import { randomBytes } from 'node:crypto';

import { cerrarSesion, comprobarPassword, crearSesion, hashPassword, requiere } from './auth.js';
import { crearCorreo } from './email.js';

export const ESTADOS = ['pendiente', 'aprobado', 'en_almacen', 'enviado', 'rechazado', 'cancelado'];
export const PERFILES = ['embajador', 'singular_worker', 'maker_evento'];
const TIPOS = ['mensual', 'reposicion', 'welcome_pack', 'muestra', 'regalo', 'otro'];
const TIPOS_MAKER = ['mensual', 'reposicion', 'otro'];
const ORIGENES_MANUALES = ['email', 'telefono', 'marketing'];
const CAMPOS_PERFIL = ['telefono', 'oficio', 'taller', 'instagram', 'direccion', 'codigo_postal', 'ciudad', 'provincia', 'tallas'];

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente de aprobar',
  aprobado: 'Aprobado',
  en_almacen: 'Aprobado · preparando el envío',
  enviado: 'Enviado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};
const ETIQUETA_TIPO = {
  mensual: 'Pedido mensual',
  reposicion: 'Reposición',
  welcome_pack: 'Welcome pack',
  muestra: 'Muestras',
  regalo: 'Regalo',
  otro: 'Otro',
};

class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
const falla = (status, mensaje) => {
  throw new ErrorApi(status, mensaje);
};

const texto = (v, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function usuarioPublico(u) {
  if (!u) return null;
  const { password_hash, notas_internas, ...resto } = u;
  return { ...resto, activo: !!u.activo, acepta_comunicaciones: !!u.acepta_comunicaciones };
}

/** Construye "col1 = $n, col2 = $n+1" y la lista de valores. */
function sets(cambios, desde = 1) {
  const claves = Object.keys(cambios);
  return { sql: claves.map((k, i) => `${k} = $${desde + i}`).join(', '), valores: Object.values(cambios), n: claves.length };
}

export function crearApp({ db, env = process.env }) {
  const app = express();
  const correo = crearCorreo(db, env);
  const auth = (...roles) => requiere(db, ...roles);
  const staff = auth('marketing', 'almacen');
  const marketing = auth('marketing');

  // En Netlify la función recibe /.netlify/functions/api/...; la dejamos como /api/...
  app.use((req, _res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) req.url = `/api${req.url.slice('/.netlify/functions/api'.length)}`;
    next();
  });
  app.use(cors({ origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : true }));
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/salud', (_req, res) => res.json({ ok: true }));

  // ── Acceso ────────────────────────────────────────────────────────────
  app.post('/api/auth/login', async (req, res) => {
    const email = texto(req.body?.email, 200)?.toLowerCase();
    const password = req.body?.password;
    const u = email ? await db.uno('SELECT * FROM usuarios WHERE email = $1', [email]) : null;
    if (!u || typeof password !== 'string' || !comprobarPassword(password, u.password_hash)) {
      falla(401, 'Email o contraseña incorrectos.');
    }
    if (!u.activo) falla(403, 'Tu cuenta está desactivada. Escribe a marketing de Issaline.');
    res.json({ token: await crearSesion(db, u.id), usuario: usuarioPublico(u) });
  });

  app.post('/api/auth/logout', auth(), async (req, res) => {
    await cerrarSesion(db, req.token);
    res.json({ ok: true });
  });

  app.get('/api/yo', auth(), (req, res) => res.json(usuarioPublico(req.usuario)));

  const leerUsuario = (id) => db.uno('SELECT * FROM usuarios WHERE id = $1', [id]);
  async function actualizarUsuario(id, cambios) {
    const s = sets(cambios);
    if (!s.n) return;
    await db.query(`UPDATE usuarios SET ${s.sql} WHERE id = $${s.n + 1}`, [...s.valores, id]);
  }

  app.patch('/api/yo', auth(), async (req, res) => {
    const cambios = {};
    for (const k of CAMPOS_PERFIL) if (k in (req.body ?? {})) cambios[k] = texto(req.body[k]);
    await actualizarUsuario(req.usuario.id, cambios);
    res.json(usuarioPublico(await leerUsuario(req.usuario.id)));
  });

  app.post('/api/yo/password', auth(), async (req, res) => {
    const { actual, nueva } = req.body ?? {};
    if (!comprobarPassword(String(actual ?? ''), req.usuario.password_hash)) falla(400, 'La contraseña actual no es correcta.');
    if (typeof nueva !== 'string' || nueva.length < 8) falla(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    await db.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashPassword(nueva), req.usuario.id]);
    res.json({ ok: true });
  });

  // ── Catálogo ──────────────────────────────────────────────────────────
  app.get('/api/productos', auth(), async (req, res) => {
    const todos = req.usuario.rol !== 'maker' && req.query.todos === '1';
    res.json(await db.todos(`SELECT * FROM productos ${todos ? '' : 'WHERE activo'} ORDER BY categoria, nombre`));
  });

  app.post('/api/productos', marketing, async (req, res) => {
    const b = req.body ?? {};
    const sku = texto(b.sku, 60);
    const nombre = texto(b.nombre, 120);
    const categoria = texto(b.categoria, 60);
    if (!sku || !nombre || !categoria) falla(400, 'Faltan la referencia, el nombre o la categoría.');
    const tallas = Array.isArray(b.tallas) ? b.tallas.map(String) : [];
    const tipo = ['prenda', 'accesorio', 'muestra', 'regalo'].includes(b.tipo) ? b.tipo : 'prenda';
    const p = await db.uno(
      'INSERT INTO productos (sku, nombre, categoria, descripcion, tallas, tipo, tono) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING *',
      [sku, nombre, categoria, texto(b.descripcion, 1000), JSON.stringify(tallas), tipo, texto(b.tono, 30)],
    );
    res.status(201).json(p);
  });

  app.patch('/api/productos/:id', marketing, async (req, res) => {
    const p = (await db.uno('SELECT * FROM productos WHERE id = $1', [Number(req.params.id)])) ?? falla(404, 'Ese producto no existe.');
    const b = req.body ?? {};
    const nuevo = await db.uno(
      'UPDATE productos SET nombre = $1, categoria = $2, descripcion = $3, tallas = $4::jsonb, activo = $5 WHERE id = $6 RETURNING *',
      [
        texto(b.nombre, 120) ?? p.nombre,
        texto(b.categoria, 60) ?? p.categoria,
        'descripcion' in b ? texto(b.descripcion, 1000) : p.descripcion,
        JSON.stringify(Array.isArray(b.tallas) ? b.tallas.map(String) : p.tallas),
        'activo' in b ? !!b.activo : p.activo,
        p.id,
      ],
    );
    res.json(nuevo);
  });

  // ── Pedidos ───────────────────────────────────────────────────────────
  async function cargarPedido(id, q = db) {
    const p = await q.uno(
      `SELECT p.*, u.nombre AS usuario_nombre, u.email AS usuario_email, u.perfil AS usuario_perfil
       FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = $1`,
      [id],
    );
    if (!p) return null;
    p.lineas = await q.todos(
      `SELECT l.id, l.producto_id, l.talla, l.cantidad, pr.nombre, pr.sku, pr.categoria, pr.tono
       FROM pedido_lineas l JOIN productos pr ON pr.id = l.producto_id WHERE l.pedido_id = $1 ORDER BY l.id`,
      [id],
    );
    p.historial = await q.todos(
      `SELECT h.estado, h.nota, h.creado_at, u.nombre AS usuario_nombre, u.rol AS usuario_rol
       FROM pedido_historial h LEFT JOIN usuarios u ON u.id = h.usuario_id WHERE h.pedido_id = $1 ORDER BY h.id`,
      [id],
    );
    p.unidades = p.lineas.reduce((n, l) => n + l.cantidad, 0);
    p.estado_texto = ETIQUETA_ESTADO[p.estado];
    p.tipo_texto = ETIQUETA_TIPO[p.tipo];
    return p;
  }

  async function pedidoVisible(req, id) {
    const p = (Number.isInteger(id) ? await cargarPedido(id) : null) ?? falla(404, 'Ese pedido no existe.');
    if (req.usuario.rol === 'maker' && p.usuario_id !== req.usuario.id) falla(404, 'Ese pedido no existe.');
    return p;
  }

  /** Para el maker: oculta las notas internas de marketing. */
  function paraMaker(p) {
    const { nota_marketing, ...resto } = p;
    resto.historial = p.historial.map(({ usuario_nombre, ...h }) => ({ ...h, usuario_nombre: h.usuario_rol === 'maker' ? usuario_nombre : 'Issaline' }));
    return resto;
  }
  const responder = (req, p) => (req.usuario.rol === 'maker' ? paraMaker(p) : p);

  const registrar = (q, pedidoId, estado, usuarioId, nota = null) =>
    q.query('INSERT INTO pedido_historial (pedido_id, estado, usuario_id, nota) VALUES ($1, $2, $3, $4)', [pedidoId, estado, usuarioId, nota]);

  async function cambiarEstado(q, pedido, estado, usuarioId, nota, extra = {}) {
    const s = sets(extra, 2);
    await q.query(`UPDATE pedidos SET estado = $1, actualizado_at = now()${s.n ? `, ${s.sql}` : ''} WHERE id = $${s.n + 2}`, [estado, ...s.valores, pedido.id]);
    await registrar(q, pedido.id, estado, usuarioId, nota);
  }

  function resumenTexto(p) {
    const lineas = p.lineas.map((l) => `  · ${l.cantidad} × ${l.nombre}${l.talla ? ` (talla ${l.talla})` : ''} [${l.sku}]`).join('\n');
    const dir = [p.envio_nombre, p.envio_direccion, `${p.envio_codigo_postal ?? ''} ${p.envio_ciudad ?? ''}`.trim(), p.envio_provincia, p.envio_telefono && `Tel. ${p.envio_telefono}`]
      .filter(Boolean)
      .join('\n  ');
    return `Pedido ${p.codigo} · ${ETIQUETA_TIPO[p.tipo]}\nPara: ${p.usuario_nombre} (${p.usuario_email})\n\nArtículos:\n${lineas}\n\nEnviar a:\n  ${dir}${p.notas ? `\n\nNotas del maker: ${p.notas}` : ''}${p.nota_marketing ? `\nNota de marketing: ${p.nota_marketing}` : ''}`;
  }

  app.get('/api/pedidos', auth(), async (req, res) => {
    const where = [];
    const params = [];
    const filtro = (sql, v) => {
      params.push(v);
      where.push(sql.replace('?', `$${params.length}`));
    };
    if (req.usuario.rol === 'maker') filtro('p.usuario_id = ?', req.usuario.id);
    else {
      if (req.query.usuario_id) filtro('p.usuario_id = ?', Number(req.query.usuario_id));
      if (PERFILES.includes(req.query.perfil)) filtro('u.perfil = ?', req.query.perfil);
    }
    const estados = String(req.query.estado ?? '')
      .split(',')
      .filter((e) => ESTADOS.includes(e));
    if (estados.length) filtro('p.estado = ANY(?)', estados);
    const filas = await db.todos(
      `SELECT p.id, p.codigo, p.estado, p.tipo, p.origen, p.creado_at, p.actualizado_at, p.seguimiento,
              u.id AS usuario_id, u.nombre AS usuario_nombre, u.perfil AS usuario_perfil,
              (SELECT COALESCE(SUM(cantidad), 0)::int FROM pedido_lineas WHERE pedido_id = p.id) AS unidades
       FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY p.creado_at DESC, p.id DESC LIMIT 500`,
      params,
    );
    res.json(filas.map((f) => ({ ...f, estado_texto: ETIQUETA_ESTADO[f.estado], tipo_texto: ETIQUETA_TIPO[f.tipo] })));
  });

  app.get('/api/pedidos/resumen', staff, async (_req, res) => {
    const filas = await db.todos('SELECT estado, COUNT(*)::int AS n FROM pedidos GROUP BY estado');
    res.json(Object.fromEntries(ESTADOS.map((e) => [e, filas.find((f) => f.estado === e)?.n ?? 0])));
  });

  app.get('/api/pedidos/:id', auth(), async (req, res) => res.json(responder(req, await pedidoVisible(req, Number(req.params.id)))));

  app.post('/api/pedidos', auth('maker', 'marketing'), async (req, res) => {
    const b = req.body ?? {};
    const esMaker = req.usuario.rol === 'maker';
    const destinatario = esMaker
      ? req.usuario
      : ((Number.isInteger(Number(b.usuario_id)) ? await db.uno("SELECT * FROM usuarios WHERE id = $1 AND rol = 'maker'", [Number(b.usuario_id)]) : null) ??
        falla(400, 'Elige el maker al que va el pedido.'));
    if (!destinatario.activo) falla(400, 'Ese maker está desactivado.');

    const tipo = b.tipo ?? (destinatario.perfil === 'embajador' ? 'mensual' : 'reposicion');
    if (!TIPOS.includes(tipo) || (esMaker && !TIPOS_MAKER.includes(tipo))) falla(400, 'Tipo de pedido no válido.');
    if (esMaker && tipo === 'mensual' && destinatario.perfil !== 'embajador') falla(400, 'El pedido mensual es solo para embajadores.');
    const origen = esMaker ? 'app' : ORIGENES_MANUALES.includes(b.origen) ? b.origen : 'marketing';

    if (esMaker && tipo === 'mensual') {
      const yaHay = await db.uno(
        `SELECT codigo FROM pedidos WHERE usuario_id = $1 AND tipo = 'mensual'
         AND estado NOT IN ('rechazado', 'cancelado') AND date_trunc('month', creado_at) = date_trunc('month', now())`,
        [destinatario.id],
      );
      if (yaHay) falla(409, `Ya tienes el pedido mensual de este mes (${yaHay.codigo}). Para algo más, pide una reposición.`);
    }

    const lineas = Array.isArray(b.lineas) ? b.lineas : [];
    if (!lineas.length) falla(400, 'Añade al menos un artículo.');
    if (lineas.length > 30) falla(400, 'Demasiados artículos en un solo pedido.');
    const limpias = [];
    for (const l of lineas) {
      const id = Number(l?.producto_id);
      const p = Number.isInteger(id) ? await db.uno('SELECT * FROM productos WHERE id = $1', [id]) : null;
      if (!p || (!p.activo && esMaker)) falla(400, 'Uno de los artículos ya no está disponible.');
      const talla = l.talla ? String(l.talla) : null;
      if (p.tallas.length && !p.tallas.includes(talla)) falla(400, `Elige una talla para ${p.nombre}.`);
      const cantidad = Number(l.cantidad ?? 1);
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) falla(400, 'La cantidad debe estar entre 1 y 20.');
      limpias.push({ producto_id: p.id, talla: p.tallas.length ? talla : null, cantidad });
    }

    const envio = {
      envio_nombre: texto(b.envio?.nombre) ?? destinatario.nombre,
      envio_telefono: texto(b.envio?.telefono) ?? destinatario.telefono,
      envio_direccion: texto(b.envio?.direccion) ?? destinatario.direccion,
      envio_codigo_postal: texto(b.envio?.codigo_postal) ?? destinatario.codigo_postal,
      envio_ciudad: texto(b.envio?.ciudad) ?? destinatario.ciudad,
      envio_provincia: texto(b.envio?.provincia) ?? destinatario.provincia,
    };
    if (!envio.envio_direccion || !envio.envio_codigo_postal || !envio.envio_ciudad) {
      falla(400, esMaker ? 'Completa tu dirección de envío en tu perfil antes de pedir.' : 'Falta la dirección de envío de este maker.');
    }

    const id = await db.tx(async (q) => {
      const columnas = ['usuario_id', 'tipo', 'origen', 'notas', 'nota_marketing', 'creado_por', ...Object.keys(envio)];
      const valores = [destinatario.id, tipo, origen, texto(b.notas, 1000), esMaker ? null : texto(b.nota_marketing, 1000), req.usuario.id, ...Object.values(envio)];
      const { id: pid } = await q.uno(
        `INSERT INTO pedidos (${columnas.join(', ')}) VALUES (${columnas.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
        valores,
      );
      await q.query('UPDATE pedidos SET codigo = $1 WHERE id = $2', [`TC-${new Date().getFullYear()}-${String(pid).padStart(4, '0')}`, pid]);
      for (const l of limpias) {
        await q.query('INSERT INTO pedido_lineas (pedido_id, producto_id, talla, cantidad) VALUES ($1, $2, $3, $4)', [pid, l.producto_id, l.talla, l.cantidad]);
      }
      const notaOrigen = esMaker
        ? 'Solicitado desde la app'
        : `Alta manual por ${req.usuario.nombre} (${origen === 'telefono' ? 'por teléfono' : origen === 'email' ? 'por email' : 'marketing'})`;
      await registrar(q, pid, 'pendiente', req.usuario.id, notaOrigen);
      return pid;
    });

    const p = await cargarPedido(id);
    if (esMaker) {
      await correo.enviar({
        para: correo.destinos.marketing,
        asunto: `Nueva solicitud ${p.codigo} de ${p.usuario_nombre}`,
        texto: `${p.usuario_nombre} ha pedido desde la app. Revísalo en el panel de marketing para aprobarlo o rechazarlo.\n\n${resumenTexto(p)}`,
        pedidoId: id,
      });
    }
    res.status(201).json(responder(req, p));
  });

  app.post('/api/pedidos/:id/aprobar', marketing, async (req, res) => {
    const p = await pedidoVisible(req, Number(req.params.id));
    if (p.estado !== 'pendiente') falla(409, `Este pedido ya está ${ETIQUETA_ESTADO[p.estado].toLowerCase()}.`);
    const nota = texto(req.body?.nota, 1000);
    await cambiarEstado(db, p, 'aprobado', req.usuario.id, nota, nota ? { nota_marketing: nota } : {});
    res.json(await cargarPedido(p.id));
  });

  app.post('/api/pedidos/:id/rechazar', marketing, async (req, res) => {
    const p = await pedidoVisible(req, Number(req.params.id));
    if (!['pendiente', 'aprobado'].includes(p.estado)) falla(409, 'Solo se pueden rechazar pedidos que aún no han ido al almacén.');
    const motivo = texto(req.body?.motivo, 1000) ?? falla(400, 'Explica al maker por qué se rechaza.');
    await cambiarEstado(db, p, 'rechazado', req.usuario.id, motivo, { motivo_rechazo: motivo });
    const actual = await cargarPedido(p.id);
    await correo.enviar({
      para: actual.usuario_email,
      asunto: `Tu pedido ${actual.codigo} no se ha aprobado`,
      texto: `Hola ${actual.usuario_nombre}:\n\nNo hemos podido aprobar tu pedido ${actual.codigo}.\nMotivo: ${motivo}\n\nSi tienes dudas, escríbenos desde la app.\n\nEl equipo de The Crew`,
      pedidoId: p.id,
    });
    res.json(actual);
  });

  /** Lanza el pedido a almacén. Si aún estaba pendiente, lo aprueba a la vez. */
  app.post('/api/pedidos/:id/lanzar', marketing, async (req, res) => {
    const p = await pedidoVisible(req, Number(req.params.id));
    if (!['pendiente', 'aprobado'].includes(p.estado)) falla(409, `Este pedido ya está ${ETIQUETA_ESTADO[p.estado].toLowerCase()}.`);
    const nota = texto(req.body?.nota, 1000);
    await db.tx(async (q) => {
      if (p.estado === 'pendiente') await cambiarEstado(q, p, 'aprobado', req.usuario.id, nota, nota ? { nota_marketing: nota } : {});
      else if (nota) await q.query('UPDATE pedidos SET nota_marketing = $1 WHERE id = $2', [nota, p.id]);
      await cambiarEstado(q, p, 'en_almacen', req.usuario.id, 'Enviado a almacén para preparar');
    });
    const actual = await cargarPedido(p.id);
    await correo.enviar({
      para: [correo.destinos.almacen, correo.destinos.marketing],
      asunto: `Preparar pedido ${actual.codigo} · ${actual.usuario_nombre}`,
      texto: `Marketing ha aprobado este pedido. Preparadlo y enviadlo desde almacén.\n\n${resumenTexto(actual)}\n\nAprobado por: ${req.usuario.nombre}`,
      pedidoId: p.id,
    });
    res.json(actual);
  });

  app.post('/api/pedidos/:id/enviado', staff, async (req, res) => {
    const p = await pedidoVisible(req, Number(req.params.id));
    if (p.estado !== 'en_almacen') falla(409, 'Solo se marcan como enviados los pedidos que están en almacén.');
    const seguimiento = texto(req.body?.seguimiento, 200);
    await cambiarEstado(db, p, 'enviado', req.usuario.id, seguimiento ? `Seguimiento: ${seguimiento}` : null, { seguimiento });
    const actual = await cargarPedido(p.id);
    await correo.enviar({
      para: actual.usuario_email,
      asunto: `Tu pedido ${actual.codigo} va de camino`,
      texto: `Hola ${actual.usuario_nombre}:\n\nTu pedido ${actual.codigo} ya ha salido de nuestro almacén.${seguimiento ? `\nSeguimiento: ${seguimiento}` : ''}\n\nEl equipo de The Crew`,
      pedidoId: p.id,
    });
    res.json(actual);
  });

  app.post('/api/pedidos/:id/cancelar', auth('maker', 'marketing'), async (req, res) => {
    const p = await pedidoVisible(req, Number(req.params.id));
    if (p.estado !== 'pendiente') falla(409, 'Solo se pueden cancelar pedidos pendientes de aprobar.');
    await cambiarEstado(db, p, 'cancelado', req.usuario.id, texto(req.body?.motivo, 500));
    res.json(responder(req, await cargarPedido(p.id)));
  });

  // ── Usuarios (marketing) ──────────────────────────────────────────────
  const conNotas = (u) => ({ ...usuarioPublico(u), notas_internas: u.notas_internas });

  app.get('/api/usuarios', staff, async (req, res) => {
    const where = [];
    const params = [];
    const filtro = (sql, v) => {
      params.push(v);
      where.push(sql.replaceAll('?', `$${params.length}`));
    };
    if (['maker', 'marketing', 'almacen'].includes(req.query.rol)) filtro('u.rol = ?', req.query.rol);
    if (PERFILES.includes(req.query.perfil)) filtro('u.perfil = ?', req.query.perfil);
    const q = texto(req.query.q, 100);
    if (q) filtro('(u.nombre ILIKE ? OR u.email ILIKE ? OR u.taller ILIKE ? OR u.ciudad ILIKE ?)', `%${q}%`);
    const filas = await db.todos(
      `SELECT u.*, e.nombre AS evento_nombre,
         (SELECT COUNT(*)::int FROM pedidos WHERE usuario_id = u.id) AS pedidos,
         (SELECT MAX(creado_at) FROM pedidos WHERE usuario_id = u.id) AS ultimo_pedido_at
       FROM usuarios u LEFT JOIN eventos e ON e.id = u.evento_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY CASE u.rol WHEN 'maker' THEN 0 ELSE 1 END, lower(u.nombre)`,
      params,
    );
    res.json(filas.map(conNotas));
  });

  const usuarioOFalla = async (id) => (Number.isInteger(id) ? await leerUsuario(id) : null) ?? falla(404, 'Ese usuario no existe.');

  app.get('/api/usuarios/:id', staff, async (req, res) => {
    const u = await usuarioOFalla(Number(req.params.id));
    const ev = u.evento_id ? await db.uno('SELECT nombre FROM eventos WHERE id = $1', [u.evento_id]) : null;
    res.json({ ...conNotas(u), evento_nombre: ev?.nombre ?? null });
  });

  const passwordTemporal = () => randomBytes(6).toString('base64url');

  app.post('/api/usuarios', marketing, async (req, res) => {
    const b = req.body ?? {};
    const email = texto(b.email, 200)?.toLowerCase();
    const nombre = texto(b.nombre, 120);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falla(400, 'Escribe un email válido.');
    if (!nombre) falla(400, 'Escribe el nombre.');
    const rol = ['maker', 'marketing', 'almacen'].includes(b.rol) ? b.rol : 'maker';
    const perfil = rol === 'maker' ? (PERFILES.includes(b.perfil) ? b.perfil : falla(400, 'Elige el perfil del maker.')) : null;
    if (await db.uno('SELECT 1 FROM usuarios WHERE email = $1', [email])) falla(409, 'Ya hay un usuario con ese email.');
    const password = typeof b.password === 'string' && b.password.length >= 8 ? b.password : passwordTemporal();
    const columnas = ['email', 'password_hash', 'nombre', 'rol', 'perfil', 'notas_internas', ...CAMPOS_PERFIL];
    const valores = [email, hashPassword(password), nombre, rol, perfil, texto(b.notas_internas, 2000), ...CAMPOS_PERFIL.map((k) => texto(b[k]))];
    const u = await db.uno(
      `INSERT INTO usuarios (${columnas.join(', ')}) VALUES (${columnas.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      valores,
    );
    res.status(201).json({ usuario: usuarioPublico(u), password_temporal: b.password ? undefined : password });
  });

  app.patch('/api/usuarios/:id', marketing, async (req, res) => {
    const u = await usuarioOFalla(Number(req.params.id));
    const b = req.body ?? {};
    const cambios = {};
    for (const k of CAMPOS_PERFIL) if (k in b) cambios[k] = texto(b[k]);
    if ('nombre' in b) cambios.nombre = texto(b.nombre, 120) ?? u.nombre;
    if ('notas_internas' in b) cambios.notas_internas = texto(b.notas_internas, 2000);
    if ('perfil' in b && u.rol === 'maker' && PERFILES.includes(b.perfil)) cambios.perfil = b.perfil;
    if ('activo' in b) {
      if (u.id === req.usuario.id && !b.activo) falla(400, 'No puedes desactivar tu propia cuenta.');
      cambios.activo = !!b.activo;
    }
    await actualizarUsuario(u.id, cambios);
    if (cambios.activo === false) await db.query('DELETE FROM sesiones WHERE usuario_id = $1', [u.id]);
    res.json(conNotas(await leerUsuario(u.id)));
  });

  app.post('/api/usuarios/:id/password', marketing, async (req, res) => {
    const u = await usuarioOFalla(Number(req.params.id));
    const password = passwordTemporal();
    await db.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashPassword(password), u.id]);
    await db.query('DELETE FROM sesiones WHERE usuario_id = $1', [u.id]);
    res.json({ password_temporal: password });
  });

  // ── Errores ───────────────────────────────────────────────────────────
  app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ErrorApi) return res.status(err.status).json({ error: err.message });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Petición mal formada.' });
    console.error(err);
    res.status(500).json({ error: 'Algo ha fallado. Inténtalo de nuevo.' });
  });

  return app;
}
