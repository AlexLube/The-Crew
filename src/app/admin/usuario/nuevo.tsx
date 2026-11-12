import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Campo } from '@/components/pedidos';
import { Body, Button, Card, Chip, Muted, Screen, SectionTitle } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { api, ETIQUETA_PERFIL, type Perfil, type Rol, type Usuario } from '@/lib/api';
import { useYo } from '@/state/auth';

const CAMPOS = [
  ['nombre', 'Nombre y apellidos', 'default'],
  ['email', 'Email', 'email-address'],
  ['telefono', 'Teléfono', 'phone-pad'],
  ['oficio', 'Oficio', 'default'],
  ['taller', 'Taller o empresa', 'default'],
  ['instagram', 'Instagram', 'default'],
  ['direccion', 'Dirección', 'default'],
  ['codigo_postal', 'Código postal', 'number-pad'],
  ['ciudad', 'Ciudad', 'default'],
  ['provincia', 'Provincia', 'default'],
  ['tallas', 'Tallas habituales', 'default'],
] as const;

export default function NuevoUsuario() {
  const yo = useYo();
  const [rol, setRol] = useState<Rol>('maker');
  const [perfil, setPerfil] = useState<Perfil>('embajador');
  const [v, setV] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<{ usuario: Usuario; password_temporal?: string } | null>(null);

  if (yo.rol !== 'marketing') return <Screen><Aviso>Solo marketing puede dar de alta usuarios.</Aviso></Screen>;

  if (creado) {
    return (
      <Screen>
        <Aviso tipo="ok">{creado.usuario.nombre} ya tiene cuenta.</Aviso>
        <Card style={{ gap: 8 }}>
          <Muted>Pásale estos datos para que entre en la app (la contraseña solo se ve ahora):</Muted>
          <Body style={{ fontFamily: Fonts.bodyBold }} >Email: {creado.usuario.email}</Body>
          <Body style={{ fontFamily: Fonts.bodyBold }}>Contraseña: {creado.password_temporal}</Body>
        </Card>
        <Button onPress={() => router.replace(`/admin/usuario/${creado.usuario.id}`)}>Ver ficha</Button>
      </Screen>
    );
  }

  async function crear() {
    try {
      setError(null);
      setCreado(await api('/usuarios', { cuerpo: { ...v, rol, perfil: rol === 'maker' ? perfil : undefined, notas_internas: notas } }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Screen>
      <Muted>Mientras no haya registro abierto (fase 2), las cuentas las crea marketing. Se genera una contraseña temporal.</Muted>
      <View style={{ gap: 10 }}>
        <SectionTitle>Tipo de cuenta</SectionTitle>
        <View style={styles.chips}>
          {(['embajador', 'singular_worker', 'maker_evento'] as Perfil[]).map((p) => (
            <Chip key={p} active={rol === 'maker' && perfil === p} onPress={() => (setRol('maker'), setPerfil(p))}>
              {ETIQUETA_PERFIL[p]}
            </Chip>
          ))}
          <Chip active={rol === 'marketing'} onPress={() => setRol('marketing')}>
            Marketing
          </Chip>
          <Chip active={rol === 'almacen'} onPress={() => setRol('almacen')}>
            Almacén
          </Chip>
        </View>
      </View>
      {CAMPOS.filter(([k]) => rol === 'maker' || k === 'nombre' || k === 'email').map(([k, t, teclado]) => (
        <Campo
          key={k}
          etiqueta={t}
          value={v[k] ?? ''}
          keyboardType={teclado}
          autoCapitalize={k === 'email' || k === 'instagram' ? 'none' : 'sentences'}
          onChangeText={(x) => setV((o) => ({ ...o, [k]: x }))}
        />
      ))}
      <Campo etiqueta="Notas internas (no las ve el maker)" value={notas} onChangeText={setNotas} multiline />
      {error ? <Aviso>{error}</Aviso> : null}
      <Button onPress={crear}>Crear cuenta</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
