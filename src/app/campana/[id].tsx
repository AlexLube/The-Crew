import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Muted, Photo, PhotoTitle, Pill, Screen, SectionTitle } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { campanas } from '@/data/ejemplo';
import { useCrew } from '@/state/crew-store';

export default function CampanaScreen() {
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apuntadas, alternarCampana, subidas, anadirSubida } = useCrew();
  const ca = campanas.find((x) => x.id === id);

  if (!ca) {
    return (
      <Screen>
        <Body>No encontramos esta campaña.</Body>
      </Screen>
    );
  }
  const apuntado = !!apuntadas[ca.id];
  const mias = subidas[ca.id] ?? [];

  async function subir() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: ca!.maxSubidas - mias.length,
      quality: 0.8,
    });
    if (!res.canceled) res.assets.forEach((a) => anadirSubida(ca!.id, a.uri));
  }

  const datos: [string, string][] = [
    ['Objetivo', ca.objetivo],
    ['Prendas', ca.prendas],
    ['Entregas', ca.entregas],
    ['Hashtags', ca.hashtags],
  ];

  return (
    <Screen
      flush={
        <Photo k="mecanica" label="Campaña" style={{ borderRadius: 0, minHeight: 200 }}>
          <Pill solid>{ca.fechas}</Pill>
          <PhotoTitle>{ca.titulo}</PhotoTitle>
        </Photo>
      }>
      <View style={{ gap: 10 }}>
        {datos.map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <Text style={[styles.k, { color: c.faint }]}>{k.toUpperCase()}</Text>
            <Body style={{ flex: 1 }}>{v}</Body>
          </View>
        ))}
      </View>

      {apuntado ? (
        <View style={{ gap: 12 }}>
          <SectionTitle>{`Tu contenido · ${mias.length} de ${ca.maxSubidas}`}</SectionTitle>
          {mias.length < ca.maxSubidas ? (
            <Pressable onPress={subir} accessibilityRole="button" style={[styles.upload, { borderColor: c.line }]}>
              <Ionicons name="camera-outline" size={30} color={c.muted} />
              <Muted>Sube fotos o vídeos desde el móvil</Muted>
            </Pressable>
          ) : null}
          {mias.length ? (
            <View style={styles.gallery}>
              {mias.map((uri, i) => (
                <View key={i} style={[styles.g, { backgroundColor: c.card }]}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} />
                  <Text style={[styles.tag, { backgroundColor: c.background, color: c.ink }]}>Pendiente</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Muted>La marca revisa cada envío y te avisa cuando está aprobado.</Muted>
          <Button variant="ghost" onPress={() => alternarCampana(ca.id)}>
            Salir de la campaña
          </Button>
        </View>
      ) : (
        <Button onPress={() => alternarCampana(ca.id)}>Me apunto</Button>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kv: { flexDirection: 'row', gap: 14 },
  k: { width: 82, fontFamily: Fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, paddingTop: 3 },
  upload: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 14, padding: 18, alignItems: 'center', gap: 6 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  g: { width: '32%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', padding: 5 },
  tag: { alignSelf: 'flex-start', fontFamily: Fonts.bodyBold, fontSize: 10, paddingHorizontal: 5, borderRadius: 4, overflow: 'hidden' },
});
