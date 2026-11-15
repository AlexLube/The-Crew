/**
 * API de demostración que funciona entera en el navegador, sin servidor.
 *
 * Se activa con EXPO_PUBLIC_DEMO=1 (la versión publicada en Netlify).
 * Reproduce las mismas rutas y reglas que server/src/app.js con los
 * mismos datos de ejemplo, y guarda los cambios en el navegador de
 * cada persona. No envía emails.
 */
import type { Estado, Origen, Perfil, Rol, TipoPedido } from './api';

type U = {
  id: number;
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  perfil: Perfil | null;
  telefono: string | null;
  oficio: string | null;
  taller: string | null;
  instagram: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  tallas: string | null;
  activo: boolean;
  evento_nombre: string | null;
  notas_internas: string | null;
  acepta_comunicaciones: boolean;
  origen_alta: string;
  creado_at: string;
};
type Prod = { id: number; sku: string; nombre: string; categoria: string; descripcion: string | null; tallas: string[]; tipo: string; tono: string | null; activo: boolean };
type Linea = { id: number; producto_id: number; talla: string | null; cantidad: number };
type Hist = { estado: Estado; usuario_id: number | null; nota: string | null; creado_at: string };
type P = {
  id: number;
  codigo: string;
  usuario_id: number;
  estado: Estado;
  tipo: TipoPedido;
  origen: Origen;
  notas: string | null;
  nota_marketing: string | null;
  motivo_rechazo: string | null;
  seguimiento: string | null;
  envio_nombre: string | null;
  envio_telefono: string | null;
  envio_direccion: string | null;
  envio_codigo_postal: string | null;
  envio_ciudad: string | null;
  envio_provincia: string | null;
  creado_por: number;
  creado_at: string;
  actualizado_at: string;
  lineas: Linea[];
  historial: Hist[];
};
type Datos = { usuarios: U[]; productos: Prod[]; pedidos: P[]; sesiones: Record<string, number>; sec: number };

