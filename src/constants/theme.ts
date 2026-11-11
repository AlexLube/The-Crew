import { useColorScheme } from 'react-native';

/**
 * Paleta tomada de thecrew.issaline.com:
 * verde Issaline #009353 como único acento, #272727 en titulares,
 * #F0F0F1 en fondos de tarjeta. El gris de texto se oscurece respecto
 * a la web (#999999) para que se lea al sol.
 */
export const Colors = {
  light: {
    green: '#009353',
    onGreen: '#ffffff',
    greenSoft: '#e3f3eb',
    ink: '#272727',
    muted: '#5f5f5f',
    faint: '#8c8c8c',
    line: '#e4e4e6',
    card: '#F0F0F1',
    background: '#ffffff',
  },
  dark: {
    green: '#1fb072',
    onGreen: '#0d1a13',
    greenSoft: '#16301f',
    ink: '#f1f1ef',
    muted: '#b4b4b0',
    faint: '#8a8a86',
    line: '#2f312f',
    card: '#232523',
    background: '#181918',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

/** Tonos para los huecos de foto, uno por oficio. */
export const OficioTint: Record<string, string> = {
  herreria: '#3d3a37',
  agricultura: '#2f4a35',
  ebanisteria: '#5a4430',
  mecanica: '#2f3a44',
  maker: '#4a3b4d',
  marca: '#00703f',
};

/**
 * Barlow Condensed sustituye a GT America Condensed y Barlow al texto,
 * hasta confirmar la licencia de las fuentes de marca para app.
 */
export const Fonts = {
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
} as const;

export const Spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export function usePalette(): Palette {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
