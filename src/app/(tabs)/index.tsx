import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Chip, Hello, Meta, Muted, Photo, PhotoTitle, Pill, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { Fonts, OficioTint, usePalette } from '@/constants/theme';
import { campanas, cursos, posts } from '@/data/ejemplo';
import { Aviso, EstadoPill, Pasos } from '@/components/pedidos';
import { ETIQUETA_PERFIL, fecha, type PedidoResumen } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useYo } from '@/state/auth';
import { porcentaje, useCrew } from '@/state/crew-store';

export default function Inicio() {
  const c = usePalette();
  const { progreso, apuntadas, asistoEvento, alternarEvento } = useCrew();
  const campana = campanas[0];
  const siguiente = cursos.find((cu) => porcentaje(progreso[cu.id]) < 100);
  const yo = useYo();
  const { datos: pedidos } = useApi<PedidoResumen[]>('/pedidos');
  const activo = pedidos?.find((p) => ['pendiente', 'aprobado', 'en_almacen'].includes(p.estado)) ?? pedidos?.[0];
  const mes = new Date().toISOString().slice(0, 7);
  const mensualHecho = pedidos?.some((p) => p.tipo === 'mensual' && !['rechazado', 'cancelado'].includes(p.estado) && p.creado_at.startsWith(mes));
  const sub = [yo.oficio, yo.taller].filter(Boolean).join(' · ') || (yo.perfil ? ETIQUETA_PERFIL[yo.perfil] : '');

  return (
    <Screen>
      <Hello top="Hola," accent={yo.nombre.split(' ')[0]} sub={sub} />

      {pedidos && yo.perfil === 'embajador' && !mensualHecho ? (
        <Card style={{ gap: 12 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>Aún no has hecho tu pedido de este mes</Body>
          <Button variant="small" onPress={() => router.push('/catalogo')}>
            Hacer pedido
          </Button>
        </Card>
      ) : null}

      {activo ? (
        <Pressable onPress={() => router.push(`/pedido/${activo.id}`)} accessibilityRole="button" accessibilityLabel={`Tu pedido ${activo.codigo}`}>
          <Card style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Meta>{`Tu pedido · ${fecha(activo.creado_at)}`}</Meta>
              <EstadoPill estado={activo.estado} />
            </View>
            <Body style={{ fontFamily: Fonts.bodyBold }}>
              {activo.tipo_texto} · {activo.codigo}
            </Body>
            <Pasos estado={activo.estado} />
            {activo.estado === 'rechazado' ? <Aviso>No se aprobó. Toca para ver el motivo.</Aviso> : null}
          </Card>
        </Pressable>
      ) : null}

      <Pressable onPress={() => router.push(`/campana/${campana.id}`)} accessibilityRole="button">
        <Photo k="mecanica" label="Campaña activa" style={{ minHeight: 200 }}>
          <Pill solid>{apuntadas[campana.id] ? 'Apuntado' : `Hasta el ${campana.fechas.split('– ')[1]}`}</Pill>
          <PhotoTitle>{campana.titulo}</PhotoTitle>
          <Text style={styles.photoSub}>
            {campana.entregas} · {campana.fechas}
          </Text>
        </Photo>
      </Pressable>

      {siguiente ? (
        <View style={{ gap: 10 }}>
          <SectionTitle action="Ver escuela" onAction={() => router.push('/escuela')}>
            Sigue aprendiendo
          </SectionTitle>
          <Pressable onPress={() => router.push(`/curso/${siguiente.id}`)} accessibilityRole="button">
            <Card style={styles.row}>
              <View style={[styles.thumb, { backgroundColor: OficioTint[siguiente.k] }]} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyBold }}>{siguiente.titulo}</Body>
                <Muted>
                  {siguiente.lecciones.length} lecciones · {siguiente.minutos} min
                </Muted>
                <ProgressBar value={porcentaje(progreso[siguiente.id])} />
              </View>
            </Card>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <SectionTitle action="Ver tablón" onAction={() => router.push('/tablon')}>
          Novedades
        </SectionTitle>
        {posts.slice(1, 3).map((p) => (
          <View key={p.id} style={[styles.post, { borderBottomColor: c.line }]}>
            <Meta>{p.meta}</Meta>
            <Body style={{ fontFamily: Fonts.bodyBold }}>{p.titulo}</Body>
          </View>
        ))}
      </View>

      <Pressable onPress={() => router.push('/crew')} accessibilityRole="button">
        <Card style={styles.row}>
          <Ionicons name="people-outline" size={26} color={c.ink} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontFamily: Fonts.bodyBold }}>Conoce a la crew</Body>
            <Muted>Los demás workers de Issaline</Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.faint} />
        </Card>
      </Pressable>

      <Card style={styles.row}>
        <Ionicons name="calendar-outline" size={26} color={c.ink} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>Sesión de fotos · Valencia</Body>
          <Muted>Sábado 28 de noviembre, 10:00</Muted>
        </View>
        <Chip active={asistoEvento} onPress={alternarEvento}>
          {asistoEvento ? 'Voy' : '¿Vienes?'}
        </Chip>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoSub: { color: 'rgba(255,255,255,0.9)', fontFamily: Fonts.body, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  post: { gap: 4, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
