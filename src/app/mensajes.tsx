import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Muted } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { useCrew } from '@/state/crew-store';

export default function Mensajes() {
  const c = usePalette();
  const { mensajes, enviarMensaje, marcarLeido } = useCrew();
  const [texto, setTexto] = useState('');

  useEffect(() => {
    marcarLeido();
    // Solo al abrir la conversación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    enviarMensaje(t);
    setTexto('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.head}>
          <View style={[styles.avatar, { backgroundColor: c.green }]} />
          <View>
            <Body style={{ fontFamily: Fonts.bodyBold }}>Equipo The Crew</Body>
            <Muted>Responde en el día</Muted>
          </View>
        </View>
        {mensajes.map((m) => (
          <View
            key={m.id}
            style={[
              styles.msg,
              m.mio
                ? { alignSelf: 'flex-end', backgroundColor: c.green, borderBottomRightRadius: 4 }
                : { alignSelf: 'flex-start', backgroundColor: c.card, borderBottomLeftRadius: 4 },
            ]}>
            <Text style={[styles.msgText, { color: m.mio ? '#fff' : c.ink }]}>{m.texto}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.compose, { borderTopColor: c.line }]}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={enviar}
          placeholder="Escribe un mensaje"
          placeholderTextColor={c.faint}
          accessibilityLabel="Mensaje"
          style={[styles.input, { borderColor: c.line, color: c.ink }]}
        />
        <Button variant="small" onPress={enviar} style={{ alignSelf: 'center' }}>
          Enviar
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 18, gap: 8, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  msg: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  msgText: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 20 },
  compose: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.body, fontSize: 15 },
});
