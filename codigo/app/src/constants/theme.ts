import { Platform, useColorScheme } from 'react-native';

export const Colors = {
  light: {
    bg: '#f4f6f8',
    surface: '#ffffff',
    ink: '#15202b',
    muted: '#5b6876',
    line: '#dfe4ea',
    body: '#e3e8ee',
    bodyEdge: '#cfd7e0',
    band: '#d6efe0',
    ok: '#15803d',
    okBg: '#e6f4ea',
    warn: '#b45309',
    warnBg: '#fdf1e1',
    bad: '#c1121f',
    badBg: '#fde8ea',
  },
  dark: {
    bg: '#0e141b',
    surface: '#16202a',
    ink: '#e7edf3',
    muted: '#93a2b1',
    line: '#26333f',
    body: '#22303d',
    bodyEdge: '#2e3e4d',
    band: '#173a28',
    ok: '#4ade80',
    okBg: '#12301f',
    warn: '#fbbf24',
    warnBg: '#352a12',
    bad: '#f87171',
    badBg: '#3a1a1d',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }),
};

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
