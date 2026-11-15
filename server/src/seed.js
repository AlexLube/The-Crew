import { hashPassword } from './auth.js';

/**
 * Datos de ejemplo para probar la app. Los makers son los de
 * thecrew.issaline.com; el catálogo es inventado hasta tener el real.
 * Todas las cuentas usan la contraseña "thecrew2026".
 * Solo se cargan si la base de datos está vacía.
 */
export async function sembrar(db) {
  if (await db.uno('SELECT 1 FROM usuarios LIMIT 1')) return false;
  const pass = hashPassword('thecrew2026');

  await db.tx(async (q) => {
    const ev = await q.uno("INSERT INTO eventos (nombre, lugar, fecha) VALUES ('Territorio Makers', 'Valencia', '2026-10-17') RETURNING id");

    const cols = ['email', 'password_hash', 'nombre', 'rol', 'perfil', 'telefono', 'oficio', 'taller', 'instagram', 'direccion', 'codigo_postal', 'ciudad', 'provincia', 'tallas', 'evento_id'];
    const u = async (...v) =>
      (await q.uno(`INSERT INTO usuarios (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`, [...v, ...Array(cols.length - v.length).fill(null)])).id;
    const mkt = await u('marketing@issaline.com', pass, 'Laura (Marketing)', 'marketing');
    await u('almacen@issaline.com', pass, 'Almacén Issaline', 'almacen');
    const josema = await u('josema@ejemplo.com', pass, 'José Manuel Muñoz', 'maker', 'embajador', '600 111 222', 'Herrería', 'MetalMundo', '@metalmundo.maker', 'Calle de la Forja 12', '46001', 'Valencia', 'Valencia', 'Chaqueta L · Pantalón 44');
    const paula = await u('paula@ejemplo.com', pass, 'Paula Nuévalos', 'maker', 'embajador', '600 333 444', 'Agricultura', 'Finca Nuévalos', '@agropauli', 'Camino del Huerto 3', '46600', 'Alzira', 'Valencia', 'Chaqueta S · Pantalón 38');
    await u('joel@ejemplo.com', pass, 'Joel Martínez', 'maker', 'singular_worker', '600 555 666', 'Ebanistería', 'Martínez Woodworking', '@martinezwoodworking', 'Polígono Sur, nave 8', '28901', 'Getafe', 'Madrid');
    await u('alvaro@ejemplo.com', pass, 'Álvaro Indias Salguero', 'maker', 'maker_evento', '600 777 888', 'Maker', 'Arte Otro Workshop', '@arteotroworkshop', 'Calle Taller 5', '41001', 'Sevilla', 'Sevilla', null, ev.id);

    const ropa = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const pantalon = ['36', '38', '40', '42', '44', '46', '48', '50'];
    const p = async (sku, nombre, categoria, descripcion, tallas, tipo, tono) =>
      (
        await q.uno('INSERT INTO productos (sku, nombre, categoria, descripcion, tallas, tipo, tono) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id', [
          sku,
          nombre,
          categoria,
          descripcion,
          JSON.stringify(tallas),
          tipo,
          tono,
        ])
      ).id;
    const chaqueta = await p('ISS-CHQ-INV', 'Chaqueta de invierno', 'Chaquetas', 'Acolchada, cortavientos y con refuerzos en codos.', ropa, 'prenda', 'herreria');
    await p('ISS-CHQ-SOFT', 'Chaqueta softshell', 'Chaquetas', 'Ligera y transpirable para entretiempo.', ropa, 'prenda', 'mecanica');
    const pant = await p('ISS-PAN-MUL', 'Pantalón multibolsillos', 'Pantalones', 'Tejido elástico con rodilleras.', pantalon, 'prenda', 'ebanisteria');
    await p('ISS-PAN-COR', 'Pantalón corto de trabajo', 'Pantalones', 'Para el verano en el taller.', pantalon, 'prenda', 'agricultura');
    const cami = await p('ISS-CAM-TC', 'Camiseta The Crew', 'Camisetas', 'Algodón orgánico con el logo de The Crew.', ropa, 'prenda', 'marca');
    await p('ISS-SUD-TC', 'Sudadera The Crew', 'Camisetas', 'Con capucha y bolsillo canguro.', ropa, 'prenda', 'maker');
    await p('ISS-GOR', 'Gorra Issaline', 'Accesorios', 'Talla única ajustable.', [], 'accesorio', 'marca');
    await p('ISS-GUA', 'Guantes de trabajo', 'Accesorios', 'Agarre reforzado.', ['S', 'M', 'L', 'XL'], 'accesorio', 'herreria');

    const hace = (dias) => new Date(Date.now() - dias * 864e5).toISOString();
    const crear = async (usuarioId, estado, tipo, origen, notas, dias, lineas, pasos) => {
      const { id } = await q.uno(
        `INSERT INTO pedidos (usuario_id, estado, tipo, origen, notas, creado_por, envio_nombre, envio_telefono, envio_direccion, envio_codigo_postal, envio_ciudad, envio_provincia, creado_at, actualizado_at)
         SELECT id, $2, $3, $4, $5, $6, nombre, telefono, direccion, codigo_postal, ciudad, provincia, $7, $8 FROM usuarios WHERE id = $1 RETURNING id`,
        [usuarioId, estado, tipo, origen, notas, origen === 'app' ? usuarioId : mkt, hace(dias), hace(pasos.at(-1)[2])],
      );
      await q.query('UPDATE pedidos SET codigo = $1 WHERE id = $2', [`TC-2026-${String(id).padStart(4, '0')}`, id]);
      for (const [prod, talla, n] of lineas) {
        await q.query('INSERT INTO pedido_lineas (pedido_id, producto_id, talla, cantidad) VALUES ($1, $2, $3, $4)', [id, prod, talla, n]);
      }
      for (const [e, quien, d, nota] of pasos) {
        await q.query('INSERT INTO pedido_historial (pedido_id, estado, usuario_id, nota, creado_at) VALUES ($1, $2, $3, $4, $5)', [id, e, quien, nota ?? null, hace(d)]);
      }
    };
    await crear(josema, 'enviado', 'mensual', 'app', null, 40, [[chaqueta, 'L', 1]], [
      ['pendiente', josema, 40, 'Solicitado desde la app'],
      ['aprobado', mkt, 39],
      ['en_almacen', mkt, 39, 'Enviado a almacén para preparar'],
      ['enviado', mkt, 37],
    ]);
    await crear(paula, 'en_almacen', 'mensual', 'telefono', 'Lo pidió por teléfono', 3, [[pant, '38', 1], [cami, 'S', 2]], [
      ['pendiente', mkt, 3, 'Alta manual por Laura (Marketing) (por teléfono)'],
      ['aprobado', mkt, 2],
      ['en_almacen', mkt, 2, 'Enviado a almacén para preparar'],
    ]);
    await crear(josema, 'pendiente', 'mensual', 'app', 'Si puede ser, antes de la sesión de fotos del 28.', 0, [[pant, '44', 1], [cami, 'L', 1]], [
      ['pendiente', josema, 0, 'Solicitado desde la app'],
    ]);
  });
  return true;
}
