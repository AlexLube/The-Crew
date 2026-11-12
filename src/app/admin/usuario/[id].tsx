import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Aviso, Campo, Cargando, EstadoPill, Fila } from '@/components/pedidos';
import { Body, Button, Card, Chip, Hello, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { api, ETIQUETA_PERFIL, fecha, type PedidoResumen, type Perfil, type Usuario } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useYo } from '@/state/auth';

const CAMPOS = [
  ['nombre', 'Nombre'],
  ['telefono', 'Teléfono'],
  ['oficio', 'Oficio'],
  ['taller', 'Taller o empresa'],
  ['instagram', 'Instagram'],
  ['direccion', 'Dirección'],
  ['codigo_postal', 'Código postal'],
  ['ciudad', 'Ciudad'],
  ['provincia', 'Provincia'],
  ['tallas', 'Tallas habituales'],
  ['notas_internas', 'Notas internas'],
] as const;

export default function FichaUsuario() {
  const c = usePalette();
  const yo = useYo();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { datos: u, error, setDatos } = useApi<Usuario>(`/usuarios/${id}`);
  const { datos: pedidos } = useApi<PedidoResumen[]>(`/pedidos?usuario_id=${id}`);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const esMarketing = yo.rol === 'marketing';

  if (error) return <Screen><Aviso>{error}</Aviso></Screen>;
  if (!u) return <Cargando />;

  async function guardar(cambios: object, ok: string) {
    try {
      setDatos(await api<Usuario>(`/usuarios/${id}`, { metodo: 'PATCH', cuerpo: cambios }));
      setAviso({ tipo: 'ok', texto: ok });
    } catch (e) {
      setAviso({ tipo: 'error', texto: (e as Error).message });
    }
  }

  async function nuevaPassword() {
    try {
      const r = await api<{ password_temporal: string }>(`/usuarios/${id}/password`, { cuerpo: {} });
      setAviso({ tipo: 'ok', texto: `Nueva contraseña temporal: ${r.password_temporal} (pásasela; solo se ve ahora)` });
    } catch (e) {
      setAviso({ tipo: 'error', texto: (e as Error).message });
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: u.nombre }} />
      <Hello top={u.nombre} accent={u.perfil ? ETIQUETA_PERFIL[u.perfil] : u.rol} sub={`${u.email} · alta el ${fecha(u.creado_at)}`} />
      {u.evento_nombre ? <Muted>Viene de {u.evento_nombre}</Muted> : null}
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {u.rol === 'maker' ? (
        <View style={{ gap: 10 }}>
          <SectionTitle action={esMarketing ? 'Nuevo pedido' : undefined} onAction={() => router.push('/admin/nuevo')}>
            Pedidos
          </SectionTitle>
          {pedidos && !pedidos.length ? <Muted>Todavía no tiene pedidos.</Muted> : null}
          <View>
            {pedidos?.map((p) => (
              <Fila key={p.id} onPress={() => router.push(`/admin/pedido/${p.id}`)} label={`Pedido ${p.codigo}`}>
                <View style={styles.cab}>
                  <Body style={{ fontFamily: Fonts.bodyBold }}>{p.tipo_texto}</Body>
                  <EstadoPill estado={p.estado} vista="admin" />
                </View>
                <Muted>
                  {p.codigo} · {fecha(p.creado_at)} · {p.unidades} art.
                </Muted>
              </Fila>
            ))}
          </View>
        </View>
      ) : null}

      {esMarketing ? (
        <>
          {u.rol === 'maker' ? (
            <View style={{ gap: 10 }}>
              <SectionTitle>Perfil</SectionTitle>
              <View style={styles.chips}>
                {(['embajador', 'singular_worker', 'maker_evento'] as Perfil[]).map((p) => (
                  <Chip key={p} active={u.perfil === p} onPress={() => guardar({ perfil: p }, 'Perfil cambiado.')}>
                    {ETIQUETA_PERFIL[p]}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}
          <DatosForm usuario={u} onGuardar={(v) => guardar(v, 'Datos guardados.')} />
          <Card style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>Cuenta activa</Body>
              <Muted>Si la desactivas, no puede entrar ni pedir.</Muted>
            </View>
            <Switch
              value={u.activo}
              onValueChange={(on) => guardar({ activo: on }, on ? 'Cuenta activada.' : 'Cuenta desactivada.')}
              trackColor={{ true: c.green, false: c.line }}
              accessibilityLabel="Cuenta activa"
            />
          </Card>
          <Button variant="ghost" onPress={nuevaPassword}>
            Generar contraseña nueva
          </Button>
        </>
      ) : null}
    </Screen>
  );
}

function DatosForm({ usuario, onGuardar }: { usuario: Usuario; onGuardar: (v: Record<string, string>) => void }) {
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPOS.map(([k]) => [k, (usuario[k as keyof Usuario] as string | null) ?? ''])),
  );
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle>Datos</SectionTitle>
      {CAMPOS.map(([k, t]) => (
        <Campo key={k} etiqueta={t} value={v[k] ?? ''} multiline={k === 'notas_internas'} onChangeText={(x) => setV((o) => ({ ...o, [k]: x }))} />
      ))}
      <Button onPress={() => onGuardar(v)}>Guardar datos</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
