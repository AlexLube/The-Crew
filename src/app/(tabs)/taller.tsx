import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Body, Button, Card, Muted, Photo, PhotoTitle, Pill, Screen } from '@/components/ui';
import { Fonts, OficioTint, usePalette } from '@/constants/theme';
import { DireccionForm } from '@/components/direccion-form';
import { campanas, cursos } from '@/data/ejemplo';
import { ETIQUETA_PERFIL } from '@/lib/api';
import { useAuth, useYo } from '@/state/auth';
import { porcentaje, useCrew } from '@/state/crew-store';

const secciones = [
  ['historia', 'Historia'],
  ['galeria', 'Galería'],
  ['insignias', 'Insignias'],
  ['datos', 'Mis datos'],
] as const;
type Seccion = (typeof secciones)[number][0];

export default function MiTaller() {
  const c = usePalette();
  const [sec, setSec] = useState<Seccion>('historia');
  const yo = useYo();
  const k = tintDeOficio(yo.oficio);
  const sub = [yo.instagram, yo.taller].filter(Boolean).join(' · ');

  return (
    <Screen
      flush={
        <Photo k={k} label="Foto en el taller" style={{ borderRadius: 0, minHeight: 240 }}>
          <Pill solid>{yo.oficio ?? (yo.perfil ? ETIQUETA_PERFIL[yo.perfil] : 'The Crew')}</Pill>
          <PhotoTitle>{yo.nombre}</PhotoTitle>
          {sub ? <Text style={styles.photoSub}>{sub}</Text> : null}
        </Photo>
      }>
      <View style={[styles.tabs, { borderBottomColor: c.line }]} accessibilityRole="tablist">
        {secciones.map(([k, l]) => (
          <Pressable
            key={k}
            onPress={() => setSec(k)}
            accessibilityRole="tab"
            accessibilityState={{ selected: sec === k }}
            style={[styles.tab, { borderBottomColor: sec === k ? c.green : 'transparent' }]}>
            <Text style={[styles.tabText, { color: sec === k ? c.ink : c.faint }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {sec === 'historia' && <Historia />}
      {sec === 'galeria' && <Galeria />}
      {sec === 'insignias' && <Insignias />}
      {sec === 'datos' && <MisDatos />}
    </Screen>
  );
}

function Historia() {
  const c = usePalette();
  const { publicarEnWeb, alternarPublicar } = useCrew();
  return (
    <View style={{ gap: 16 }}>
      <Text style={[styles.quote, { color: c.green }]}>«Para mí los retos son posibilidades.»</Text>
      <Muted>
        Aquí va la historia del worker en primera persona, la misma que tiene en su perfil de thecrew.issaline.com. La edita
        él desde la app.
      </Muted>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>Publicar en la web</Body>
          <Muted>Tu perfil aparece en thecrew.issaline.com</Muted>
        </View>
        <Switch
          value={publicarEnWeb}
          onValueChange={alternarPublicar}
          trackColor={{ true: c.green, false: c.line }}
          accessibilityLabel="Publicar en la web"
        />
      </Card>
    </View>
  );
}

function Galeria() {
  const c = usePalette();
  const { subidas } = useCrew();
  const mias = campanas.flatMap((ca) => subidas[ca.id] ?? []);
  const ejemplo = [
    ['herreria', 'Publicado'],
    ['ebanisteria', 'Aprobado'],
    ['mecanica', 'Publicado'],
    ['marca', 'Aprobado'],
    ['herreria', 'Publicado'],
  ];
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.gallery}>
        {mias.map((uri, i) => (
          <View key={`u${i}`} style={styles.g}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} />
            <Text style={[styles.gTag, { backgroundColor: c.background, color: c.ink }]}>Pendiente</Text>
          </View>
        ))}
        {ejemplo.map(([k, estado], i) => (
          <View key={`e${i}`} style={[styles.g, { backgroundColor: OficioTint[k] }]}>
            <Text style={[styles.gTag, { backgroundColor: c.background, color: c.ink }]}>{estado}</Text>
          </View>
        ))}
      </View>
      <Muted>Lo que subes para campañas o por tu cuenta, con su estado.</Muted>
    </View>
  );
}

function MisDatos() {
  const yo = useYo();
  const { actualizar, salir } = useAuth();
  const [guardado, setGuardado] = useState(false);
  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 4 }}>
        <Body style={{ fontFamily: Fonts.bodyBold }}>{yo.nombre}</Body>
        <Muted>{yo.email}</Muted>
        {yo.perfil ? <Muted>{ETIQUETA_PERFIL[yo.perfil]}</Muted> : null}
      </Card>
      <Muted>Aquí enviamos tus pedidos. Si cambias de dirección, actualízala antes de pedir.</Muted>
      <DireccionForm
        usuario={yo}
        onGuardado={(u) => {
          actualizar(u);
          setGuardado(true);
        }}
      />
      {guardado ? <Muted>Guardado.</Muted> : null}
      <Button variant="ghost" onPress={() => router.push('/catalogo')}>
        Pedir prenda o reposición
      </Button>
      <Button variant="ghost" onPress={salir}>
        Cerrar sesión
      </Button>
    </View>
  );
}

/** Tono del hueco de foto según el oficio. */
function tintDeOficio(oficio: string | null) {
  const k = (oficio ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return k in OficioTint ? k : 'marca';
}

function Insignias() {
  const c = usePalette();
  const { progreso } = useCrew();
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.badges}>
        {cursos.map((cu) => {
          const on = porcentaje(progreso[cu.id]) === 100;
          return (
            <View key={cu.id} style={styles.badge}>
              <View
                style={[
                  styles.badgeCircle,
                  { backgroundColor: on ? c.greenSoft : c.card, borderColor: on ? c.green : c.line },
                ]}>
                <Ionicons name="ribbon-outline" size={28} color={on ? c.green : c.faint} />
              </View>
              <Text style={[styles.badgeText, { color: on ? c.ink : c.faint }]}>{cu.insignia}</Text>
            </View>
          );
        })}
      </View>
      <Muted>Se ganan al completar cada itinerario de la Escuela. Reconocimiento, no ranking.</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSub: { color: 'rgba(255,255,255,0.9)', fontFamily: Fonts.body, fontSize: 13 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: -6 },
  tab: { paddingVertical: 10, borderBottomWidth: 2 },
  tabText: { fontFamily: Fonts.bodyBold, fontSize: 14 },
  quote: { fontFamily: Fonts.displaySemi, fontSize: 24, lineHeight: 28, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  g: { width: '32%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', padding: 5 },
  gTag: { alignSelf: 'flex-start', fontFamily: Fonts.bodyBold, fontSize: 10, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  badges: { flexDirection: 'row', justifyContent: 'space-around' },
  badge: { alignItems: 'center', gap: 6 },
  badgeCircle: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
});
