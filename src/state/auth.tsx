import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, configurarApi, type Usuario } from '@/lib/api';
import { guardarToken, leerToken } from '@/lib/token';

type Auth = {
  usuario: Usuario | null;
  iniciando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
  actualizar: (u: Usuario) => void;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);

  const olvidar = useCallback(async () => {
    configurarApi(null);
    setUsuario(null);
    await guardarToken(null);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await leerToken();
      if (token) {
        configurarApi(token, olvidar);
        try {
          setUsuario(await api<Usuario>('/yo'));
        } catch (e) {
          // Si el servidor no responde, se pide entrar de nuevo
          if ((e as { status?: number }).status !== 0) await olvidar();
        }
      }
      setIniciando(false);
    })();
  }, [olvidar]);

  const value = useMemo<Auth>(
    () => ({
      usuario,
      iniciando,
      entrar: async (email, password) => {
        const r = await api<{ token: string; usuario: Usuario }>('/auth/login', { cuerpo: { email, password } });
        configurarApi(r.token, olvidar);
        await guardarToken(r.token);
        setUsuario(r.usuario);
      },
      salir: async () => {
        await api('/auth/logout', { metodo: 'POST' }).catch(() => {});
        await olvidar();
      },
      actualizar: setUsuario,
    }),
    [usuario, iniciando, olvidar],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** El usuario con sesión iniciada (solo en pantallas protegidas). */
export function useYo() {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('Sin sesión');
  return usuario;
}
