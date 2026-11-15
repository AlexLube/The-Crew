import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Campo, Enlace } from '@/components/pedidos';
import { Body, Button, Card, Chip, Muted } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import { DEMO } from '@/lib/api';
import { PASSWORD_DEMO, reiniciarDemo } from '@/lib/demo-api';
import { useAuth } from '@/state/auth';

const CUENTAS_DEMO = [
  ['Marketing', 'marketing@issaline.com'],
  ['Embajador', 'josema@ejemplo.com'],
  ['Singular Worker', 'joel@ejemplo.com'],
  ['Maker de evento', 'alvaro@ejemplo.com'],
] as const;

export default function Login() {
  const c = usePalette();
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(cuenta?: string) {
    const e = cuenta ?? email.trim();
    const pw = cuenta ? PASSWORD_DEMO : password;
    if (!e || !pw) return setError('Escribe tu email y tu contraseña.');
    setEnviando(true);
    setError(null);
    try {
      await entrar(e, pw);
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
            onSubmitEditing={() => enviar()}
          />
          {error ? <Aviso>{error}</Aviso> : null}
          <Button onPress={() => enviar()} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
          {DEMO ? (
            <Card style={{ gap: 10 }}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>Versión de demostración</Body>
              <Muted>Entra con un clic como cualquiera de estos perfiles. Los datos son de ejemplo y se guardan solo en este navegador.</Muted>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CUENTAS_DEMO.map(([t, e]) => (
                  <Chip key={e} onPress={() => enviar(e)}>
                    {t}
                  </Chip>
                ))}
              </View>
              <Enlace
                onPress={() => {
                  reiniciarDemo();
                  setError(null);
                }}>
                Volver a los datos del principio
              </Enlace>
            </Card>
          ) : null}
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
