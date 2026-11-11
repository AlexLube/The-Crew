import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, usePalette } from '@/constants/theme';
import { useCrew } from '@/state/crew-store';

type IconName = keyof typeof Ionicons.glyphMap;

function Brand() {
  const c = usePalette();
  return (
    <View style={styles.brand}>
      <Text style={[styles.brandName, { color: c.ink }]}>THE CREW</Text>
      <Text style={[styles.brandBy, { color: c.faint }]}>BY ISSALINE</Text>
    </View>
  );
}

function MessagesButton() {
  const c = usePalette();
  const { sinLeer } = useCrew();
  return (
    <Pressable
      onPress={() => router.push('/mensajes')}
      accessibilityRole="button"
      accessibilityLabel="Mensajes"
      hitSlop={8}
      style={styles.msgBtn}>
      <Ionicons name="chatbox-outline" size={23} color={c.ink} />
      {sinLeer ? <View style={[styles.dot, { backgroundColor: c.green, borderColor: c.background }]} /> : null}
    </Pressable>
  );
}

const tabs: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  { name: 'escuela', title: 'Escuela', icon: 'school-outline', iconActive: 'school' },
  { name: 'tablon', title: 'Tablón', icon: 'newspaper-outline', iconActive: 'newspaper' },
  { name: 'crew', title: 'The Crew', icon: 'people-outline', iconActive: 'people' },
  { name: 'taller', title: 'Mi taller', icon: 'construct-outline', iconActive: 'construct' },
];

export default function TabLayout() {
  const c = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <Brand />,
        headerTitleAlign: 'left',
        headerRight: () => <MessagesButton />,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
        tabBarActiveTintColor: c.green,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: Fonts.bodyBold, fontSize: 11 },
      }}>
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
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
  msgBtn: { marginRight: 16, padding: 4 },
  dot: { position: 'absolute', top: 2, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