const CLAVE = 'thecrew.demo.v1';
const ESTADOS: Estado[] = ['pendiente', 'aprobado', 'en_almacen', 'enviado', 'rechazado', 'cancelado'];
const PERFILES: Perfil[] = ['embajador', 'singular_worker', 'maker_evento'];
const TIPOS: TipoPedido[] = ['mensual', 'reposicion', 'welcome_pack', 'muestra', 'regalo', 'otro'];
const TIPOS_MAKER: TipoPedido[] = ['mensual', 'reposicion', 'otro'];
const CAMPOS_PERFIL = ['telefono', 'oficio', 'taller', 'instagram', 'direccion', 'codigo_postal', 'ciudad', 'provincia', 'tallas'] as const;
const ETIQUETA_ESTADO: Record<Estado, string> = {
  pendiente: 'Pendiente de aprobar',
  aprobado: 'Aprobado',
  en_almacen: 'Aprobado · preparando el envío',
  enviado: 'Enviado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};
const ETIQUETA_TIPO: Record<TipoPedido, string> = {
  mensual: 'Pedido mensual',
  reposicion: 'Reposición',
  welcome_pack: 'Welcome pack',
  muestra: 'Muestras',
  regalo: 'Regalo',
  otro: 'Otro',
};

export const PASSWORD_DEMO = 'thecrew2026';

const ahora = () => new Date().toISOString();
const hace = (dias: number) => new Date(Date.now() - dias * 864e5).toISOString();
const texto = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

function sembrar(): Datos {
  const base = { telefono: null, oficio: null, taller: null, instagram: null, direccion: null, codigo_postal: null, ciudad: null, provincia: null, tallas: null, evento_nombre: null, notas_internas: null, activo: true, acepta_comunicaciones: false, origen_alta: 'marketing', password: PASSWORD_DEMO, creado_at: hace(60) };
  const usuarios: U[] = [
    { ...base, id: 1, email: 'marketing@issaline.com', nombre: 'Laura (Marketing)', rol: 'marketing', perfil: null },
    { ...base, id: 2, email: 'almacen@issaline.com', nombre: 'Almacén Issaline', rol: 'almacen', perfil: null },
    { ...base, id: 3, email: 'josema@ejemplo.com', nombre: 'José Manuel Muñoz', rol: 'maker', perfil: 'embajador', telefono: '600 111 222', oficio: 'Herrería', taller: 'MetalMundo', instagram: '@metalmundo.maker', direccion: 'Calle de la Forja 12', codigo_postal: '46001', ciudad: 'Valencia', provincia: 'Valencia', tallas: 'Chaqueta L · Pantalón 44' },
    { ...base, id: 4, email: 'paula@ejemplo.com', nombre: 'Paula Nuévalos', rol: 'maker', perfil: 'embajador', telefono: '600 333 444', oficio: 'Agricultura', taller: 'Finca Nuévalos', instagram: '@agropauli', direccion: 'Camino del Huerto 3', codigo_postal: '46600', ciudad: 'Alzira', provincia: 'Valencia', tallas: 'Chaqueta S · Pantalón 38' },
    { ...base, id: 5, email: 'joel@ejemplo.com', nombre: 'Joel Martínez', rol: 'maker', perfil: 'singular_worker', telefono: '600 555 666', oficio: 'Ebanistería', taller: 'Martínez Woodworking', instagram: '@martinezwoodworking', direccion: 'Polígono Sur, nave 8', codigo_postal: '28901', ciudad: 'Getafe', provincia: 'Madrid' },
    { ...base, id: 6, email: 'alvaro@ejemplo.com', nombre: 'Álvaro Indias Salguero', rol: 'maker', perfil: 'maker_evento', telefono: '600 777 888', oficio: 'Maker', taller: 'Arte Otro Workshop', instagram: '@arteotroworkshop', direccion: 'Calle Taller 5', codigo_postal: '41001', ciudad: 'Sevilla', provincia: 'Sevilla', evento_nombre: 'Territorio Makers' },
  ];
  const ropa = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const pant = ['36', '38', '40', '42', '44', '46', '48', '50'];
  const productos: Prod[] = [
    ['ISS-CHQ-INV', 'Chaqueta de invierno', 'Chaquetas', 'Acolchada, cortavientos y con refuerzos en codos.', ropa, 'prenda', 'herreria'],
    ['ISS-CHQ-SOFT', 'Chaqueta softshell', 'Chaquetas', 'Ligera y transpirable para entretiempo.', ropa, 'prenda', 'mecanica'],
    ['ISS-PAN-MUL', 'Pantalón multibolsillos', 'Pantalones', 'Tejido elástico con rodilleras.', pant, 'prenda', 'ebanisteria'],
    ['ISS-PAN-COR', 'Pantalón corto de trabajo', 'Pantalones', 'Para el verano en el taller.', pant, 'prenda', 'agricultura'],
    ['ISS-CAM-TC', 'Camiseta The Crew', 'Camisetas', 'Algodón orgánico con el logo de The Crew.', ropa, 'prenda', 'marca'],
    ['ISS-SUD-TC', 'Sudadera The Crew', 'Camisetas', 'Con capucha y bolsillo canguro.', ropa, 'prenda', 'maker'],
    ['ISS-GOR', 'Gorra Issaline', 'Accesorios', 'Talla única ajustable.', [], 'accesorio', 'marca'],
    ['ISS-GUA', 'Guantes de trabajo', 'Accesorios', 'Agarre reforzado.', ['S', 'M', 'L', 'XL'], 'accesorio', 'herreria'],
  ].map(([sku, nombre, categoria, descripcion, tallas, tipo, tono], i) => ({
    id: i + 1,
    sku: sku as string,
    nombre: nombre as string,
    categoria: categoria as string,
    descripcion: descripcion as string,
    tallas: tallas as string[],
    tipo: tipo as string,
    tono: tono as string,
    activo: true,
  }));
  const envio = (u: U) => ({
    envio_nombre: u.nombre,
    envio_telefono: u.telefono,
    envio_direccion: u.direccion,
    envio_codigo_postal: u.codigo_postal,
    envio_ciudad: u.ciudad,
    envio_provincia: u.provincia,
  });
  const p = (id: number, u: U, estado: Estado, tipo: TipoPedido, origen: Origen, notas: string | null, dias: number, lineas: [number, string | null, number][], historial: [Estado, number, number, string?][]): P => ({
    id,
    codigo: `TC-2026-${String(id).padStart(4, '0')}`,
    usuario_id: u.id,
    estado,
    tipo,
    origen,
    notas,
    nota_marketing: null,
    motivo_rechazo: null,
    seguimiento: null,
    ...envio(u),
    creado_por: origen === 'app' ? u.id : 1,
    creado_at: hace(dias),
    actualizado_at: hace(historial.at(-1)![2]),
    lineas: lineas.map(([producto_id, talla, cantidad], i) => ({ id: id * 100 + i, producto_id, talla, cantidad })),
    historial: historial.map(([e, quien, d, nota]) => ({ estado: e, usuario_id: quien, nota: nota ?? null, creado_at: hace(d) })),
  });
  const [, , josema, paula] = usuarios;
  const pedidos = [
    p(1, josema, 'enviado', 'mensual', 'app', null, 40, [[1, 'L', 1]], [
      ['pendiente', 3, 40, 'Solicitado desde la app'],
      ['aprobado', 1, 39],
      ['en_almacen', 1, 39, 'Enviado a almacén para preparar'],
      ['enviado', 1, 37],
    ]),
    p(2, paula, 'en_almacen', 'mensual', 'telefono', 'Lo pidió por teléfono', 3, [[3, '38', 1], [5, 'S', 2]], [
      ['pendiente', 1, 3, 'Alta manual por Laura (Marketing) (por teléfono)'],
      ['aprobado', 1, 2],
      ['en_almacen', 1, 2, 'Enviado a almacén para preparar'],
    ]),
    p(3, josema, 'pendiente', 'mensual', 'app', 'Si puede ser, antes de la sesión de fotos del 28.', 0, [[3, '44', 1], [5, 'L', 1]], [
      ['pendiente', 3, 0, 'Solicitado desde la app'],
    ]),
  ];
  return { usuarios, productos, pedidos, sesiones: {}, sec: 100 };
}

let memoria: Datos | null = null;
function datos(): Datos {
  if (memoria) return memoria;
  try {
    const guardado = globalThis.localStorage?.getItem(CLAVE);
    if (guardado) memoria = JSON.parse(guardado) as Datos;
  } catch {}
  memoria ??= sembrar();
  return memoria;
}
function guardar() {
  try {
    globalThis.localStorage?.setItem(CLAVE, JSON.stringify(memoria));
  } catch {}
}

/** Vuelve a los datos de ejemplo del principio. */
export function reiniciarDemo() {
  memoria = sembrar();
  guardar();
}

class Fallo extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}
const falla = (status: number, mensaje: string): never => {
  throw new Fallo(status, mensaje);
};

