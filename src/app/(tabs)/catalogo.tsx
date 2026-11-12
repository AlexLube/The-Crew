import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ListaProductos } from '@/components/catalogo';
import { Aviso, Cargando } from '@/components/pedidos';
import { Hello, Screen } from '@/components/ui';
import { Fonts, usePalette } from '@/constants/theme';
import type { Producto } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useYo } from '@/state/auth';
import { useCarrito } from '@/state/carrito';

export default function Catalogo() {
  const c = usePalette();
  const yo = useYo();
  const { datos, error } = useApi<Producto[]>('/productos');
  const { anadir, unidades } = useCarrito();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Screen>
        <Hello
          top="Catálogo"
          accent={yo.perfil === 'embajador' ? 'Tu pedido del mes' : 'Pide lo que necesitas'}
          sub="Elige prendas y tallas. Marketing revisa cada solicitud antes de enviarla desde nuestro almacén."
        />
        {error ? <Aviso>{error}</Aviso> : null}
        {datos ? <ListaProductos productos={datos} onAnadir={anadir} /> : !error && <Cargando />}
        {unidades ? <View style={{ height: 60 }} /> : null}
      </Screen>
      {unidades ? (
        <Pressable
          onPress={() => router.push('/pedido/revisar')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.barra, { backgroundColor: c.green }, pressed && { opacity: 0.85 }]}>
          <Ionicons name="bag-check-outline" size={22} color="#fff" />
          <Text style={styles.barraText}>REVISAR SOLICITUD · {unidades}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    maxWidth: 688,
    alignSelf: 'center',
    borderRadius: 12,
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barraText: { flex: 1, color: '#fff', fontFamily: Fonts.displayBold, fontSize: 18, letterSpacing: 1 },
});
