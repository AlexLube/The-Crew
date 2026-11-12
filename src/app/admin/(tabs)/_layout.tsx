import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Fonts, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';

type IconName = keyof typeof Ionicons.glyphMap;

function Brand() {
  const c = usePalette();
  return (
    <View style={styles.brand}>
      <Text style={[styles.brandName, { color: c.ink }]}>THE CREW</Text>
      <Text style={[styles.brandBy, { color: c.green }]}>GESTIÓN</Text>
    </View>
  );
}

const tabs: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Pedidos', icon: 'file-tray-full-outline', iconActive: 'file-tray-full' },
  { name: 'nuevo', title: 'Alta de pedido', icon: 'add-circle-outline', iconActive: 'add-circle' },
  { name: 'usuarios', title: 'Usuarios', icon: 'people-outline', iconActive: 'people' },
  { name: 'cuenta', title: 'Cuenta', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

/** Panel de marketing: en pantallas anchas, menú lateral; en el móvil, pestañas abajo. */
export default function AdminTabs() {
  const c = usePalette();
  const ancho = useWindowDimensions().width >= 900;
  const [pendientes, setPendientes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      api<Record<string, number>>('/pedidos/resumen')
        .then((r) => setPendientes(r.pendiente))
        .catch(() => {});
    }, []),
  );

  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <Brand />,
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
        tabBarPosition: ancho ? 'left' : 'bottom',
        tabBarVariant: ancho ? 'material' : 'uikit',
        tabBarLabelPosition: ancho ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: c.green,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.line, borderRightColor: c.line, ...(ancho ? { minWidth: 220 } : {}) },
        tabBarLabelStyle: { fontFamily: Fonts.bodyBold, fontSize: ancho ? 14 : 11 },
      }}>
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarBadge: t.name === 'index' && pendientes ? pendientes : undefined,
            tabBarBadgeStyle: { backgroundColor: c.green, color: '#fff' },
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? t.iconActive : t.icon} size={size - 2} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  brandName: { fontFamily: 'BarlowCondensed_800ExtraBold', fontSize: 25 },
  brandBy: { fontFamily: 'Barlow_600SemiBold', fontSize: 10.5, letterSpacing: 1 },
});