function publico(u: U, staff = false) {
  const { password, notas_internas, ...resto } = u;
  void password;
  return staff ? { ...resto, notas_internas } : resto;
}

function completo(d: Datos, p: P) {
  const u = d.usuarios.find((x) => x.id === p.usuario_id)!;
  return {
    ...p,
    usuario_nombre: u.nombre,
    usuario_email: u.email,
    usuario_perfil: u.perfil,
    unidades: p.lineas.reduce((n, l) => n + l.cantidad, 0),
    estado_texto: ETIQUETA_ESTADO[p.estado],
    tipo_texto: ETIQUETA_TIPO[p.tipo],
    lineas: p.lineas.map((l) => {
      const pr = d.productos.find((x) => x.id === l.producto_id)!;
      return { ...l, nombre: pr.nombre, sku: pr.sku, categoria: pr.categoria, tono: pr.tono };
    }),
    historial: p.historial.map((h) => {
      const quien = d.usuarios.find((x) => x.id === h.usuario_id);
      return { ...h, usuario_nombre: quien?.nombre ?? null, usuario_rol: quien?.rol ?? null };
    }),
  };
}

function paraMaker(p: ReturnType<typeof completo>) {
  const { nota_marketing, ...resto } = p;
  void nota_marketing;
  return { ...resto, historial: p.historial.map((h) => ({ ...h, usuario_nombre: h.usuario_rol === 'maker' ? h.usuario_nombre : 'Issaline' })) };
}

