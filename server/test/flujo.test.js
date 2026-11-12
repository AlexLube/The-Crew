import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { crearApp } from '../src/app.js';
import { abrirDB } from '../src/db.js';
import { sembrar } from '../src/seed.js';

let servidor;
let base;
let db;

before(async () => {
  db = abrirDB(':memory:');
  sembrar(db);
  const app = crearApp({ db, env: { NODE_ENV: 'test', EMAIL_ALMACEN: 'almacen@test', EMAIL_MARKETING: 'mkt@test' } });
  await new Promise((r) => (servidor = app.listen(0, r)));
  base = `http://localhost:${servidor.address().port}/api`;
});
after(() => servidor.close());

async function api(ruta, { token, metodo = 'GET', cuerpo } = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: res.status, datos: await res.json() };
}
const entrar = async (email) => (await api('/auth/login', { metodo: 'POST', cuerpo: { email, password: 'thecrew2026' } })).datos.token;
const emails = () => db.prepare('SELECT para, asunto FROM emails ORDER BY id').all();

describe('acceso y roles', () => {
  test('contraseña incorrecta', async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { email: 'josema@ejemplo.com', password: 'mal' } });
    assert.equal(r.status, 401);
  });
  test('un maker no entra al panel de marketing', async () => {
    const t = await entrar('josema@ejemplo.com');
    assert.equal((await api('/usuarios', { token: t })).status, 403);
    assert.equal((await api('/pedidos/1/aprobar', { token: t, metodo: 'POST' })).status, 403);
  });
  test('sin sesión no hay datos', async () => {
    assert.equal((await api('/pedidos')).status, 401);
  });
});

describe('flujo de pedido', () => {
  test('solicitud del maker → aprobar → lanzar a almacén → enviado', async () => {
    const maker = await entrar('joel@ejemplo.com');
    const mkt = await entrar('marketing@issaline.com');
    const prenda = (await api('/productos', { token: maker })).datos.find((p) => p.tallas.includes('M'));

    const sinTalla = await api('/pedidos', { token: maker, metodo: 'POST', cuerpo: { lineas: [{ producto_id: prenda.id }] } });
    assert.equal(sinTalla.status, 400);

    const nuevo = await api('/pedidos', {
      token: maker,
      metodo: 'POST',
      cuerpo: { tipo: 'reposicion', notas: 'Gracias', lineas: [{ producto_id: prenda.id, talla: 'M', cantidad: 2 }] },
    });
    assert.equal(nuevo.status, 201);
    assert.equal(nuevo.datos.estado, 'pendiente');
    assert.match(nuevo.datos.codigo, /^TC-\d{4}-\d{4}$/);
    assert.equal(nuevo.datos.envio_ciudad, 'Getafe');
    assert.ok(emails().some((e) => e.para === 'mkt@test' && e.asunto.includes(nuevo.datos.codigo)));

    // otro maker no lo ve
    const otro = await entrar('paula@ejemplo.com');
    assert.equal((await api(`/pedidos/${nuevo.datos.id}`, { token: otro })).status, 404);

    const aprobado = await api(`/pedidos/${nuevo.datos.id}/aprobar`, { token: mkt, metodo: 'POST', cuerpo: { nota: 'interno' } });
    assert.equal(aprobado.datos.estado, 'aprobado');
    // el maker no ve la nota interna
    const visto = await api(`/pedidos/${nuevo.datos.id}`, { token: maker });
    assert.equal(visto.datos.nota_marketing, undefined);
    assert.equal(visto.datos.estado_texto, 'Aprobado');

    const lanzado = await api(`/pedidos/${nuevo.datos.id}/lanzar`, { token: mkt, metodo: 'POST' });
    assert.equal(lanzado.datos.estado, 'en_almacen');
    assert.ok(emails().some((e) => e.para === 'almacen@test, mkt@test' && e.asunto.startsWith(`Preparar pedido ${nuevo.datos.codigo}`)));

    assert.equal((await api(`/pedidos/${nuevo.datos.id}/lanzar`, { token: mkt, metodo: 'POST' })).status, 409);

    const enviado = await api(`/pedidos/${nuevo.datos.id}/enviado`, { token: mkt, metodo: 'POST', cuerpo: { seguimiento: 'SEUR 123' } });
    assert.equal(enviado.datos.estado, 'enviado');
    assert.deepEqual(
      enviado.datos.historial.map((h) => h.estado),
      ['pendiente', 'aprobado', 'en_almacen', 'enviado'],
    );
    assert.ok(emails().some((e) => e.para === 'joel@ejemplo.com' && e.asunto.includes('de camino')));
  });

  test('rechazo con motivo obligatorio', async () => {
    const maker = await entrar('alvaro@ejemplo.com');
    const mkt = await entrar('marketing@issaline.com');
    const gorra = (await api('/productos', { token: maker })).datos.find((p) => p.tallas.length === 0);
    const p = (await api('/pedidos', { token: maker, metodo: 'POST', cuerpo: { tipo: 'otro', lineas: [{ producto_id: gorra.id }] } })).datos;
    assert.equal((await api(`/pedidos/${p.id}/rechazar`, { token: mkt, metodo: 'POST', cuerpo: {} })).status, 400);
    const r = await api(`/pedidos/${p.id}/rechazar`, { token: mkt, metodo: 'POST', cuerpo: { motivo: 'Sin stock' } });
    assert.equal(r.datos.estado, 'rechazado');
    assert.equal(r.datos.motivo_rechazo, 'Sin stock');
  });

  test('un embajador solo tiene un pedido mensual al mes', async () => {
    const maker = await entrar('josema@ejemplo.com'); // ya tiene uno pendiente este mes en los datos de ejemplo
    const prenda = (await api('/productos', { token: maker })).datos.find((p) => p.tallas.includes('M'));
    const r = await api('/pedidos', { token: maker, metodo: 'POST', cuerpo: { tipo: 'mensual', lineas: [{ producto_id: prenda.id, talla: 'L' }] } });
    assert.equal(r.status, 409);
  });

  test('marketing da de alta un pedido recibido por teléfono y lo lanza directamente', async () => {
    const mkt = await entrar('marketing@issaline.com');
    const usuarios = (await api('/usuarios?rol=maker', { token: mkt })).datos;
    const paula = usuarios.find((u) => u.email === 'paula@ejemplo.com');
    const prenda = (await api('/productos', { token: mkt })).datos.find((p) => p.tallas.includes('M'));
    const p = await api('/pedidos', {
      token: mkt,
      metodo: 'POST',
      cuerpo: { usuario_id: paula.id, origen: 'telefono', tipo: 'muestra', lineas: [{ producto_id: prenda.id, talla: 'S' }] },
    });
    assert.equal(p.status, 201);
    assert.equal(p.datos.origen, 'telefono');
    const l = await api(`/pedidos/${p.datos.id}/lanzar`, { token: mkt, metodo: 'POST' });
    assert.deepEqual(
      l.datos.historial.map((h) => h.estado),
      ['pendiente', 'aprobado', 'en_almacen'],
    );
  });
});

