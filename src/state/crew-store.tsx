import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { mensajesIniciales, progresoInicial, type Mensaje } from '@/data/ejemplo';

/**
 * Estado del prototipo en memoria. Cuando haya backend, este contexto
 * se sustituye por llamadas a la API manteniendo la misma interfaz.
 */
type CrewState = {
  progreso: Record<string, boolean[]>;
  alternarLeccion: (cursoId: string, i: number) => void;
  apuntadas: Record<string, boolean>;
  alternarCampana: (id: string) => void;
  subidas: Record<string, string[]>;
  anadirSubida: (campanaId: string, uri: string) => void;
  asistoEvento: boolean;
  alternarEvento: () => void;
  publicarEnWeb: boolean;
  alternarPublicar: () => void;
  mensajes: Mensaje[];
  enviarMensaje: (texto: string) => void;
  sinLeer: boolean;
  marcarLeido: () => void;
};

const Ctx = createContext<CrewState | null>(null);

export function CrewProvider({ children }: { children: ReactNode }) {
  const [progreso, setProgreso] = useState(progresoInicial);
  const [apuntadas, setApuntadas] = useState<Record<string, boolean>>({});
  const [subidas, setSubidas] = useState<Record<string, string[]>>({});
  const [asistoEvento, setAsisto] = useState(false);
  const [publicarEnWeb, setPublicar] = useState(true);
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [sinLeer, setSinLeer] = useState(true);

  const value = useMemo<CrewState>(
    () => ({
      progreso,
      alternarLeccion: (cursoId, i) =>
        setProgreso((p) => ({ ...p, [cursoId]: p[cursoId].map((v, j) => (j === i ? !v : v)) })),
      apuntadas,
      alternarCampana: (id) => setApuntadas((a) => ({ ...a, [id]: !a[id] })),
      subidas,
      anadirSubida: (id, uri) => setSubidas((s) => ({ ...s, [id]: [...(s[id] ?? []), uri] })),
      asistoEvento,
      alternarEvento: () => setAsisto((v) => !v),
      publicarEnWeb,
      alternarPublicar: () => setPublicar((v) => !v),
      mensajes,
      enviarMensaje: (texto) =>
        setMensajes((m) => [...m, { id: `m${m.length + 1}`, mio: true, texto }]),
      sinLeer,
      marcarLeido: () => setSinLeer(false),
    }),
    [progreso, apuntadas, subidas, asistoEvento, publicarEnWeb, mensajes, sinLeer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrew() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCrew debe usarse dentro de CrewProvider');
  return ctx;
}

export function porcentaje(lecciones: boolean[] | undefined) {
  if (!lecciones?.length) return 0;
  return Math.round((100 * lecciones.filter(Boolean).length) / lecciones.length);
}
