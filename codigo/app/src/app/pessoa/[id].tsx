import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Corpo } from '@/components/Corpo';
import { BarraRef, Card, Chip, Pill, Recolhivel, Sparkline, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { ORDEM_SISTEMAS, SISTEMAS, SistemaId } from '@/data/catalogo';
import { contagem, dataBR, fmt, idade, mesAno, ROTULO, series, statusDe, ultimaColeta } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

export default function PessoaTela() {
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pessoa, resultados, euId } = useAmpla();
  const p = pessoa(String(id));
  const [ativo, setAtivo] = useState<SistemaId | null>(null);

  const rs = useMemo(() => (p && p.nivelRecebido !== 'nada' ? resultados[p.id] ?? [] : []), [p, resultados]);
  const ss = useMemo(() => series(rs), [rs]);
  const porSistema = useMemo(() => {
    const m = new Map<SistemaId, typeof ss>();
    for (const s of ss) {
      const k = s.atual.sistema;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [ss]);

  if (!p) {
    return (
      <Tela>
        <T>Pessoa não encontrada.</T>
      </Tela>
    );
  }

  const sistemas = ORDEM_SISTEMAS.filter((s) => porSistema.has(s));
  const alertas = sistemas.filter((s) => contagem(porSistema.get(s)!).fora > 0);
  const ct = contagem(ss);
  const soResumo = p.nivelRecebido === 'resumo';
  const ult = ultimaColeta(rs);
  const anos = idade(p.nascimento);
  const lista = ativo ? porSistema.get(ativo) ?? [] : [];

  return (
    <Tela>
      <Stack.Screen options={{ title: p.id === euId ? `${p.nome} (você)` : p.nome }} />
      <Card style={{ alignItems: 'center' }}>
        <Corpo
          sexo={p.sexo}
          cabelo={p.cabelo}
          cor={p.cor}
          sistemas={sistemas}
          alertas={alertas}
          ativo={soResumo ? null : ativo}
          onToque={soResumo ? undefined : (s) => setAtivo(ativo === s ? null : s)}
          largura={170}
        />
        {soResumo ? (
          <T v="small" cor="muted" style={{ textAlign: 'center' }}>{p.nome} compartilha só o resumo com você.</T>
        ) : sistemas.length ? (
          <>
            <T v="small" cor="muted">Toque em um órgão ou escolha um sistema</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              <Chip titulo="Visão geral" cor={c.ink} ativo={!ativo} onPress={() => setAtivo(null)} />
              {sistemas.map((s) => {
                const k = contagem(porSistema.get(s)!);
                return (
                  <Chip key={s} titulo={SISTEMAS[s].chip} cor={SISTEMAS[s].cor} ativo={ativo === s} onPress={() => setAtivo(s)}
                    contador={k.fora || k.limite} contadorTipo={k.fora ? 'fora' : 'limite'} />
                );
              })}
            </View>
          </>
        ) : (
          <T v="small" cor="muted">Nenhum exame ainda.</T>
        )}
      </Card>

      {!soResumo && ativo ? (
        <Card borda={SISTEMAS[ativo].cor}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <T v="h2" style={{ flexShrink: 1 }}>{SISTEMAS[ativo].nome}</T>
            {(() => {
              const k = contagem(lista);
              return <Pill status={k.fora ? 'fora' : k.limite ? 'limite' : 'ok'} texto={k.fora ? `${k.fora} fora` : k.limite ? `${k.limite} no limite` : 'Tudo normal'} />;
            })()}
          </View>
          {lista.map((s) => {
            const r = s.atual;
            const st = statusDe(r);
            const ant = s.anteriores[s.anteriores.length - 1];
            const dif = ant?.valor != null && r.valor != null ? r.valor - ant.valor : null;
            return (
              <View key={s.codigo} style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <T v="h3" style={{ flexShrink: 1 }}>{r.nome}</T>
                  <T v="mono" cor={st === 'fora' ? 'bad' : st === 'limite' ? 'warn' : 'ink'}>
                    {r.valor != null ? fmt(r.valor) : r.valorTexto} <T v="small" cor="muted">{r.unidade}</T>
                  </T>
                </View>
                {r.valor != null && <BarraRef valor={r.valor} refMin={r.refMin} refMax={r.refMax} anterior={ant?.valor} status={st} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <T v="small" cor="muted">
                    {r.refMin != null && r.refMax != null ? `ref. ${fmt(r.refMin)} a ${fmt(r.refMax)}` : r.refMax != null ? `ref. < ${fmt(r.refMax)}` : r.refMin != null ? `ref. > ${fmt(r.refMin)}` : ''}
                    {'  ·  '}{mesAno(r.data)}
                  </T>
                  <Pill status={st} texto={ROTULO[st]} />
                </View>
                {s.anteriores.length > 0 && r.valor != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Sparkline valores={[...s.anteriores.map((x) => x.valor ?? 0), r.valor]} cor={SISTEMAS[ativo].cor} />
                    <T v="small" cor="muted">
                      {s.anteriores.map((x) => `${mesAno(x.data)}: ${x.valor != null ? fmt(x.valor) : '—'}`).join(' · ')}
                      {dif != null ? `   ${dif > 0 ? '▲' : dif < 0 ? '▼' : '='} ${fmt(Math.abs(dif))}` : ''}
                    </T>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      ) : (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T v="h2">Visão geral</T>
            {ss.length > 0 && <Pill status={ct.fora ? 'fora' : ct.limite ? 'limite' : 'ok'} texto={ct.fora ? `${ct.fora} fora da referência` : ct.limite ? `${ct.limite} no limite` : 'Tudo normal'} />}
          </View>
          {sistemas.map((s) => {
            const k = contagem(porSistema.get(s)!);
            return (
              <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SISTEMAS[s].cor }} />
                <T style={{ flex: 1 }} >{SISTEMAS[s].nome}</T>
                <T v="small" cor="muted">{k.total}</T>
                <Pill status={k.fora ? 'fora' : k.limite ? 'limite' : 'ok'} texto={k.fora ? `${k.fora} fora` : k.limite ? `${k.limite} a observar` : 'Normal'} />
              </View>
            );
          })}
          {!sistemas.length && <T cor="muted">Envie um laudo para ver o painel.</T>}
        </Card>
      )}

      <Card>
        <T v="h2">{p.nome}</T>
        <T v="small" cor="muted">
          {[anos ? `${anos} anos` : null, p.sexo === 'F' ? 'Feminino' : 'Masculino', ult ? `última coleta ${dataBR(ult)}` : null].filter(Boolean).join(' · ')}
        </T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pill status="neutro" texto={`${ct.total} parâmetros`} />
          <Pill status="ok" texto={`${ct.total - ct.fora - ct.limite} na referência`} />
          <Pill status="limite" texto={`${ct.limite} no limite`} />
          <Pill status="fora" texto={`${ct.fora} fora`} />
        </View>
      </Card>

      {!soResumo && (
        <Recolhivel titulo="Coletas">
          {[...new Set(rs.map((r) => r.data))].sort().reverse().map((d) => (
            <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
              <T>{dataBR(d)}</T>
              <T v="small" cor="muted">{rs.filter((r) => r.data === d).length} parâmetros</T>
            </View>
          ))}
        </Recolhivel>
      )}
      <T v="small" cor="muted">Os valores e faixas vêm dos laudos. A interpretação é com o médico.</T>
    </Tela>
  );
}
