import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Fonts, Palette, usePalette } from '@/constants/theme';
import { Status } from '@/lib/saude';

export function Tela({ children, rodape }: { children: React.ReactNode; rodape?: React.ReactNode }) {
  const c = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: rodape ? 96 : 40, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
        {children}
      </ScrollView>
      {rodape}
    </SafeAreaView>
  );
}

export function T({ children, v = 'body', style, cor, numberOfLines }: {
  children: React.ReactNode;
  v?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'mono';
  style?: TextStyle;
  cor?: keyof Palette | string;
  numberOfLines?: number;
}) {
  const c = usePalette();
  const color = cor ? ((c as Record<string, string>)[cor] ?? cor) : c.ink;
  return <Text numberOfLines={numberOfLines} style={[estilosTexto[v], { color }, style]}>{children}</Text>;
}

const estilosTexto = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: '700' },
  h3: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  mono: { fontFamily: Fonts.mono, fontSize: 15, fontWeight: '700' },
});

export function Card({ children, style, borda }: { children: React.ReactNode; style?: ViewStyle; borda?: string }) {
  const c = usePalette();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 }, borda ? { borderLeftWidth: 4, borderLeftColor: borda } : null, style]}>
      {children}
    </View>
  );
}

export function Botao({ titulo, onPress, tipo = 'primario', icone, desabilitado, style }: {
  titulo: string;
  onPress: () => void;
  tipo?: 'primario' | 'secundario';
  icone?: string;
  desabilitado?: boolean;
  style?: ViewStyle;
}) {
  const c = usePalette();
  const prim = tipo === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desabilitado}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999 },
        prim ? { backgroundColor: c.ink } : { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
        { opacity: desabilitado ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}>
      {icone ? <Text style={{ color: prim ? c.bg : c.ink, fontWeight: '700', fontSize: 16 }}>{icone}</Text> : null}
      <Text style={{ color: prim ? c.bg : c.ink, fontWeight: '600', fontSize: 15 }}>{titulo}</Text>
    </Pressable>
  );
}

export function Chip({ titulo, cor, ativo, onPress, contador, contadorTipo }: {
  titulo: string;
  cor: string;
  ativo?: boolean;
  onPress: () => void;
  contador?: number;
  contadorTipo?: 'fora' | 'limite';
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!ativo }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999, borderWidth: ativo ? 2 : 1, borderColor: ativo ? cor : c.line, backgroundColor: c.surface }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor }} />
      <Text style={{ color: c.ink, fontSize: 13.5, fontWeight: '500' }}>{titulo}</Text>
      {contador ? (
        <Text style={{ fontSize: 11, fontFamily: Fonts.mono, paddingHorizontal: 5, borderRadius: 5, overflow: 'hidden', color: contadorTipo === 'fora' ? c.bad : c.warn, backgroundColor: contadorTipo === 'fora' ? c.badBg : c.warnBg }}>{contador}</Text>
      ) : null}
    </Pressable>
  );
}

export function Pill({ status, texto }: { status: Status | 'neutro'; texto: string }) {
  const c = usePalette();
  const m = {
    ok: [c.ok, c.okBg], limite: [c.warn, c.warnBg], fora: [c.bad, c.badBg], info: [c.muted, c.line], neutro: [c.muted, c.line],
  }[status];
  return (
    <Text numberOfLines={1} style={{ flexShrink: 0, color: m[0], backgroundColor: m[1], fontSize: 12, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>{texto}</Text>
  );
}

/** Barra de referência: faixa verde + marcador; opcional marcador do valor anterior. */
export function BarraRef({ valor, refMin, refMax, anterior, status, cor }: {
  valor: number;
  refMin?: number | null;
  refMax?: number | null;
  anterior?: number | null;
  status: Status;
  cor?: string;
}) {
  const c = usePalette();
  const vals = [valor, anterior ?? valor];
  const mx = Math.max(...vals, refMax ?? 0), mn = Math.min(...vals, refMin ?? valor);
  let a: number, b: number;
  if (refMin != null && refMax != null) { const w = refMax - refMin; a = Math.max(0, refMin - w * 0.45); b = refMax + w * 0.45; }
  else if (refMax != null) { a = 0; b = refMax * 1.45; }
  else if (refMin != null) { a = 0; b = Math.max(refMin * 2, mx * 1.2); }
  else { a = 0; b = mx * 1.6 || 1; }
  a = Math.min(a, mn - (b - a) * 0.05); b = Math.max(b, mx + (b - a) * 0.08);
  const pc = (x: number) => `${Math.max(0, Math.min(100, ((x - a) / (b - a)) * 100))}%` as const;
  const L = refMin != null ? (refMin - a) / (b - a) : 0;
  const R = refMax != null ? (refMax - a) / (b - a) : 1;
  const mk = cor ?? (status === 'fora' ? c.bad : status === 'limite' ? c.warn : c.ink);
  return (
    <View style={{ height: 12, borderRadius: 6, backgroundColor: c.line, justifyContent: 'center' }}>
      {(refMin != null || refMax != null) && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${L * 100}%`, width: `${(R - L) * 100}%`, backgroundColor: c.band, borderRadius: 6 }} />
      )}
      {anterior != null && <View style={{ position: 'absolute', left: pc(anterior), width: 3, height: 12, marginLeft: -1.5, backgroundColor: c.muted, opacity: 0.5, borderRadius: 2 }} />}
      <View style={{ position: 'absolute', left: pc(valor), width: 5, height: 20, marginLeft: -2.5, backgroundColor: mk, borderRadius: 3 }} />
    </View>
  );
}

export function Sparkline({ valores, cor }: { valores: number[]; cor: string }) {
  if (valores.length < 2) return null;
  const W = 64, H = 20, p = 3;
  const mn = Math.min(...valores), mx = Math.max(...valores);
  const xy = valores.map((y, i) => [p + (i * (W - 2 * p)) / (valores.length - 1), mx === mn ? H / 2 : H - p - ((y - mn) / (mx - mn)) * (H - 2 * p)]);
  const d = xy.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');
  const e = xy[xy.length - 1];
  return (
    <Svg width={W} height={H}>
      <Path d={d} fill="none" stroke={cor} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={e[0]} cy={e[1]} r={2.6} fill={cor} />
    </Svg>
  );
}

export function Recolhivel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const c = usePalette();
  const [aberto, setAberto] = React.useState(false);
  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: aberto }} onPress={() => setAberto(!aberto)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T v="h2" style={{ flexShrink: 1 }}>{titulo}</T>
        <Text style={{ color: c.muted, fontWeight: '600', fontSize: 13, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
          {aberto ? 'Ocultar ⌃' : 'Mostrar ›'}
        </Text>
      </Pressable>
      {aberto ? children : null}
    </Card>
  );
}

export function Logo({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 32 32">
      <Circle cx={12} cy={16} r={9} fill="#2f6fde" opacity={0.9} />
      <Circle cx={20} cy={16} r={9} fill="#d4407a" opacity={0.85} />
      <Path d="M6 17h5l2-5 3 9 2-6 2 2h6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
