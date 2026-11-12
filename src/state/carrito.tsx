import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { LineaNueva, Producto } from '@/lib/api';

export type LineaCarrito = LineaNueva & { producto: Producto };

type Carrito = {
  lineas: LineaCarrito[];
  unidades: number;
  anadir: (producto: Producto, talla: string | null, cantidad?: number) => void;
  cambiarCantidad: (i: number, cantidad: number) => void;
  vaciar: () => void;
};

const Ctx = createContext<Carrito | null>(null);

/** Artículos que el maker va eligiendo antes de enviar la solicitud. */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const value = useMemo<Carrito>(
    () => ({
      lineas,
      unidades: lineas.reduce((n, l) => n + l.cantidad, 0),
      anadir: (producto, talla, cantidad = 1) =>
        setLineas((ls) => {
          const i = ls.findIndex((l) => l.producto_id === producto.id && l.talla === talla);
          if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, cantidad: Math.min(20, l.cantidad + cantidad) } : l));
          return [...ls, { producto_id: producto.id, producto, talla, cantidad }];
        }),
      cambiarCantidad: (i, cantidad) =>
        setLineas((ls) => (cantidad <= 0 ? ls.filter((_, j) => j !== i) : ls.map((l, j) => (j === i ? { ...l, cantidad: Math.min(20, cantidad) } : l)))),
      vaciar: () => setLineas([]),
    }),
    [lineas],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
}
