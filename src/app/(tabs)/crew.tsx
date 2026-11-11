import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Card, Chip, Hello, Muted, Photo, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { workers } from '@/data/ejemplo';

const TODOS = 'Todos';

export default function Crew() {
  const [filtro, setFiltro] = useState(TODOS);
  const oficios = [TODOS, ...new Set(workers.map((w) => w.oficio))];
  const lista = workers.filter((w) => filtro === TODOS || w.oficio === filtro);

  return (
    <Screen>
      <Hello top="The" accent="Crew" sub="Vosotros sois los que formáis The Crew." />
      <View style={styles.chips}>
        {oficios.map((o) => (
          <Chip key={o} active={filtro === o} onPress={() => setFiltro(o)}>
            {o}
          </Chip>
        ))}
      </View>
      <View style={styles.grid}>
        {lista.map((w) => (
          <View key={w.id} style={styles.cell}>
            <Photo k={w.k} label={w.oficio} style={{ aspectRatio: 3 / 4 }} />
            <Body style={{ fontFamily: Fonts.bodyBold, marginTop: 8 }}>{w.nombre}</Body>
            <Muted>{w.handle}</Muted>
          </View>
        ))}
      </View>
      <Card style={{ gap: 4 }}>
        <SectionTitle>Singular workers</SectionTitle>
        <Muted>Maora Cerámica, Vidrio Sorribes, Mosaico Nolla y otros oficios que pasan de generación en generación.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  cell: { width: '48%' },
});
