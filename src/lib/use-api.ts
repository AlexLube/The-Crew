import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api } from './api';

/** Carga datos de la API y los recarga cada vez que la pantalla vuelve a verse. */
export function useApi<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!ruta) return;
    setCargando(true);
    try {
      setDatos(await api<T>(ruta));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [ruta]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  return { datos, error, cargando, recargar, setDatos };
}
