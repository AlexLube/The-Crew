import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Hello, Muted, Photo, Pill, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { cursos } from '@/data/ejemplo';
import { porcentaje, useCrew } from '@/state/crew-store';

export default function Escuela() {
  const { progreso } = useCrew();
  return (
    <Screen>
      <Hello
        top="La"
        accent="Escuela"
        sub="Cursos cortos para ver en el taller. Al terminar cada itinerario ganas una insignia."
      />
      {cursos.map((cu) => {
        const pct = porcentaje(progreso[cu.id]);
        return (
          <Pressable key={cu.id} onPress={() => router.push(`/curso/${cu.id}`)} accessibilityRole="button" style={{ gap: 8 }}>
            <Photo k={cu.k} label={cu.insignia} style={{ height: 130 }}>
              <View style={styles.row}>
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.meta}>
                  {cu.lecciones.length} lecciones · {cu.minutos} min
                </Text>
              </View>
            </Photo>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Body style={{ fontFamily: Fonts.bodyBold, flex: 1 }}>{cu.titulo}</Body>
              <Pill>{pct === 100 ? 'Completado' : `${pct}%`}</Pill>
            </View>
            <ProgressBar value={pct} />
          </Pressable>
        );
      })}
      <Card style={{ gap: 4 }}>
        <SectionTitle>Masterclass entre workers</SectionTitle>
        <Muted>Próximamente: workers que enseñan a otros cómo graban su oficio con el móvil.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { color: '#fff', fontFamily: Fonts.bodyBold, fontSize: 12 },
});