describe('usuarios', () => {
  test('alta de maker con contraseña temporal y entrada', async () => {
    const mkt = await entrar('marketing@issaline.com');
    const r = await api('/usuarios', {
      token: mkt,
      metodo: 'POST',
      cuerpo: { email: 'Nueva@Ejemplo.com', nombre: 'Nueva Maker', perfil: 'singular_worker', ciudad: 'Bilbao' },
    });
    assert.equal(r.status, 201);
    assert.ok(r.datos.password_temporal);
    const login = await api('/auth/login', { metodo: 'POST', cuerpo: { email: 'nueva@ejemplo.com', password: r.datos.password_temporal } });
    assert.equal(login.status, 200);
    assert.equal(login.datos.usuario.perfil, 'singular_worker');
    assert.equal(login.datos.usuario.password_hash, undefined);

    const dup = await api('/usuarios', { token: mkt, metodo: 'POST', cuerpo: { email: 'nueva@ejemplo.com', nombre: 'X', perfil: 'embajador' } });
    assert.equal(dup.status, 409);

    // desactivar cierra la sesión
    await api(`/usuarios/${r.datos.usuario.id}`, { token: mkt, metodo: 'PATCH', cuerpo: { activo: false } });
    assert.equal((await api('/yo', { token: login.datos.token })).status, 401);
  });

  test('sin dirección no se puede pedir', async () => {
    const mkt = await entrar('marketing@issaline.com');
    const r = await api('/usuarios', { token: mkt, metodo: 'POST', cuerpo: { email: 'sindir@ejemplo.com', nombre: 'Sin Dir', perfil: 'embajador', password: 'contraseña1' } });
    const t = (await api('/auth/login', { metodo: 'POST', cuerpo: { email: 'sindir@ejemplo.com', password: 'contraseña1' } })).datos.token;
    const prenda = (await api('/productos', { token: t })).datos.find((p) => p.tallas.includes('M'));
    const p = await api('/pedidos', { token: t, metodo: 'POST', cuerpo: { lineas: [{ producto_id: prenda.id, talla: 'M' }] } });
    assert.equal(p.status, 400);
    assert.match(p.datos.error, /dirección/);
    assert.ok(r.datos.usuario.id);
  });
});
