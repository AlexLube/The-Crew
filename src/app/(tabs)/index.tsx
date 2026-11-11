import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Chip, Hello, Meta, Muted, Photo, PhotoTitle, Pill, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { Fonts, OficioTint, usePalette } from '@/constants/theme';
import { campanas, cursos, posts, yo } from '@/data/ejemplo';
import { porcentaje, useCrew } from '@/state/crew-store';

export default function Inicio() {
  const c = usePalette();
  const { progreso, apuntadas, asistoEvento, alternarEvento } = useCrew();
  const campana = campanas[0];
  const siguiente = cursos.find((cu) => porcentaje(progreso[cu.id]) < 100);

  return (
    <Screen>
      <Hello top="Hola," accent={yo.nombreCorto} sub={`${yo.oficio} · ${yo.taller}`} />

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
          <SectionTitle>Sigue aprendiendo</SectionTitle>
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
  thumb: { width: 56, height: 56, borderRadius: 10 },
  post: { gap: 4, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
