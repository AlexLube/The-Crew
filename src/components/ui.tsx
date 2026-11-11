import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Fonts, OficioTint, Spacing, usePalette } from '@/constants/theme';

type TxtProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

/** Titular grande en mayúsculas, con la segunda línea en verde opcional. */
export function Hello({ top, accent, sub }: { top: string; accent: string; sub?: string }) {
  const c = usePalette();
  return (
    <View>
      <Text style={[styles.hello, { color: c.ink }]}>{top.toUpperCase()}</Text>
      <Text style={[styles.hello, { color: c.green }]}>{accent.toUpperCase()}</Text>
      {sub ? <Text style={[styles.sub, { color: c.muted }]}>{sub}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
  const c = usePalette();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: c.ink }]}>{children.toUpperCase()}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.sectionAction, { color: c.green }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Body({ children, style, numberOfLines }: TxtProps) {
  const c = usePalette();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: c.ink }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TxtProps) {
  const c = usePalette();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.small, { color: c.muted }, style]}>
      {children}
    </Text>
  );
}

export function Meta({ children }: { children: string }) {
  const c = usePalette();
  return <Text style={[styles.meta, { color: c.faint }]}>{children.toUpperCase()}</Text>;
}

/** Hueco de foto: aquí irá la fotografía real de oficio de cada worker. */
export function Photo({
  k,
  label,
  style,
  children,
}: {
  k: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.photo, { backgroundColor: OficioTint[k] ?? OficioTint.marca }, style]}>
      {label ? <Text style={styles.photoLabel}>{label.toUpperCase()}</Text> : null}
      {children}
    </View>
  );
}

export function PhotoTitle({ children }: { children: string }) {
  return <Text style={styles.photoTitle}>{children.toUpperCase()}</Text>;
}

export function Pill({ children, solid }: { children: string; solid?: boolean }) {
  const c = usePalette();
  return (
    <View style={[styles.pill, { backgroundColor: solid ? c.green : c.greenSoft }]}>
      <Text style={[styles.pillText, { color: solid ? '#fff' : c.green }]}>{children}</Text>
    </View>
  );
}

export function Button({
  children,
  variant = 'primary',
  style,
  ...props
}: PressableProps & { children: string; variant?: 'primary' | 'ghost' | 'small'; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  const ghost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variant === 'small' && styles.buttonSmall,
        ghost ? { borderWidth: 1.5, borderColor: c.ink } : { backgroundColor: c.green },
        pressed && { opacity: 0.8 },
        style,
      ]}
      {...props}>
      <Text style={[styles.buttonText, variant === 'small' && { fontSize: 14 }, { color: ghost ? c.ink : '#fff' }]}>
        {children.toUpperCase()}
      </Text>
    </Pressable>
  );
}

export function Chip({ children, active, onPress }: { children: string; active?: boolean; onPress?: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, { borderColor: active ? c.ink : c.line, backgroundColor: active ? c.ink : 'transparent' }]}>
      <Text style={[styles.chipText, { color: active ? c.background : c.ink }]}>{children}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const c = usePalette();
  return (
    <View style={[styles.bar, { backgroundColor: c.line }]}>
      <View style={[styles.barFill, { width: `${value}%`, backgroundColor: c.green }]} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.card }, style]}>{children}</View>;
}

/** Pantalla con scroll y el espaciado estándar de la app. */
export function Screen({ children, flush }: { children: ReactNode; flush?: ReactNode }) {
  const c = usePalette();
  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
      {flush}
      <View style={styles.pad}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, gap: 22, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hello: { fontFamily: Fonts.display, fontSize: 40, lineHeight: 40 },
  sub: { fontFamily: Fonts.body, fontSize: 14, marginTop: 6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { fontFamily: Fonts.displayBold, fontSize: 21, letterSpacing: 0.3 },
  sectionAction: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  body: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 19 },
  meta: { fontFamily: Fonts.bodyBold, fontSize: 11.5, letterSpacing: 1 },
  photo: { borderRadius: 14, overflow: 'hidden', padding: Spacing.l, justifyContent: 'flex-end' },
  photoLabel: {
    position: 'absolute',
    top: 10,
    left: 12,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  photoTitle: { color: '#fff', fontFamily: Fonts.display, fontSize: 32, lineHeight: 32, marginTop: 10 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  button: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { minHeight: 38, alignSelf: 'flex-start', paddingHorizontal: 14 },
  buttonText: { fontFamily: Fonts.displayBold, fontSize: 17, letterSpacing: 1 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  bar: { height: 6, borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  barFill: { height: '100%', borderRadius: 6 },
  card: { borderRadius: 14, padding: 14 },
});
