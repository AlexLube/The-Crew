import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Cantidad } from '@/components/pedidos';
import { Body, Button, Chip, Muted } from '@/components/ui';
import { Fonts, OficioTint, usePalette } from '@/constants/theme';
import type { Producto } from '@/lib/api';

/**
 * Lista de productos por categoría. Al tocar uno se elige talla y
 * cantidad. La usan el catálogo del maker y el alta manual de marketing.
 */
export function ListaProductos({
  productos,
  onAnadir,
}: {
  productos: Producto[];
  onAnadir: (p: Producto, talla: string | null, cantidad: number) => void;
}) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const visibles = productos.filter((p) => !categoria || p.categoria === categoria);

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.chips}>
        <Chip active={!categoria} onPress={() => setCategoria(null)}>
          Todo
        </Chip>
        {categorias.map((cat) => (
          <Chip key={cat} active={categoria === cat} onPress={() => setCategoria(cat)}>
            {cat}
          </Chip>
        ))}
      </View>
      <View style={styles.grid}>
        {visibles.map((p) => (
          <ProductoTarjeta
            key={p.id}
            p={p}
            abierto={abierto === p.id}
            onToggle={() => setAbierto(abierto === p.id ? null : p.id)}
            onAnadir={(talla, n) => {
              onAnadir(p, talla, n);
              setAbierto(null);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function ProductoTarjeta({
  p,
  abierto,
  onToggle,
  onAnadir,
}: {
  p: Producto;
  abierto: boolean;
  onToggle: () => void;
  onAnadir: (talla: string | null, cantidad: number) => void;
}) {
  const c = usePalette();
  const [talla, setTalla] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const necesitaTalla = p.tallas.length > 0;

  return (
    <View style={[styles.tarjeta, abierto && styles.tarjetaAbierta, { backgroundColor: c.card }]}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: abierto }} accessibilityLabel={p.nombre}>
        <View style={[styles.foto, { backgroundColor: OficioTint[p.tono ?? 'marca'] ?? OficioTint.marca }]}>
          <Text style={styles.fotoLabel}>{p.categoria.toUpperCase()}</Text>
        </View>
        <View style={{ padding: 10, gap: 2 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }} numberOfLines={2}>
            {p.nombre}
          </Body>
          <Muted numberOfLines={abierto ? undefined : 1}>{p.descripcion ?? p.sku}</Muted>
        </View>
      </Pressable>
      {abierto ? (
        <View style={{ padding: 10, paddingTop: 0, gap: 12 }}>
          {necesitaTalla ? (
            <View style={styles.chips}>
              {p.tallas.map((t) => (
                <Chip key={t} active={talla === t} onPress={() => setTalla(t)}>
                  {t}
                </Chip>
              ))}
            </View>
          ) : (
            <Muted>Talla única</Muted>
          )}
          <View style={styles.fila}>
            <Cantidad valor={cantidad} onCambio={(n) => setCantidad(Math.max(1, Math.min(20, n)))} />
            <Button variant="small" disabled={necesitaTalla && !talla} style={necesitaTalla && !talla ? { opacity: 0.4 } : undefined} onPress={() => onAnadir(talla, cantidad)}>
              Añadir
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarjeta: { width: '47%', flexGrow: 1, maxWidth: 340, borderRadius: 14, overflow: 'hidden' },
  tarjetaAbierta: { width: '100%' },
  foto: { aspectRatio: 1.7, justifyContent: 'flex-start', padding: 10 },
  fotoLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: Fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.2 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
