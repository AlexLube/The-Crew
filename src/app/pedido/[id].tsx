import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Cargando, Direccion, EstadoPill, Historial, Lineas, Pasos } from '@/components/pedidos';
import { Body, Button, Card, Hello, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { api, fecha, type Pedido } from '@/lib/api';
import { useApi } from '@/lib/use-api';

export default function PedidoMaker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: p, error, setDatos } = useApi<Pedido>(`/pedidos/${id}`);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  if (error) return <Screen><Aviso>{error}</Aviso></Screen>;
  if (!p) return <Cargando />;

  async function cancelar() {
    try {
      setDatos(await api<Pedido>(`/pedidos/${id}/cancelar`, { metodo: 'POST', cuerpo: {} }));
    } catch (e) {
      setErrorAccion((e as Error).message);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: p.codigo }} />
      <View style={{ gap: 10 }}>
        <EstadoPill estado={p.estado} />
        <Hello top={p.tipo_texto} accent={p.codigo} sub={`Pedido el ${fecha(p.creado_at)}`} />
      </View>
      <Pasos estado={p.estado} />
      {p.estado === 'pendiente' ? <Aviso tipo="info">Marketing está revisando tu solicitud. Te avisaremos cuando la aprueben.</Aviso> : null}
      {p.estado === 'en_almacen' ? <Aviso tipo="ok">Aprobado. Lo están preparando en nuestro almacén.</Aviso> : null}
      {p.estado === 'enviado' ? (
        <Aviso tipo="ok">Va de camino.{p.seguimiento ? ` Seguimiento: ${p.seguimiento}` : ''}</Aviso>
      ) : null}
      {p.estado === 'rechazado' ? <Aviso>No se ha aprobado. {p.motivo_rechazo}</Aviso> : null}

      <View style={{ gap: 10 }}>
        <SectionTitle>Artículos</SectionTitle>
        <Lineas lineas={p.lineas} />
      </View>
      {p.notas ? (
        <Card>
          <Muted>Tus notas</Muted>
          <Body>{p.notas}</Body>
        </Card>
      ) : null}
      <View style={{ gap: 10 }}>
        <SectionTitle>Envío</SectionTitle>
        <Direccion p={p} />
      </View>
      <View style={{ gap: 10 }}>
        <SectionTitle>Historial</SectionTitle>
        <Historial historial={p.historial} vista="maker" />
      </View>
      {errorAccion ? <Aviso>{errorAccion}</Aviso> : null}
      {p.estado === 'pendiente' ? (
        confirmar ? (
          <Card style={{ gap: 12 }}>
            <Body style={{ fontFamily: Fonts.bodyBold }}>¿Cancelar esta solicitud?</Body>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant="small" onPress={cancelar}>
                Sí, cancelar
              </Button>
              <Button variant="ghost" style={{ minHeight: 38 }} onPress={() => setConfirmar(false)}>
                No
              </Button>
            </View>
          </Card>
        ) : (
          <Button variant="ghost" onPress={() => setConfirmar(true)}>
            Cancelar solicitud
          </Button>
        )
      ) : null}
    </Screen>
  );
}
