import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Guarda la sesión: en el llavero del móvil o en el navegador en web. */
const CLAVE = 'thecrew.sesion';

export async function leerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(CLAVE) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(CLAVE);
}

export async function guardarToken(token: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (token) globalThis.localStorage?.setItem(CLAVE, token);
      else globalThis.localStorage?.removeItem(CLAVE);
    } catch {}
    return;
  }
  if (token) await SecureStore.setItemAsync(CLAVE, token);
  else await SecureStore.deleteItemAsync(CLAVE);
}
