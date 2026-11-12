import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Campo, Cargando, Fila, Vacio } from '@/components/pedidos';
import { Body, Button, Chip, Hello, Muted, Screen } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { ETIQUETA_PERFIL, fecha, type Perfil, type Usuario } from '@/lib/api';
import { useApi } from '@/lib/use-api';

const FILTROS: { v: string; t: string }[] = [
  { v: '', t: 'Todos' },
  { v: 'perfil=embajador', t: 'Embajadores' },
  { v: 'perfil=singular_worker', t: 'Singular Workers' },
  { v: 'perfil=maker_evento', t: 'Makers de eventos' },
  { v: 'rol=marketing', t: 'Marketing' },
  { v: 'rol=almacen', t: 'Almacén' },
];

export default function Usuarios() {
  const c = usePalette();
  const [filtro, setFiltro] = useState('');
  const [q, setQ] = useState('');
  const { datos, error } = useApi<Usuario[]>(`/usuarios?${filtro}`);
  const busqueda = q.trim().toLowerCase();
  const lista = (datos ?? []).filter(
    (u) => !busqueda || [u.nombre, u.email, u.taller, u.ciudad].some((v) => v?.toLowerCase().includes(busqueda)),
  );

  return (
    <Screen>
      <Hello top="Comunidad" accent="The Crew" sub="Embajadores, Singular Workers y makers de eventos, con sus pedidos." />
      <Button onPress={() => router.push('/admin/usuario/nuevo')}>Dar de alta</Button>
      <View style={styles.chips}>
        {FILTROS.map((f) => (
          <Chip key={f.v} active={filtro === f.v} onPress={() => setFiltro(f.v)}>
            {f.t}
          </Chip>
        ))}
      </View>
      <Campo etiqueta="Buscar" value={q} onChangeText={setQ} placeholder="Nombre, email, taller o ciudad" autoCapitalize="none" />
      {error ? <Aviso>{error}</Aviso> : null}
      {!datos && !error ? <Cargando /> : null}
      {datos && !lista.length ? <Vacio icono="people-outline" titulo="No hay nadie con ese filtro" /> : null}
      <View>
        {lista.map((u) => (
          <Fila key={u.id} onPress={() => router.push(`/admin/usuario/${u.id}`)} label={u.nombre}>
            <View style={styles.cabecera}>
              <Body style={{ fontFamily: Fonts.bodyBold, flexShrink: 1, color: u.activo ? c.ink : c.faint }}>{u.nombre}</Body>
              {!u.activo ? <Muted>Desactivado</Muted> : null}
            </View>
            <Muted>
              {u.perfil ? ETIQUETA_PERFIL[u.perfil as Perfil] : u.rol === 'marketing' ? 'Marketing' : 'Almacén'}
              {u.evento_nombre ? ` · ${u.evento_nombre}` : ''}
              {u.ciudad ? ` · ${u.ciudad}` : ''}
            </Muted>
            {u.rol === 'maker' ? (
              <Muted>
                {u.pedidos ? `${u.pedidos} ${u.pedidos === 1 ? 'pedido' : 'pedidos'} · último el ${fecha(u.ultimo_pedido_at!)}` : 'Sin pedidos'}
              </Muted>
            ) : null}
          </Fila>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
});
