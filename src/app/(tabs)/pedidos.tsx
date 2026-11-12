import { router } from 'expo-router';
import { View } from 'react-native';

import { Aviso, Cargando, EstadoPill, Fila, Pasos, Vacio } from '@/components/pedidos';
import { Body, Button, Hello, Muted, Screen } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { fecha, type PedidoResumen } from '@/lib/api';
import { useApi } from '@/lib/use-api';

export default function MisPedidos() {
  const { datos, error } = useApi<PedidoResumen[]>('/pedidos');
  const activos = datos?.filter((p) => ['pendiente', 'aprobado', 'en_almacen'].includes(p.estado)) ?? [];
  const resto = datos?.filter((p) => !activos.includes(p)) ?? [];

  return (
    <Screen>
      <Hello top="Mis" accent="pedidos" sub="Lo que has pedido y en qué punto está." />
      <Button onPress={() => router.push('/catalogo')}>Nuevo pedido</Button>
      {error ? <Aviso>{error}</Aviso> : null}
      {!datos && !error ? <Cargando /> : null}
      {datos && !datos.length ? (
        <Vacio icono="cube-outline" titulo="Todavía no has hecho ningún pedido" texto="Cuando pidas algo desde el catálogo, lo verás aquí con su estado." />
      ) : null}
      {activos.length ? (
        <View style={{ gap: 4 }}>
          {activos.map((p) => (
            <Fila key={p.id} onPress={() => router.push(`/pedido/${p.id}`)} label={`Pedido ${p.codigo}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Body style={{ fontFamily: Fonts.bodyBold }}>{p.tipo_texto}</Body>
                <EstadoPill estado={p.estado} />
              </View>
              <Muted>
                {p.codigo} · {fecha(p.creado_at)} · {p.unidades} {p.unidades === 1 ? 'artículo' : 'artículos'}
              </Muted>
              <View style={{ marginTop: 6 }}>
                <Pasos estado={p.estado} />
              </View>
            </Fila>
          ))}
        </View>
      ) : null}
      {resto.length ? (
        <View style={{ gap: 4 }}>
          <Muted style={{ fontFamily: Fonts.bodyBold }}>ANTERIORES</Muted>
          {resto.map((p) => (
            <Fila key={p.id} onPress={() => router.push(`/pedido/${p.id}`)} label={`Pedido ${p.codigo}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Body style={{ fontFamily: Fonts.bodyBold }}>{p.tipo_texto}</Body>
                <EstadoPill estado={p.estado} />
              </View>
              <Muted>
                {p.codigo} · {fecha(p.creado_at)} · {p.unidades} {p.unidades === 1 ? 'artículo' : 'artículos'}
              </Muted>
            </Fila>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
