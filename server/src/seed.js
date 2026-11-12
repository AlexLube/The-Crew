import { hashPassword } from './auth.js';
import { abrirDB } from './db.js';

/**
 * Datos de ejemplo para probar la app. Los makers son los de
 * thecrew.issaline.com; el catálogo es inventado hasta tener el real.
 * Todas las cuentas usan la contraseña "thecrew2026".
 */
export function sembrar(db) {
  if (db.prepare('SELECT 1 FROM usuarios').get()) return false;
  const pass = hashPassword('thecrew2026');

  const ev = db.prepare("INSERT INTO eventos (nombre, lugar, fecha) VALUES ('Territorio Makers', 'Valencia', '2026-10-17')").run();

  const usuario = db.prepare(
    `INSERT INTO usuarios (email, password_hash, nombre, rol, perfil, telefono, oficio, taller, instagram, direccion, codigo_postal, ciudad, provincia, tallas, evento_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const u = (...a) => Number(usuario.run(...a).lastInsertRowid);
  const mkt = u('marketing@issaline.com', pass, 'Laura (Marketing)', 'marketing', null, null, null, null, null, null, null, null, null, null, null);
  u('almacen@issaline.com', pass, 'Almacén Issaline', 'almacen', null, null, null, null, null, null, null, null, null, null, null);
  const josema = u('josema@ejemplo.com', pass, 'José Manuel Muñoz', 'maker', 'embajador', '600 111 222', 'Herrería', 'MetalMundo', '@metalmundo.maker', 'Calle de la Forja 12', '46001', 'Valencia', 'Valencia', 'Chaqueta L · Pantalón 44', null);
  const paula = u('paula@ejemplo.com', pass, 'Paula Nuévalos', 'maker', 'embajador', '600 333 444', 'Agricultura', 'Finca Nuévalos', '@agropauli', 'Camino del Huerto 3', '46600', 'Alzira', 'Valencia', 'Chaqueta S · Pantalón 38', null);
  u('joel@ejemplo.com', pass, 'Joel Martínez', 'maker', 'singular_worker', '600 555 666', 'Ebanistería', 'Martínez Woodworking', '@martinezwoodworking', 'Polígono Sur, nave 8', '28901', 'Getafe', 'Madrid', null, null);
  u('alvaro@ejemplo.com', pass, 'Álvaro Indias Salguero', 'maker', 'maker_evento', '600 777 888', 'Maker', 'Arte Otro Workshop', '@arteotroworkshop', 'Calle Taller 5', '41001', 'Sevilla', 'Sevilla', null, Number(ev.lastInsertRowid));

  const prod = db.prepare('INSERT INTO productos (sku, nombre, categoria, descripcion, tallas, tipo, tono) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const ropa = JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  const pantalon = JSON.stringify(['36', '38', '40', '42', '44', '46', '48', '50']);
  const p = (...a) => Number(prod.run(...a).lastInsertRowid);
  const chaqueta = p('ISS-CHQ-INV', 'Chaqueta de invierno', 'Chaquetas', 'Acolchada, cortavientos y con refuerzos en codos.', ropa, 'prenda', 'herreria');
  p('ISS-CHQ-SOFT', 'Chaqueta softshell', 'Chaquetas', 'Ligera y transpirable para entretiempo.', ropa, 'prenda', 'mecanica');
  const pant = p('ISS-PAN-MUL', 'Pantalón multibolsillos', 'Pantalones', 'Tejido elástico con rodilleras.', pantalon, 'prenda', 'ebanisteria');
  p('ISS-PAN-COR', 'Pantalón corto de trabajo', 'Pantalones', 'Para el verano en el taller.', pantalon, 'prenda', 'agricultura');
  const cami = p('ISS-CAM-TC', 'Camiseta The Crew', 'Camisetas', 'Algodón orgánico con el logo de The Crew.', ropa, 'prenda', 'marca');
  p('ISS-SUD-TC', 'Sudadera The Crew', 'Camisetas', 'Con capucha y bolsillo canguro.', ropa, 'prenda', 'maker');
  p('ISS-GOR', 'Gorra Issaline', 'Accesorios', 'Talla única ajustable.', '[]', 'accesorio', 'marca');
  p('ISS-GUA', 'Guantes de trabajo', 'Accesorios', 'Agarre reforzado.', JSON.stringify(['S', 'M', 'L', 'XL']), 'accesorio', 'herreria');

  const pedido = db.prepare(
    `INSERT INTO pedidos (codigo, usuario_id, estado, tipo, origen, notas, creado_por, envio_nombre, envio_telefono, envio_direccion, envio_codigo_postal, envio_ciudad, envio_provincia, creado_at, actualizado_at)
     SELECT ?, id, ?, ?, ?, ?, ?, nombre, telefono, direccion, codigo_postal, ciudad, provincia, ?, ? FROM usuarios WHERE id = ?`,
  );
  const linea = db.prepare('INSERT INTO pedido_lineas (pedido_id, producto_id, talla, cantidad) VALUES (?, ?, ?, ?)');
  const hist = db.prepare('INSERT INTO pedido_historial (pedido_id, estado, usuario_id, nota, creado_at) VALUES (?, ?, ?, ?, ?)');
  const hace = (dias) => new Date(Date.now() - dias * 864e5).toISOString().replace('T', ' ').slice(0, 19);

  let n = 0;
  const crear = (usuarioId, estado, tipo, origen, notas, dias, lineas, pasos) => {
    const id = ++n;
    pedido.run(`TC-2026-${String(id).padStart(4, '0')}`, estado, tipo, origen, notas, origen === 'app' ? usuarioId : mkt, hace(dias), hace(pasos.at(-1)[2]), usuarioId);
    for (const l of lineas) linea.run(id, ...l);
    for (const [e, quien, d, nota] of pasos) hist.run(id, e, quien, nota ?? null, hace(d));
  };
  crear(josema, 'enviado', 'mensual', 'app', null, 40, [[chaqueta, 'L', 1]], [
    ['pendiente', josema, 40, 'Solicitado desde la app'],
    ['aprobado', mkt, 39],
    ['en_almacen', mkt, 39, 'Enviado a almacén para preparar'],
    ['enviado', mkt, 37],
  ]);
  crear(paula, 'en_almacen', 'mensual', 'telefono', 'Lo pidió por teléfono', 3, [[pant, '38', 1], [cami, 'S', 2]], [
    ['pendiente', mkt, 3, 'Alta manual por Laura (Marketing) (por teléfono)'],
    ['aprobado', mkt, 2],
    ['en_almacen', mkt, 2, 'Enviado a almacén para preparar'],
  ]);
  crear(josema, 'pendiente', 'mensual', 'app', 'Si puede ser, antes de la sesión de fotos del 28.', 0, [[pant, '44', 1], [cami, 'L', 1]], [
    ['pendiente', josema, 0, 'Solicitado desde la app'],
  ]);
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hecho = sembrar(abrirDB());
  console.log(hecho ? 'Datos de ejemplo cargados. Contraseña de todas las cuentas: thecrew2026' : 'La base de datos ya tenía datos; no se ha tocado.');
}
