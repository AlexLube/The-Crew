import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Campo } from '@/components/pedidos';
import { Button, Muted } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function Login() {
  const c = usePalette();
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!email.trim() || !password) return setError('Escribe tu email y tu contraseña.');
    setEnviando(true);
    setError(null);
    try {
      await entrar(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.caja}>
          <View>
            <Text style={[styles.marca, { color: c.ink }]}>THE CREW</Text>
            <Text style={[styles.by, { color: c.faint }]}>BY ISSALINE</Text>
          </View>
          <Muted>Entra con el email y la contraseña que te ha dado el equipo de Issaline.</Muted>
          <Campo
            etiqueta="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            textContentType="emailAddress"
          />
          <Campo
            etiqueta="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={enviar}
          />
          {error ? <Aviso>{error}</Aviso> : null}
          <Button onPress={enviar} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
          <Muted style={{ textAlign: 'center' }}>¿No tienes cuenta o la has olvidado? Escribe a marketing de Issaline.</Muted>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  caja: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 18 },
  marca: { fontFamily: Fonts.display, fontSize: 56, lineHeight: 56 },
  by: { fontFamily: Fonts.bodyBold, fontSize: 13, letterSpacing: 2 },
});
