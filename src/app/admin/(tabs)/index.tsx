import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Cargando, EstadoPill, Fila, Vacio } from '@/components/pedidos';
import { Body, Chip, Hello, Muted, Screen } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { ETIQUETA_ORIGEN, ETIQUETA_PERFIL, fecha, type Estado, type Perfil, type PedidoResumen } from '@/lib/api';
import { useApi } from '@/lib/use-api';

const FILTROS: { clave: string; titulo: string; estados: Estado[] }[] = [
  { clave: 'pendiente', titulo: 'Por aprobar', estados: ['pendiente'] },
  { clave: 'aprobado', titulo: 'Aprobados', estados: ['aprobado'] },
  { clave: 'en_almacen', titulo: 'En almacén', estados: ['en_almacen'] },
  { clave: 'enviado', titulo: 'Enviados', estados: ['enviado'] },
  { clave: 'cerrados', titulo: 'Rechazados y cancelados', estados: ['rechazado', 'cancelado'] },
  { clave: 'todos', titulo: 'Todos', estados: [] },
];
const PERFILES: (Perfil | null)[] = [null, 'embajador', 'singular_worker', 'maker_evento'];

export default function Bandeja() {
  const c = usePalette();
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const { datos: resumen } = useApi<Record<Estado, number>>('/pedidos/resumen');
  const consulta = new URLSearchParams();
  if (filtro.estados.length) consulta.set('estado', filtro.estados.join(','));
  if (perfil) consulta.set('perfil', perfil);
  const { datos, error } = useApi<PedidoResumen[]>(`/pedidos?${consulta}`);

  const cuenta = (f: (typeof FILTROS)[number]) =>
    resumen && f.estados.length ? f.estados.reduce((n, e) => n + (resumen[e] ?? 0), 0) : null;

  return (
    <Screen>
      <Hello top="Bandeja de" accent="pedidos" sub="Aprueba las solicitudes de los makers y lánzalas a almacén." />
      <View style={styles.chips}>
        {FILTROS.map((f) => {
          const n = cuenta(f);
          return (
            <Chip key={f.clave} active={filtro.clave === f.clave} onPress={() => setFiltro(f)}>
              {n !== null ? `${f.titulo} · ${n}` : f.titulo}
            </Chip>
          );
        })}
      </View>
      <View style={styles.chips}>
        {PERFILES.map((p) => (
          <Chip key={p ?? 'todos'} active={perfil === p} onPress={() => setPerfil(p)}>
            {p ? ETIQUETA_PERFIL[p] : 'Todos los perfiles'}
          </Chip>
        ))}
      </View>
      {error ? <Aviso>{error}</Aviso> : null}
      {!datos && !error ? <Cargando /> : null}
      {datos && !datos.length ? (
        <Vacio icono="checkmark-done-outline" titulo={filtro.clave === 'pendiente' ? 'No hay nada por aprobar' : 'No hay pedidos aquí'} />
      ) : null}
      <View>
        {datos?.map((p) => (
          <Fila key={p.id} onPress={() => router.push(`/admin/pedido/${p.id}`)} label={`Pedido ${p.codigo} de ${p.usuario_nombre}`}>
            <View style={styles.cabecera}>
              <Body style={{ fontFamily: Fonts.bodyBold, flexShrink: 1 }}>{p.usuario_nombre}</Body>
              <EstadoPill estado={p.estado} vista="admin" />
            </View>
            <Muted>
              {p.codigo} · {p.tipo_texto} · {p.unidades} {p.unidades === 1 ? 'artículo' : 'artículos'}
            </Muted>
            <View style={styles.meta}>
              <Ionicons name={p.origen === 'app' ? 'phone-portrait-outline' : p.origen === 'email' ? 'mail-outline' : p.origen === 'telefono' ? 'call-outline' : 'create-outline'} size={14} color={c.faint} />
              <Muted>
                {ETIQUETA_ORIGEN[p.origen]} · {fecha(p.creado_at, true)}
                {p.usuario_perfil ? ` · ${ETIQUETA_PERFIL[p.usuario_perfil]}` : ''}
              </Muted>
            </View>
          </Fila>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
