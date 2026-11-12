import { useState } from 'react';

import { Aviso, Campo } from '@/components/pedidos';
import { Body, Button, Card, Hello, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth, useYo } from '@/state/auth';

export default function Cuenta() {
  const yo = useYo();
  const { salir } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  async function cambiar() {
    try {
      await api('/yo/password', { cuerpo: { actual, nueva } });
      setActual('');
      setNueva('');
      setAviso({ tipo: 'ok', texto: 'Contraseña cambiada.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: (e as Error).message });
    }
  }

  return (
    <Screen>
      <Hello top="Tu" accent="cuenta" />
      <Card style={{ gap: 4 }}>
        <Body style={{ fontFamily: Fonts.bodyBold }}>{yo.nombre}</Body>
        <Muted>{yo.email}</Muted>
        <Muted>{yo.rol === 'marketing' ? 'Marketing' : 'Almacén'}</Muted>
      </Card>
      <SectionTitle>Cambiar contraseña</SectionTitle>
      <Campo etiqueta="Contraseña actual" value={actual} onChangeText={setActual} secureTextEntry autoComplete="current-password" />
      <Campo etiqueta="Nueva contraseña" value={nueva} onChangeText={setNueva} secureTextEntry autoComplete="new-password" ayuda="Al menos 8 caracteres." />
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      <Button variant="ghost" onPress={cambiar}>
        Cambiar contraseña
      </Button>
      <Button onPress={salir}>Cerrar sesión</Button>
    </Screen>
  );
}
