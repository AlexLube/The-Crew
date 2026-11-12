import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DireccionForm } from '@/components/direccion-form';
import { Aviso, Campo, Cantidad, Vacio } from '@/components/pedidos';
import { Body, Button, Card, Chip, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts, OficioTint } from '@/constants/theme';
import { api, ETIQUETA_TIPO, type Pedido, type TipoPedido } from '@/lib/api';
import { useAuth, useYo } from '@/state/auth';
import { useCarrito } from '@/state/carrito';

export default function Revisar() {
  const yo = useYo();
  const { actualizar } = useAuth();
  const { lineas, cambiarCantidad, vaciar } = useCarrito();
  const tipos: TipoPedido[] = yo.perfil === 'embajador' ? ['mensual', 'reposicion', 'otro'] : ['reposicion', 'otro'];
  const [tipo, setTipo] = useState<TipoPedido>(tipos[0]);
  const [notas, setNotas] = useState('');
  const [editarDir, setEditarDir] = useState(!yo.direccion || !yo.codigo_postal || !yo.ciudad);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!lineas.length) {
    return (
      <Screen>
        <Vacio icono="bag-outline" titulo="Aún no has elegido nada" texto="Añade prendas desde el catálogo." />
        <Button variant="ghost" onPress={() => router.back()}>
          Volver al catálogo
        </Button>
      </Screen>
    );
  }

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      const p = await api<Pedido>('/pedidos', {
        cuerpo: { tipo, notas, lineas: lineas.map(({ producto_id, talla, cantidad }) => ({ producto_id, talla, cantidad })) },
      });
      vaciar();
      router.replace(`/pedido/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <SectionTitle>Artículos</SectionTitle>
        {lineas.map((l, i) => (
          <View key={`${l.producto_id}-${l.talla}`} style={styles.linea}>
            <View style={[styles.mini, { backgroundColor: OficioTint[l.producto.tono ?? 'marca'] ?? OficioTint.marca }]} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>{l.producto.nombre}</Body>
              <Muted>{l.talla ? `Talla ${l.talla}` : 'Talla única'}</Muted>
            </View>
            <Cantidad valor={l.cantidad} onCambio={(n) => cambiarCantidad(i, n)} />
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Tipo de pedido</SectionTitle>
        <View style={styles.chips}>
          {tipos.map((t) => (
            <Chip key={t} active={tipo === t} onPress={() => setTipo(t)}>
              {ETIQUETA_TIPO[t]}
            </Chip>
          ))}
        </View>
        {tipo === 'mensual' ? <Muted>Como embajador tienes un pedido mensual. Si necesitas algo más este mes, pide una reposición.</Muted> : null}
      </View>

      <Campo etiqueta="Notas para marketing (opcional)" value={notas} onChangeText={setNotas} multiline placeholder="Por ejemplo, si lo necesitas para una fecha concreta" />

      <View style={{ gap: 10 }}>
        <SectionTitle action={editarDir ? undefined : 'Cambiar'} onAction={() => setEditarDir(true)}>
          Envío
        </SectionTitle>
        {editarDir ? (
          <DireccionForm
            usuario={yo}
            onGuardado={(u) => {
              actualizar(u);
              setEditarDir(false);
            }}
          />
        ) : (
          <Card>
            <Body style={{ fontFamily: Fonts.bodyBold }}>{yo.nombre}</Body>
            <Muted>{yo.direccion}</Muted>
            <Muted>
              {yo.codigo_postal} {yo.ciudad}
              {yo.provincia ? ` (${yo.provincia})` : ''}
            </Muted>
            {yo.telefono ? <Muted>Tel. {yo.telefono}</Muted> : null}
          </Card>
        )}
      </View>

      {error ? <Aviso>{error}</Aviso> : null}
      <Button onPress={enviar} disabled={enviando || editarDir} style={editarDir ? { opacity: 0.4 } : undefined}>
        {enviando ? 'Enviando…' : 'Enviar solicitud'}
      </Button>
      <Muted style={{ textAlign: 'center' }}>Marketing la revisará y verás aquí cuándo se aprueba y cuándo sale del almacén.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mini: { width: 44, height: 44, borderRadius: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
