import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListaProductos } from '@/components/catalogo';
import { Aviso, Campo, Cantidad, Enlace, Fila } from '@/components/pedidos';
import { Body, Button, Card, Chip, Hello, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts, OficioTint } from '@/constants/theme';
import { api, ETIQUETA_PERFIL, ETIQUETA_TIPO, type Origen, type Pedido, type Producto, type TipoPedido, type Usuario } from '@/lib/api';
import { useApi } from '@/lib/use-api';

type Linea = { producto: Producto; talla: string | null; cantidad: number };
const ORIGENES: { v: Origen; t: string }[] = [
  { v: 'email', t: 'Por email' },
  { v: 'telefono', t: 'Por teléfono' },
  { v: 'marketing', t: 'Iniciativa de marketing' },
];
const TIPOS = Object.keys(ETIQUETA_TIPO) as TipoPedido[];
const CAMPOS_ENVIO = [
  ['nombre', 'Nombre'],
  ['telefono', 'Teléfono'],
  ['direccion', 'Dirección'],
  ['codigo_postal', 'Código postal'],
  ['ciudad', 'Ciudad'],
  ['provincia', 'Provincia'],
] as const;

/** Alta manual de un pedido recibido por email o teléfono. */
export default function NuevoPedido() {
  const [busqueda, setBusqueda] = useState('');
  const { datos: makers } = useApi<Usuario[]>('/usuarios?rol=maker');
  const { datos: productos } = useApi<Producto[]>('/productos');
  const [maker, setMaker] = useState<Usuario | null>(null);
  const [origen, setOrigen] = useState<Origen>('email');
  const [tipo, setTipo] = useState<TipoPedido>('reposicion');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [notas, setNotas] = useState('');
  const [nota, setNota] = useState('');
  const [envio, setEnvio] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function elegir(u: Usuario) {
    setMaker(u);
    setTipo(u.perfil === 'embajador' ? 'mensual' : u.perfil === 'maker_evento' ? 'muestra' : 'reposicion');
    setEnvio({
      nombre: u.nombre,
      telefono: u.telefono ?? '',
      direccion: u.direccion ?? '',
      codigo_postal: u.codigo_postal ?? '',
      ciudad: u.ciudad ?? '',
      provincia: u.provincia ?? '',
    });
  }

  function reiniciar() {
    setMaker(null);
    setLineas([]);
    setNotas('');
    setNota('');
    setError(null);
  }

  async function crear() {
    if (!maker) return;
    setEnviando(true);
    setError(null);
    try {
      const p = await api<Pedido>('/pedidos', {
        cuerpo: {
          usuario_id: maker.id,
          origen,
          tipo,
          notas,
          nota_marketing: nota,
          envio,
          lineas: lineas.map((l) => ({ producto_id: l.producto.id, talla: l.talla, cantidad: l.cantidad })),
        },
      });
      reiniciar();
      router.push(`/admin/pedido/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (!maker) {
    const q = busqueda.trim().toLowerCase();
    const lista = (makers ?? []).filter(
      (u) => u.activo && (!q || [u.nombre, u.email, u.taller, u.ciudad].some((v) => v?.toLowerCase().includes(q))),
    );
    return (
      <Screen>
        <Hello top="Alta de" accent="pedido" sub="Para los pedidos que llegan por email o por teléfono. Primero, ¿para quién es?" />
        <Campo etiqueta="Buscar maker" value={busqueda} onChangeText={setBusqueda} placeholder="Nombre, email, taller o ciudad" autoCapitalize="none" />
        <View>
          {lista.map((u) => (
            <Fila key={u.id} onPress={() => elegir(u)} label={u.nombre}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>{u.nombre}</Body>
              <Muted>
                {u.perfil ? ETIQUETA_PERFIL[u.perfil] : ''}
                {u.ciudad ? ` · ${u.ciudad}` : ''} · {u.email}
              </Muted>
            </Fila>
          ))}
        </View>
        <Enlace onPress={() => router.push('/admin/usuario/nuevo')}>¿No está? Dar de alta un maker nuevo →</Enlace>
      </Screen>
    );
  }

  return (
    <Screen>
      <Hello top="Pedido para" accent={maker.nombre} sub={maker.perfil ? ETIQUETA_PERFIL[maker.perfil] : undefined} />
      <Enlace onPress={reiniciar}>← Cambiar de maker</Enlace>

      <View style={{ gap: 10 }}>
        <SectionTitle>¿Cómo llegó?</SectionTitle>
        <View style={styles.chips}>
          {ORIGENES.map((o) => (
            <Chip key={o.v} active={origen === o.v} onPress={() => setOrigen(o.v)}>
              {o.t}
            </Chip>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Tipo</SectionTitle>
        <View style={styles.chips}>
          {TIPOS.map((t) => (
            <Chip key={t} active={tipo === t} onPress={() => setTipo(t)}>
              {ETIQUETA_TIPO[t]}
            </Chip>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Artículos</SectionTitle>
        {lineas.length ? (
          <Card style={{ gap: 10 }}>
            {lineas.map((l, i) => (
              <View key={`${l.producto.id}-${l.talla}`} style={styles.linea}>
                <View style={[styles.mini, { backgroundColor: OficioTint[l.producto.tono ?? 'marca'] ?? OficioTint.marca }]} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontFamily: Fonts.bodyBold }}>{l.producto.nombre}</Body>
                  <Muted>{l.talla ? `Talla ${l.talla}` : 'Talla única'}</Muted>
                </View>
                <Cantidad
                  valor={l.cantidad}
                  onCambio={(n) =>
                    setLineas((ls) => (n <= 0 ? ls.filter((_, j) => j !== i) : ls.map((x, j) => (j === i ? { ...x, cantidad: Math.min(20, n) } : x))))
                  }
                />
              </View>
            ))}
          </Card>
        ) : (
          <Muted>Añade artículos del catálogo.</Muted>
        )}
        {productos ? (
          <ListaProductos
            productos={productos}
            onAnadir={(producto, talla, cantidad) =>
              setLineas((ls) => {
                const i = ls.findIndex((l) => l.producto.id === producto.id && l.talla === talla);
                return i >= 0 ? ls.map((l, j) => (j === i ? { ...l, cantidad: Math.min(20, l.cantidad + cantidad) } : l)) : [...ls, { producto, talla, cantidad }];
              })
            }
          />
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle>Enviar a</SectionTitle>
        {CAMPOS_ENVIO.map(([k, t]) => (
          <Campo key={k} etiqueta={t} value={envio[k] ?? ''} onChangeText={(v) => setEnvio((e) => ({ ...e, [k]: v }))} />
        ))}
      </View>

      <Campo etiqueta="Lo que pidió el maker (opcional)" value={notas} onChangeText={setNotas} multiline placeholder="Copia aquí el email o resume la llamada" />
      <Campo etiqueta="Nota interna (opcional)" value={nota} onChangeText={setNota} multiline />

      {error ? <Aviso>{error}</Aviso> : null}
      <Button onPress={crear} disabled={enviando || !lineas.length} style={!lineas.length ? { opacity: 0.4 } : undefined}>
        {enviando ? 'Creando…' : 'Crear pedido'}
      </Button>
      <Muted style={{ textAlign: 'center' }}>Se crea como pendiente. En el siguiente paso lo apruebas y lo lanzas a almacén.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mini: { width: 40, height: 40, borderRadius: 8 },
});
