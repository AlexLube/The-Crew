import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Body, Muted } from '@/components/ui';
import { Fonts, OficioTint, usePalette, type Palette } from '@/constants/theme';
import { ESTADO_ADMIN, ESTADO_MAKER, fecha, type Estado, type Pedido } from '@/lib/api';

/** Campo de formulario con etiqueta. */
export function Campo({ etiqueta, ayuda, ...props }: TextInputProps & { etiqueta: string; ayuda?: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: c.ink }]}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor={c.faint}
        accessibilityLabel={etiqueta}
        {...props}
        style={[styles.input, { borderColor: c.line, color: c.ink, backgroundColor: c.background }, props.multiline && { minHeight: 80, textAlignVertical: 'top' }, props.style]}
      />
      {ayuda ? <Muted>{ayuda}</Muted> : null}
    </View>
  );
}

function coloresEstado(e: Estado, c: Palette) {
  switch (e) {
    case 'pendiente':
      return { bg: c.warnSoft, fg: c.warn };
    case 'aprobado':
    case 'en_almacen':
      return { bg: c.greenSoft, fg: c.green };
    case 'enviado':
      return { bg: c.green, fg: c.onGreen };
    default:
      return { bg: c.card, fg: c.danger };
  }
}

export function EstadoPill({ estado, vista = 'maker' }: { estado: Estado; vista?: 'maker' | 'admin' }) {
  const c = usePalette();
  const { bg, fg } = coloresEstado(estado, c);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{(vista === 'maker' ? ESTADO_MAKER : ESTADO_ADMIN)[estado]}</Text>
    </View>
  );
}

/** Pendiente → Aprobado → Enviado, como lo ve el maker. */
export function Pasos({ estado }: { estado: Estado }) {
  const c = usePalette();
  if (estado === 'rechazado' || estado === 'cancelado') return null;
  const nivel = { pendiente: 0, aprobado: 1, en_almacen: 1, enviado: 2 }[estado];
  const pasos = ['Pendiente', estado === 'en_almacen' ? 'Aprobado · preparando' : 'Aprobado', 'Enviado'];
  return (
    <View style={styles.pasos} accessibilityLabel={`Estado: ${pasos[nivel]}`}>
      {pasos.map((p, i) => (
        <View key={p} style={{ flex: 1, gap: 6 }}>
          <View style={[styles.pasoBarra, { backgroundColor: i <= nivel ? c.green : c.line }]} />
          <Text style={[styles.pasoText, { color: i <= nivel ? c.ink : c.faint }]}>{p}</Text>
        </View>
      ))}
    </View>
  );
}

export function Lineas({ lineas }: { lineas: Pedido['lineas'] }) {
  const c = usePalette();
  return (
    <View style={{ gap: 8 }}>
      {lineas.map((l) => (
        <View key={l.id} style={styles.linea}>
          <View style={[styles.miniatura, { backgroundColor: OficioTint[l.tono ?? 'marca'] ?? OficioTint.marca }]} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontFamily: Fonts.bodyBold }}>{l.nombre}</Body>
            <Muted>
              {l.talla ? `Talla ${l.talla} · ` : ''}
              {l.sku}
            </Muted>
          </View>
          <Text style={[styles.cantidad, { color: c.ink }]}>× {l.cantidad}</Text>
        </View>
      ))}
    </View>
  );
}

