import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Muted, Photo, PhotoTitle, Pill, ProgressBar, Screen } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { cursos } from '@/data/ejemplo';
import { porcentaje, useCrew } from '@/state/crew-store';

export default function CursoScreen() {
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { progreso, alternarLeccion } = useCrew();
  const curso = cursos.find((cu) => cu.id === id);

  if (!curso) {
    return (
      <Screen>
        <Body>No encontramos este curso.</Body>
      </Screen>
    );
  }
  const hechas = progreso[curso.id] ?? [];
  const pct = porcentaje(hechas);

  return (
    <Screen
      flush={
        <Photo k={curso.k} label="Itinerario" style={{ borderRadius: 0, minHeight: 200 }}>
          <Pill solid>{`Insignia ${curso.insignia}`}</Pill>
          <PhotoTitle>{curso.titulo}</PhotoTitle>
          <Text style={styles.photoSub}>{curso.minutos} min · descarga para ver sin cobertura</Text>
        </Photo>
      }>
      <Stack.Screen options={{ title: 'Escuela' }} />
      <View>
        <View style={styles.between}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>Tu progreso</Body>
          <Body style={{ fontFamily: Fonts.bodyBold, color: c.green }}>{pct}%</Body>
        </View>
        <ProgressBar value={pct} />
      </View>

      <View>
        {curso.lecciones.map((l, i) => {
          const hecha = !!hechas[i];
          return (
            <Pressable
              key={l}
              onPress={() => alternarLeccion(curso.id, i)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hecha }}
              style={[styles.lesson, { borderBottomColor: c.line }]}>
              <View style={[styles.check, hecha ? { backgroundColor: c.green, borderColor: c.green } : { borderColor: c.line }]}>
                {hecha ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyBold }}>{l}</Body>
                <Muted>Vídeo · {3 + i} min</Muted>
              </View>
              <Ionicons name="play-circle-outline" size={24} color={c.ink} />
            </Pressable>
          );
        })}
      </View>

      {pct === 100 ? (
        <Card style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[styles.done, { color: c.green }]}>¡Insignia {curso.insignia} conseguida!</Text>
          <Muted>Ya aparece en tu perfil.</Muted>
        </Card>
      ) : (
        <Muted style={{ textAlign: 'center' }}>Toca una lección para marcarla como vista.</Muted>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoSub: { color: 'rgba(255,255,255,0.9)', fontFamily: Fonts.body, fontSize: 13 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  done: { fontFamily: Fonts.displayBold, fontSize: 22 },
});