function cambiar(p: P, estado: Estado, quien: number, nota: string | null, extra: Partial<P> = {}) {
  Object.assign(p, extra, { estado, actualizado_at: ahora() });
  p.historial.push({ estado, usuario_id: quien, nota, creado_at: ahora() });
}

function token() {
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
}

type Cuerpo = Record<string, any>;

function manejar(ruta: string, metodo: string, b: Cuerpo, tok: string | null): unknown {
  const d = datos();
  const [camino, qs] = ruta.split('?');
  const q = new URLSearchParams(qs ?? '');
  const partes = camino.split('/').filter(Boolean);

  if (camino === '/auth/login' && metodo === 'POST') {
    const u = d.usuarios.find((x) => x.email.toLowerCase() === String(b.email ?? '').trim().toLowerCase());
    if (!u || u.password !== b.password) falla(401, 'Email o contraseña incorrectos.');
    if (!u!.activo) falla(403, 'Tu cuenta está desactivada. Escribe a marketing de Issaline.');
    const t = token();
    d.sesiones[t] = u!.id;
    return { token: t, usuario: publico(u!) };
  }

  const yoId = tok ? d.sesiones[tok] : undefined;
  const yo = d.usuarios.find((x) => x.id === yoId && x.activo);
  if (!yo) return falla(401, 'Inicia sesión para continuar.');
  const staff = yo.rol !== 'maker';
  const soloMarketing = () => yo.rol !== 'marketing' && falla(403, 'No tienes permiso para hacer esto.');
  const soloStaff = () => !staff && falla(403, 'No tienes permiso para hacer esto.');

  if (camino === '/auth/logout') {
    delete d.sesiones[tok!];
    return { ok: true };
  }
  if (camino === '/yo' && metodo === 'GET') return publico(yo);
  if (camino === '/yo' && metodo === 'PATCH') {
    for (const k of CAMPOS_PERFIL) if (k in b) yo[k] = texto(b[k]);
    return publico(yo);
  }
  if (camino === '/yo/password') {
    if (b.actual !== yo.password) falla(400, 'La contraseña actual no es correcta.');
    if (typeof b.nueva !== 'string' || b.nueva.length < 8) falla(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    yo.password = b.nueva;
    return { ok: true };
  }

  if (camino === '/productos') return d.productos.filter((p) => p.activo || (staff && q.get('todos') === '1'));

  // ── Pedidos ──
  if (partes[0] === 'pedidos') {
    const visible = (id: number) => {
      const p = d.pedidos.find((x) => x.id === id);
      if (!p || (!staff && p.usuario_id !== yo.id)) return falla(404, 'Ese pedido no existe.');
      return p;
    };
    const responder = (p: P) => (staff ? completo(d, p) : paraMaker(completo(d, p)));

    if (partes.length === 1 && metodo === 'GET') {
      const estados = (q.get('estado') ?? '').split(',').filter((e): e is Estado => ESTADOS.includes(e as Estado));
      const perfil = q.get('perfil');
      const uid = q.get('usuario_id');
      return d.pedidos
        .filter((p) => (staff ? true : p.usuario_id === yo.id))
        .filter((p) => !staff || !uid || p.usuario_id === Number(uid))
        .filter((p) => !staff || !perfil || d.usuarios.find((u) => u.id === p.usuario_id)?.perfil === perfil)
        .filter((p) => !estados.length || estados.includes(p.estado))
        .sort((a, z) => z.creado_at.localeCompare(a.creado_at) || z.id - a.id)
        .map((p) => {
          const c = completo(d, p);
          return { ...c, lineas: undefined, historial: undefined };
        });
    }
    if (partes[1] === 'resumen') {
      soloStaff();
      return Object.fromEntries(ESTADOS.map((e) => [e, d.pedidos.filter((p) => p.estado === e).length]));
    }
    if (partes.length === 1 && metodo === 'POST') {
      if (yo.rol === 'almacen') falla(403, 'No tienes permiso para hacer esto.');
      const esMaker = yo.rol === 'maker';
      const dest = esMaker ? yo : d.usuarios.find((u) => u.id === Number(b.usuario_id) && u.rol === 'maker') ?? falla(400, 'Elige el maker al que va el pedido.');
      if (!dest.activo) falla(400, 'Ese maker está desactivado.');
      const tipo: TipoPedido = b.tipo ?? (dest.perfil === 'embajador' ? 'mensual' : 'reposicion');
      if (!TIPOS.includes(tipo) || (esMaker && !TIPOS_MAKER.includes(tipo))) falla(400, 'Tipo de pedido no válido.');
      if (esMaker && tipo === 'mensual' && dest.perfil !== 'embajador') falla(400, 'El pedido mensual es solo para embajadores.');
      const origen: Origen = esMaker ? 'app' : ['email', 'telefono', 'marketing'].includes(b.origen) ? b.origen : 'marketing';
      if (esMaker && tipo === 'mensual') {
        const mes = ahora().slice(0, 7);
        const ya = d.pedidos.find((p) => p.usuario_id === dest.id && p.tipo === 'mensual' && !['rechazado', 'cancelado'].includes(p.estado) && p.creado_at.startsWith(mes));
        if (ya) falla(409, `Ya tienes el pedido mensual de este mes (${ya.codigo}). Para algo más, pide una reposición.`);
      }
      const lineas: Cuerpo[] = Array.isArray(b.lineas) ? b.lineas : [];
      if (!lineas.length) falla(400, 'Añade al menos un artículo.');
      const limpias = lineas.map((l) => {
        const pr = d.productos.find((x) => x.id === Number(l.producto_id));
        if (!pr || (!pr.activo && esMaker)) return falla(400, 'Uno de los artículos ya no está disponible.');
        const talla = l.talla ? String(l.talla) : null;
        if (pr.tallas.length && !pr.tallas.includes(talla!)) falla(400, `Elige una talla para ${pr.nombre}.`);
        const cantidad = Number(l.cantidad ?? 1);
        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) falla(400, 'La cantidad debe estar entre 1 y 20.');
        return { producto_id: pr.id, talla: pr.tallas.length ? talla : null, cantidad };
      });
      const e = (b.envio ?? {}) as Cuerpo;
      const envio = {
        envio_nombre: texto(e.nombre) ?? dest.nombre,
        envio_telefono: texto(e.telefono) ?? dest.telefono,
        envio_direccion: texto(e.direccion) ?? dest.direccion,
        envio_codigo_postal: texto(e.codigo_postal) ?? dest.codigo_postal,
        envio_ciudad: texto(e.ciudad) ?? dest.ciudad,
        envio_provincia: texto(e.provincia) ?? dest.provincia,
      };
      if (!envio.envio_direccion || !envio.envio_codigo_postal || !envio.envio_ciudad) {
        falla(400, esMaker ? 'Completa tu dirección de envío en tu perfil antes de pedir.' : 'Falta la dirección de envío de este maker.');
      }
      const id = Math.max(0, ...d.pedidos.map((p) => p.id)) + 1;
      const p: P = {
        id,
        codigo: `TC-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`,
        usuario_id: dest.id,
        estado: 'pendiente',
        tipo,
        origen,
        notas: texto(b.notas, 1000),
        nota_marketing: esMaker ? null : texto(b.nota_marketing, 1000),
        motivo_rechazo: null,
        seguimiento: null,
        ...envio,
        creado_por: yo.id,
        creado_at: ahora(),
        actualizado_at: ahora(),
        lineas: limpias.map((l, i) => ({ ...l, id: id * 100 + i })),
        historial: [
          {
            estado: 'pendiente',
            usuario_id: yo.id,
            nota: esMaker ? 'Solicitado desde la app' : `Alta manual por ${yo.nombre} (${origen === 'telefono' ? 'por teléfono' : origen === 'email' ? 'por email' : 'marketing'})`,
            creado_at: ahora(),
          },
        ],
      };
      d.pedidos.push(p);
      return responder(p);
    }

    const p = visible(Number(partes[1]));
    if (partes.length === 2) return responder(p);
    const accion = partes[2];
    if (accion === 'aprobar') {
      soloMarketing();
      if (p.estado !== 'pendiente') falla(409, `Este pedido ya está ${ETIQUETA_ESTADO[p.estado].toLowerCase()}.`);
      const nota = texto(b.nota, 1000);
      cambiar(p, 'aprobado', yo.id, nota, nota ? { nota_marketing: nota } : {});
    } else if (accion === 'rechazar') {
      soloMarketing();
      if (!['pendiente', 'aprobado'].includes(p.estado)) falla(409, 'Solo se pueden rechazar pedidos que aún no han ido al almacén.');
      const motivo = texto(b.motivo, 1000) ?? falla(400, 'Explica al maker por qué se rechaza.');
      cambiar(p, 'rechazado', yo.id, motivo, { motivo_rechazo: motivo });
    } else if (accion === 'lanzar') {
      soloMarketing();
      if (!['pendiente', 'aprobado'].includes(p.estado)) falla(409, `Este pedido ya está ${ETIQUETA_ESTADO[p.estado].toLowerCase()}.`);
      const nota = texto(b.nota, 1000);
      if (p.estado === 'pendiente') cambiar(p, 'aprobado', yo.id, nota, nota ? { nota_marketing: nota } : {});
      else if (nota) p.nota_marketing = nota;
      cambiar(p, 'en_almacen', yo.id, 'Enviado a almacén para preparar');
    } else if (accion === 'enviado') {
      soloStaff();
      if (p.estado !== 'en_almacen') falla(409, 'Solo se marcan como enviados los pedidos que están en almacén.');
      const seguimiento = texto(b.seguimiento, 200);
      cambiar(p, 'enviado', yo.id, seguimiento ? `Seguimiento: ${seguimiento}` : null, { seguimiento });
    } else if (accion === 'cancelar') {
      if (yo.rol === 'almacen') falla(403, 'No tienes permiso para hacer esto.');
      if (p.estado !== 'pendiente') falla(409, 'Solo se pueden cancelar pedidos pendientes de aprobar.');
      cambiar(p, 'cancelado', yo.id, texto(b.motivo, 500));
    } else {
      falla(404, 'No encontrado.');
    }
    return responder(p);
  }

  // ── Usuarios ──
  if (partes[0] === 'usuarios') {
    soloStaff();
    if (partes.length === 1 && metodo === 'GET') {
      const rol = q.get('rol');
      const perfil = q.get('perfil');
      const busca = texto(q.get('q'))?.toLowerCase();
      return d.usuarios
        .filter((u) => !rol || u.rol === rol)
        .filter((u) => !perfil || u.perfil === perfil)
        .filter((u) => !busca || [u.nombre, u.email, u.taller, u.ciudad].some((v) => v?.toLowerCase().includes(busca)))
        .sort((a, z) => (a.rol === 'maker' ? 0 : 1) - (z.rol === 'maker' ? 0 : 1) || a.nombre.localeCompare(z.nombre, 'es'))
        .map((u) => {
          const suyos = d.pedidos.filter((p) => p.usuario_id === u.id);
          return { ...publico(u, true), pedidos: suyos.length, ultimo_pedido_at: suyos.map((p) => p.creado_at).sort().at(-1) ?? null };
        });
    }
    if (partes.length === 1 && metodo === 'POST') {
      soloMarketing();
      const email = texto(b.email, 200)?.toLowerCase();
      const nombre = texto(b.nombre, 120);
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falla(400, 'Escribe un email válido.');
      if (!nombre) falla(400, 'Escribe el nombre.');
      const rol: Rol = ['maker', 'marketing', 'almacen'].includes(b.rol) ? b.rol : 'maker';
      const perfil = rol === 'maker' ? (PERFILES.includes(b.perfil) ? (b.perfil as Perfil) : falla(400, 'Elige el perfil del maker.')) : null;
      if (d.usuarios.some((u) => u.email === email)) falla(409, 'Ya hay un usuario con ese email.');
      const password = typeof b.password === 'string' && b.password.length >= 8 ? b.password : Math.random().toString(36).slice(2, 10);
      const u: U = {
        id: Math.max(0, ...d.usuarios.map((x) => x.id)) + 1,
        email: email!,
        password,
        nombre: nombre!,
        rol,
        perfil,
        ...(Object.fromEntries(CAMPOS_PERFIL.map((k) => [k, texto(b[k])])) as Pick<U, (typeof CAMPOS_PERFIL)[number]>),
        activo: true,
        evento_nombre: null,
        notas_internas: texto(b.notas_internas, 2000),
        acepta_comunicaciones: false,
        origen_alta: 'marketing',
        creado_at: ahora(),
      };
      d.usuarios.push(u);
      return { usuario: publico(u), password_temporal: b.password ? undefined : password };
    }
    const u = d.usuarios.find((x) => x.id === Number(partes[1])) ?? falla(404, 'Ese usuario no existe.');
    if (partes.length === 2 && metodo === 'GET') return publico(u, true);
    if (partes.length === 2 && metodo === 'PATCH') {
      soloMarketing();
      for (const k of CAMPOS_PERFIL) if (k in b) u[k] = texto(b[k]);
      if ('nombre' in b) u.nombre = texto(b.nombre, 120) ?? u.nombre;
      if ('notas_internas' in b) u.notas_internas = texto(b.notas_internas, 2000);
      if ('perfil' in b && u.rol === 'maker' && PERFILES.includes(b.perfil)) u.perfil = b.perfil;
      if ('activo' in b) {
        if (u.id === yo.id && !b.activo) falla(400, 'No puedes desactivar tu propia cuenta.');
        u.activo = !!b.activo;
        if (!u.activo) for (const [t, id] of Object.entries(d.sesiones)) if (id === u.id) delete d.sesiones[t];
      }
      return publico(u, true);
    }
    if (partes[2] === 'password') {
      soloMarketing();
      u.password = Math.random().toString(36).slice(2, 10);
      return { password_temporal: u.password };
    }
  }

  return falla(404, 'No encontrado.');
}

/** Igual que una llamada a la API real, pero resuelta en el navegador. */
export async function demoApi(ruta: string, metodo: string, cuerpo: unknown, tok: string | null) {
  await new Promise((r) => setTimeout(r, 120));
  try {
    const r = manejar(ruta, metodo, (cuerpo ?? {}) as Cuerpo, tok);
    guardar();
    return { ok: true, status: 200, datos: JSON.parse(JSON.stringify(r ?? {})) };
  } catch (e) {
    if (e instanceof Fallo) return { ok: false, status: e.status, datos: { error: e.message } };
    throw e;
  }
}
