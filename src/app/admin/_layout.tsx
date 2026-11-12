import { Stack } from 'expo-router';

import { Fonts, usePalette } from '@/constants/theme';

export default function AdminLayout() {
  const c = usePalette();
  return (
    <Stack
      screenOptions={{
        headerTintColor: c.ink,
        headerTitleStyle: { fontFamily: Fonts.displayBold, fontSize: 20 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Pedido' }} />
      <Stack.Screen name="usuario/[id]" options={{ title: 'Usuario' }} />
      <Stack.Screen name="usuario/nuevo" options={{ title: 'Dar de alta' }} />
    </Stack>
  );
}
