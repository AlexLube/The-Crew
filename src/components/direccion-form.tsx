import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Campo } from '@/components/pedidos';
import { Button } from '@/components/ui';
import { api, type Usuario } from '@/lib/api';

const CAMPOS = [
  ['telefono', 'Teléfono', 'phone-pad'],
  ['direccion', 'Dirección', 'default'],
  ['codigo_postal', 'Código postal', 'number-pad'],
  ['ciudad', 'Ciudad', 'default'],
  ['provincia', 'Provincia', 'default'],
] as const;

/** Datos de envío del maker, que se guardan en su perfil. */
export function DireccionForm({ usuario, onGuardado }: { usuario: Usuario; onGuardado: (u: Usuario) => void }) {
  const [valores, setValores] = useState(() => Object.fromEntries(CAMPOS.map(([k]) => [k, usuario[k] ?? ''])));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!valores.direccion.trim() || !valores.codigo_postal.trim() || !valores.ciudad.trim()) {
      return setError('Necesitamos dirección, código postal y ciudad para enviarte los pedidos.');
    }
    setGuardando(true);
    try {
      onGuardado(await api<Usuario>('/yo', { metodo: 'PATCH', cuerpo: valores }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {CAMPOS.map(([k, etiqueta, teclado]) => (
        <Campo key={k} etiqueta={etiqueta} value={valores[k]} keyboardType={teclado} onChangeText={(t) => setValores((v) => ({ ...v, [k]: t }))} />
      ))}
      {error ? <Aviso>{error}</Aviso> : null}
      <Button onPress={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar datos de envío'}
      </Button>
    </View>
  );
}
