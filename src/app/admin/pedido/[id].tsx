import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Campo, Cargando, Direccion, Enlace, EstadoPill, Historial, Lineas } from '@/components/pedidos';
import { Body, Button, Card, Hello, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { api, ETIQUETA_ORIGEN, ETIQUETA_PERFIL, fecha, type Pedido } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useYo } from '@/state/auth';

export default function PedidoAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const yo = useYo();
  const { datos: p, error, setDatos } = useApi<Pedido>(`/pedidos/${id}`);
  const [nota, setNota] = useState('');
  const [motivo, setMotivo] = useState('');
  const [seguimiento, setSeguimiento] = useState('');
  const [rechazando, setRechazando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  if (error) return <Screen><Aviso>{error}</Aviso></Screen>;
  if (!p) return <Cargando />;
  const esMarketing = yo.rol === 'marketing';

  async function accion(ruta: string, cuerpo: object, mensaje: string) {
    setOcupado(true);
    setErrorAccion(null);
    try {
      setDatos(await api<Pedido>(`/pedidos/${id}/${ruta}`, { cuerpo }));
      setHecho(mensaje);
      setRechazando(false);
    } catch (e) {
      setErrorAccion((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  const puedeDecidir = esMarketing && (p.estado === 'pendiente' || p.estado === 'aprobado');

  return (
    <Screen>
      <Stack.Screen options={{ title: p.codigo }} />
      <View style={{ gap: 10 }}>
        <EstadoPill estado={p.estado} vista="admin" />
        <Hello top={p.usuario_nombre} accent={p.tipo_texto} sub={`${p.codigo} · ${ETIQUETA_ORIGEN[p.origen]} · ${fecha(p.creado_at, true)}`} />
        <Muted>
          {p.usuario_email}
          {p.usuario_perfil ? ` · ${ETIQUETA_PERFIL[p.usuario_perfil]}` : ''}
        </Muted>
        <Enlace onPress={() => router.push(`/admin/usuario/${p.usuario_id}`)}>Ver ficha del maker →</Enlace>
      </View>

      {hecho ? <Aviso tipo="ok">{hecho}</Aviso> : null}
      {errorAccion ? <Aviso>{errorAccion}</Aviso> : null}

      {puedeDecidir ? (
        <Card style={{ gap: 12 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>{p.estado === 'pendiente' ? '¿Apruebas esta solicitud?' : 'Aprobado. Falta lanzarlo a almacén.'}</Body>
          {rechazando ? (
            <>
              <Campo etiqueta="Motivo (lo verá el maker)" value={motivo} onChangeText={setMotivo} multiline placeholder="Por ejemplo: ya recibiste esta prenda el mes pasado" />
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="small" disabled={ocupado || !motivo.trim()} style={!motivo.trim() ? { opacity: 0.4 } : undefined} onPress={() => accion('rechazar', { motivo }, 'Pedido rechazado. Hemos avisado al maker por email.')}>
                  Rechazar pedido
                </Button>
                <Button variant="ghost" style={{ minHeight: 38 }} onPress={() => setRechazando(false)}>
                  Volver
                </Button>
              </View>
            </>
          ) : (
            <>
              <Campo etiqueta="Nota interna (opcional, va también a almacén)" value={nota} onChangeText={setNota} multiline />
              <Button disabled={ocupado} onPress={() => accion('lanzar', { nota }, 'Lanzado a almacén. Les hemos enviado el email con el pedido.')}>
                {p.estado === 'pendiente' ? 'Aprobar y lanzar a almacén' : 'Lanzar a almacén'}
              </Button>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {p.estado === 'pendiente' ? (
                  <Button variant="ghost" style={{ minHeight: 38 }} disabled={ocupado} onPress={() => accion('aprobar', { nota }, 'Aprobado. Lánzalo a almacén cuando quieras.')}>
                    Solo aprobar
                  </Button>
                ) : null}
                <Button variant="ghost" style={{ minHeight: 38 }} onPress={() => setRechazando(true)}>
                  Rechazar
                </Button>
              </View>
            </>
          )}
        </Card>
      ) : null}

      {p.estado === 'en_almacen' ? (
        <Card style={{ gap: 12 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>En almacén. Márcalo cuando salga.</Body>
          <Campo etiqueta="Número de seguimiento (opcional)" value={seguimiento} onChangeText={setSeguimiento} autoCapitalize="characters" />
          <Button disabled={ocupado} onPress={() => accion('enviado', { seguimiento }, 'Marcado como enviado. El maker ya lo ve y le hemos escrito.')}>
            Marcar como enviado
          </Button>
        </Card>
      ) : null}

      {p.estado === 'rechazado' && p.motivo_rechazo ? <Aviso>Rechazado: {p.motivo_rechazo}</Aviso> : null}

      <View style={{ gap: 10 }}>
        <SectionTitle>Artículos</SectionTitle>
        <Lineas lineas={p.lineas} />
      </View>
      {p.notas || p.nota_marketing ? (
        <Card style={{ gap: 8 }}>
          {p.notas ? (
            <View>
              <Muted>Notas del maker</Muted>
              <Body>{p.notas}</Body>
            </View>
          ) : null}
          {p.nota_marketing ? (
            <View>
              <Muted>Nota interna</Muted>
              <Body>{p.nota_marketing}</Body>
            </View>
          ) : null}
        </Card>
      ) : null}
      <View style={{ gap: 10 }}>
        <SectionTitle>Enviar a</SectionTitle>
        <Direccion p={p} />
      </View>
      <View style={{ gap: 10 }}>
        <SectionTitle>Historial</SectionTitle>
        <Historial historial={p.historial} vista="admin" />
      </View>
    </Screen>
  );
}
