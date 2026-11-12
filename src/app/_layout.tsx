import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, Fonts, usePalette } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/state/auth';
import { CarritoProvider } from '@/state/carrito';
import { CrewProvider } from '@/state/crew-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const [loaded, error] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });

  if (!loaded && !error) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.green, background: c.background, card: c.background, text: c.ink, border: c.line },
  };

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <CrewProvider>
          <CarritoProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Rutas fuentesListas={loaded || !!error} />
          </CarritoProvider>
        </CrewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Cada rol ve solo sus pantallas: sin sesión, la de acceso; el maker,
 * su panel (las pestañas de siempre más catálogo y pedidos); marketing
 * y almacén, el panel de gestión.
 */
function Rutas({ fuentesListas }: { fuentesListas: boolean }) {
  const c = usePalette();
  const { usuario, iniciando } = useAuth();

  useEffect(() => {
    if (fuentesListas && !iniciando) SplashScreen.hideAsync();
  }, [fuentesListas, iniciando]);

  if (iniciando) return null;
  const esMaker = usuario?.rol === 'maker';
  const esStaff = usuario?.rol === 'marketing' || usuario?.rol === 'almacen';

  return (
    <Stack
      screenOptions={{
        headerTintColor: c.ink,
        headerTitleStyle: { fontFamily: Fonts.displayBold, fontSize: 20 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={esMaker}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="curso/[id]" options={{ title: 'Escuela' }} />
        <Stack.Screen name="campana/[id]" options={{ title: 'Campaña' }} />
        <Stack.Screen name="mensajes" options={{ title: 'Mensajes' }} />
        <Stack.Screen name="pedido/[id]" options={{ title: 'Pedido' }} />
        <Stack.Screen name="pedido/revisar" options={{ title: 'Tu solicitud' }} />
      </Stack.Protected>
      <Stack.Protected guard={esStaff}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