export function Historial({ historial, vista }: { historial: Pedido['historial']; vista: 'maker' | 'admin' }) {
  const c = usePalette();
  return (
    <View style={{ gap: 12 }}>
      {historial.map((h, i) => (
        <View key={i} style={styles.hist}>
          <View style={[styles.histDot, { backgroundColor: i === historial.length - 1 ? c.green : c.line }]} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontFamily: Fonts.bodyBold }}>
              {vista === 'maker' && h.estado === 'en_almacen' ? 'Preparando el envío' : (vista === 'maker' ? ESTADO_MAKER : ESTADO_ADMIN)[h.estado]}
              <Text style={{ fontFamily: Fonts.body, color: c.muted }}> · {fecha(h.creado_at, true)}</Text>
            </Body>
            {h.nota ? <Muted>{h.nota}</Muted> : null}
            {vista === 'admin' && h.usuario_nombre ? <Muted>por {h.usuario_nombre}</Muted> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function Direccion({ p }: { p: Pick<Pedido, 'envio_nombre' | 'envio_direccion' | 'envio_codigo_postal' | 'envio_ciudad' | 'envio_provincia' | 'envio_telefono'> }) {
  return (
    <View>
      <Body style={{ fontFamily: Fonts.bodyBold }}>{p.envio_nombre}</Body>
      <Muted>{p.envio_direccion}</Muted>
      <Muted>
        {[p.envio_codigo_postal, p.envio_ciudad].filter(Boolean).join(' ')}
        {p.envio_provincia ? ` (${p.envio_provincia})` : ''}
      </Muted>
      {p.envio_telefono ? <Muted>Tel. {p.envio_telefono}</Muted> : null}
    </View>
  );
}

export function Aviso({ children, tipo = 'error' }: { children: ReactNode; tipo?: 'error' | 'ok' | 'info' }) {
  const c = usePalette();
  const color = tipo === 'error' ? c.danger : tipo === 'ok' ? c.green : c.muted;
  const icono = tipo === 'error' ? 'alert-circle-outline' : tipo === 'ok' ? 'checkmark-circle-outline' : 'information-circle-outline';
  return (
    <View style={[styles.aviso, { backgroundColor: c.card }]} accessibilityLiveRegion="polite">
      <Ionicons name={icono} size={20} color={color} />
      <Text style={[styles.avisoText, { color: tipo === 'error' ? c.danger : c.ink }]}>{children}</Text>
    </View>
  );
}

export function Cargando() {
  const c = usePalette();
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={c.green} />
    </View>
  );
}

export function Vacio({ icono, titulo, texto }: { icono: keyof typeof Ionicons.glyphMap; titulo: string; texto?: string }) {
  const c = usePalette();
  return (
    <View style={styles.vacio}>
      <Ionicons name={icono} size={34} color={c.faint} />
      <Body style={{ fontFamily: Fonts.bodyBold, textAlign: 'center' }}>{titulo}</Body>
      {texto ? <Muted style={{ textAlign: 'center' }}>{texto}</Muted> : null}
    </View>
  );
}

/** Fila pulsable de una lista. */
export function Fila({ onPress, children, label }: { onPress: () => void; children: ReactNode; label?: string }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fila, { borderBottomColor: c.line }, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1, gap: 4 }}>{children}</View>
      <Ionicons name="chevron-forward" size={18} color={c.faint} />
    </Pressable>
  );
}

/** Selector de cantidad −/+. */
export function Cantidad({ valor, onCambio }: { valor: number; onCambio: (n: number) => void }) {
  const c = usePalette();
  const boton = (icono: 'remove' | 'add', delta: number, label: string) => (
    <Pressable
      onPress={() => onCambio(valor + delta)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[styles.cantBtn, { borderColor: c.line }]}>
      <Ionicons name={icono} size={16} color={c.ink} />
    </Pressable>
  );
  return (
    <View style={styles.cant}>
      {boton('remove', -1, 'Quitar uno')}
      <Text style={[styles.cantidad, { color: c.ink, minWidth: 22, textAlign: 'center' }]}>{valor}</Text>
      {boton('add', 1, 'Añadir uno')}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: Fonts.bodyBold, fontSize: 13.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: Fonts.body, fontSize: 15 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  pasos: { flexDirection: 'row', gap: 6 },
  pasoBarra: { height: 5, borderRadius: 3 },
  pasoText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniatura: { width: 44, height: 44, borderRadius: 8 },
  cantidad: { fontFamily: Fonts.displayBold, fontSize: 18 },
  hist: { flexDirection: 'row', gap: 12 },
  histDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  aviso: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 10, padding: 12 },
  avisoText: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14 },
  vacio: { alignItems: 'center', gap: 8, paddingVertical: 36, paddingHorizontal: 20 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cant: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cantBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Enlace de texto en verde. */
export function Enlace({ children, onPress }: { children: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={{ alignSelf: 'flex-start' }}>
      <Text style={{ color: c.green, fontFamily: Fonts.bodyBold, fontSize: 14 }}>{children}</Text>
    </Pressable>
  );
}
