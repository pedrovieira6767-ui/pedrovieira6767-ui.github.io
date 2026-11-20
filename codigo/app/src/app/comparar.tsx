import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Corpo } from '@/components/Corpo';
import { Card, Chip, Pill, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { ORDEM_SISTEMAS, SISTEMAS, SistemaId } from '@/data/catalogo';
import { contagem, fmt, idade, Pessoa, Resultado, series, statusDe } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

function Seletor({ pessoas, valor, outro, onEscolher }: { pessoas: Pessoa[]; valor: string | null; outro: string | null; onEscolher: (id: string | null) => void }) {
  const c = usePalette();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {pessoas.map((p) => {
        const on = valor === p.id;
        return (
          <Pressable key={p.id} disabled={outro === p.id} onPress={() => onEscolher(on ? null : p.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: on ? 2 : 1, borderColor: on ? p.cor : c.line, opacity: outro === p.id ? 0.35 : 1, backgroundColor: c.surface }}>
            <T v="small" style={{ fontWeight: '600' }} cor={on ? p.cor : 'ink'}>{p.nome}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Lado({ p, rs }: { p: Pessoa | undefined; rs: Resultado[] }) {
  if (!p) {
    return (
      <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
        <Corpo sexo="M" vazio largura={70} />
        <T v="h3" cor="muted">Escolha</T>
        <T v="small" cor="muted">uma pessoa</T>
      </View>
    );
  }
  const ct = contagem(series(rs));
  const anos = idade(p.nascimento);
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Corpo sexo={p.sexo} cabelo={p.cabelo} cor={p.cor} largura={70} sistemas={[...new Set(rs.map((r) => r.sistema))]} />
      <T v="h2" cor={p.cor}>{p.nome}</T>
      {anos ? <T v="small" cor="muted">{anos} anos</T> : null}
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Pill status="fora" texto={`${ct.fora} fora`} />
        <Pill status="limite" texto={`${ct.limite} a observar`} />
      </View>
    </View>
  );
}

function Faixas({ a, b, corA, corB }: { a: Resultado; b: Resultado; corA: string; corB: string }) {
  const c = usePalette();
  const vals = [a.valor!, b.valor!, a.refMin, a.refMax, b.refMin, b.refMax].filter((x): x is number => x != null);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const w = hi - lo || hi || 1;
  lo = a.refMin == null || b.refMin == null ? 0 : Math.max(0, lo - w * 0.35);
  hi = a.refMax == null || b.refMax == null ? hi * 1.35 : hi + w * 0.35;
  const pc = (x: number) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
  const faixa = (r: Resultado, cor: string) => {
    const L = r.refMin != null ? pc(r.refMin) : 0;
    const R = r.refMax != null ? pc(r.refMax) : 100;
    return (
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.line, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: `${L}%`, width: `${R - L}%`, top: 0, bottom: 0, borderRadius: 4, backgroundColor: c.band }} />
        <View style={{ position: 'absolute', left: `${pc(r.valor!)}%`, marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: cor, borderWidth: 2, borderColor: c.surface }} />
      </View>
    );
  };
  return <View style={{ gap: 5 }}>{faixa(a, corA)}{faixa(b, corB)}</View>;
}

export default function Comparar() {
  const c = usePalette();
  const { pessoas, resultados } = useAmpla();
  const visiveis = pessoas.filter((p) => p.nivelRecebido === 'tudo');
  const [ia, setIa] = useState<string | null>(null);
  const [ib, setIb] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<SistemaId | null>(null);
  const A = visiveis.find((p) => p.id === ia);
  const B = visiveis.find((p) => p.id === ib);

  const comuns = useMemo(() => {
    if (!A || !B) return [];
    const sa = new Map(series(resultados[A.id] ?? []).map((s) => [s.codigo, s.atual]));
    const sb = new Map(series(resultados[B.id] ?? []).map((s) => [s.codigo, s.atual]));
    return [...sa.entries()].filter(([k, r]) => sb.has(k) && r.valor != null && sb.get(k)!.valor != null).map(([k, r]) => ({ codigo: k, a: r, b: sb.get(k)! }));
  }, [A, B, resultados]);

  const sistemas = ORDEM_SISTEMAS.filter((s) => comuns.some((x) => x.a.sistema === s));
  const lista = comuns.filter((x) => !filtro || x.a.sistema === filtro);

  return (
    <Tela>
      <T cor="muted">Exames em comum, lado a lado. Cada barra usa a faixa de referência da própria pessoa.</T>
      <Card>
        <View style={{ gap: 8 }}>
          <Seletor pessoas={visiveis} valor={ia} outro={ib} onEscolher={setIa} />
          <T v="h2" cor="muted" style={{ textAlign: 'center', letterSpacing: 2 }}>VS</T>
          <Seletor pessoas={visiveis} valor={ib} outro={ia} onEscolher={setIb} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Lado p={A} rs={A ? resultados[A.id] ?? [] : []} />
          <Lado p={B} rs={B ? resultados[B.id] ?? [] : []} />
        </View>
      </Card>

      {A && B && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip titulo={`Todos (${comuns.length})`} cor={c.ink} ativo={!filtro} onPress={() => setFiltro(null)} />
            {sistemas.map((s) => <Chip key={s} titulo={SISTEMAS[s].chip} cor={SISTEMAS[s].cor} ativo={filtro === s} onPress={() => setFiltro(s)} />)}
          </View>
          <Card>
            {lista.map(({ codigo, a, b }) => {
              const sa = statusDe(a), sb2 = statusDe(b);
              return (
                <View key={codigo} style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                  <T v="h3">{a.nome} <T v="small" cor="muted">{a.unidade}</T></T>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T v="mono" cor={sa === 'fora' ? 'bad' : sa === 'limite' ? 'warn' : A.cor}>● {fmt(a.valor!)}</T>
                    <T v="mono" cor={sb2 === 'fora' ? 'bad' : sb2 === 'limite' ? 'warn' : B.cor}>{fmt(b.valor!)} ●</T>
                  </View>
                  <Faixas a={a} b={b} corA={A.cor} corB={B.cor} />
                </View>
              );
            })}
            {!lista.length && <T cor="muted">Nenhum exame em comum ainda.</T>}
          </Card>
        </>
      )}
      {visiveis.length < 2 && <T v="small" cor="muted">Para comparar, a outra pessoa precisa compartilhar “tudo” com você.</T>}
    </Tela>
  );
}
