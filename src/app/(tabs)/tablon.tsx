import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Chip, Hello, Meta, Muted, Screen } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { posts } from '@/data/ejemplo';
import { useCrew } from '@/state/crew-store';

export default function Tablon() {
  const c = usePalette();
  const { asistoEvento, alternarEvento } = useCrew();
  return (
    <Screen>
      <Hello top="El" accent="Tablón" sub="Noticias, campañas y agenda de The Crew." />
      {posts.map((p, i) => (
        <View
          key={p.id}
          style={[styles.post, i < posts.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }]}>
          <Meta>{p.meta}</Meta>
          <Body style={{ fontFamily: Fonts.bodyBold, fontSize: 16 }}>{p.titulo}</Body>
          <Muted>{p.texto}</Muted>
          {p.campana ? (
            <Button variant="small" onPress={() => router.push(`/campana/${p.campana}`)}>
              Ver brief
            </Button>
          ) : null}
          {p.evento ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Chip active={asistoEvento} onPress={alternarEvento}>
                {asistoEvento ? 'Asistencia confirmada' : 'Confirmar asistencia'}
              </Chip>
            </View>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ post: { gap: 8, paddingBottom: 18 } });
