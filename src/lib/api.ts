import { Platform } from 'react-native';

/**
 * Dirección de la API. En web publicada, la propia API sirve la app y
 * se usa el mismo dominio. En desarrollo, localhost:4000 o lo que diga
 * EXPO_PUBLIC_API_URL (en el móvil, la IP del ordenador: http://192.168.x.x:4000).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' && !__DEV__ ? '' : 'http://localhost:4000');

export type Rol = 'maker' | 'marketing' | 'almacen';
export type Perfil = 'embajador' | 'singular_worker' | 'maker_evento';
export type Estado = 'pendiente' | 'aprobado' | 'en_almacen' | 'enviado' | 'rechazado' | 'cancelado';
export type TipoPedido = 'mensual' | 'reposicion' | 'welcome_pack' | 'muestra' | 'regalo' | 'otro';
export type Origen = 'app' | 'email' | 'telefono' | 'marketing';

export type Usuario = {
  id: number;
  email: string;
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
  evento_nombre?: string | null;
  notas_internas?: string | null;
  pedidos?: number;
  ultimo_pedido_at?: string | null;
  creado_at: string;
};

export type Producto = {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  tallas: string[];
  tipo: string;
  tono: string | null;
  activo: boolean;
};

export type PedidoResumen = {
  id: number;
  codigo: string;
  estado: Estado;
  estado_texto: string;
  tipo: TipoPedido;
  tipo_texto: string;
  origen: Origen;
  creado_at: string;
  actualizado_at: string;
  seguimiento: string | null;
  usuario_id: number;
  usuario_nombre: string;
  usuario_perfil: Perfil | null;
  unidades: number;
};

export type Pedido = PedidoResumen & {
  usuario_email: string;
  notas: string | null;
  nota_marketing?: string | null;
  motivo_rechazo: string | null;
  envio_nombre: string | null;
  envio_telefono: string | null;
  envio_direccion: string | null;
  envio_codigo_postal: string | null;
  envio_ciudad: string | null;
  envio_provincia: string | null;
  lineas: { id: number; producto_id: number; talla: string | null; cantidad: number; nombre: string; sku: string; categoria: string; tono: string | null }[];
  historial: { estado: Estado; nota: string | null; creado_at: string; usuario_nombre: string | null; usuario_rol: Rol | null }[];
};

export type LineaNueva = { producto_id: number; talla: string | null; cantidad: number };

export class ErrorApi extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

let tokenActual: string | null = null;
let alCaducar: (() => void) | null = null;
export function configurarApi(token: string | null, onCaducada?: () => void) {
  tokenActual = token;
  if (onCaducada) alCaducar = onCaducada;
}

export async function api<T>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${ruta}`, {
      method: opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET'),
      headers: {
        'content-type': 'application/json',
        ...(tokenActual ? { authorization: `Bearer ${tokenActual}` } : {}),
      },
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && tokenActual) alCaducar?.();
    throw new ErrorApi(res.status, datos?.error ?? 'Algo ha fallado. Inténtalo de nuevo.');
  }
  return datos as T;
}

export const ETIQUETA_PERFIL: Record<Perfil, string> = {
  embajador: 'Embajador The Crew',
  singular_worker: 'Singular Worker',
  maker_evento: 'Maker de evento',
};

export const ETIQUETA_TIPO: Record<TipoPedido, string> = {
  mensual: 'Pedido mensual',
  reposicion: 'Reposición',
  welcome_pack: 'Welcome pack',
  muestra: 'Muestras',
  regalo: 'Regalo',
  otro: 'Otro',
};

export const ETIQUETA_ORIGEN: Record<Origen, string> = {
  app: 'App',
  email: 'Email',
  telefono: 'Teléfono',
  marketing: 'Marketing',
};

/** Estado tal y como lo ve el maker: pendiente, aprobado o enviado. */
export const ESTADO_MAKER: Record<Estado, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  en_almacen: 'Aprobado',
  enviado: 'Enviado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

export const ESTADO_ADMIN: Record<Estado, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  en_almacen: 'En almacén',
  enviado: 'Enviado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

export function fecha(iso: string, conHora = false) {
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
