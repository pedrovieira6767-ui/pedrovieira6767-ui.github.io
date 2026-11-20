import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { Botao, Card, Pill, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { CHECKUP, ItemLista, PRIORIDADE } from '@/data/catalogo';
import { fmt, idade, ROTULO, series, statusDe } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

type Aba = 'checkup' | 'minha';

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

function htmlLista(titulo: string, sub: string, grupos: { grupo: string; itens: ItemLista[] }[]) {
  const cor = { p: '#c1121f', r: '#15803d', s: '#b45309' };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#15202b;margin:28px}
  .top{display:flex;justify-content:space-between;font-size:10px;color:#6b7785;letter-spacing:.06em}
  h1{font-size:20px;margin:6px 0 2px} .sub{font-size:12px;color:#5b6876;margin:0 0 14px}
  h3{font-size:10px;letter-spacing:.08em;color:#6b7785;margin:16px 0 4px;text-transform:uppercase;border-bottom:1px solid #dfe4ea;padding-bottom:4px}
  .it{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #eef1f4;page-break-inside:avoid}
  .bx{width:12px;height:12px;border:1.5px solid #3c4650;margin-top:2px;flex:none}
  .tx{flex:1} .tx b{font-size:13px} .tx div{font-size:11px;color:#5b6876}
  .pr{font-size:10px;font-weight:700} .rod{font-size:9px;color:#8a95a1;margin-top:20px}
  </style></head><body>
  <div class="top"><span>LISTA DE EXAMES</span><span>Data: ____/____/______</span></div>
  <h1>${esc(titulo)}</h1><p class="sub">${esc(sub)}</p>
  ${grupos.map((g) => `<h3>${esc(g.grupo)}</h3>${g.itens.map((i) => `<div class="it"><span class="bx"></span><span class="tx"><b>${esc(i.nome)}</b><div>${esc(i.motivo)}</div></span><span class="pr" style="color:${cor[i.pri]}">${PRIORIDADE[i.pri]}</span></div>`).join('')}`).join('')}
  <p class="rod">Lista de exames de rotina. Alguns exames podem exigir pedido médico, conforme o laboratório.</p>
  </body></html>`;
}

function BotaoAba({ id, titulo, aba, setAba }: { id: Aba; titulo: string; aba: Aba; setAba: (a: Aba) => void }) {
  const c = usePalette();
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: aba === id }} onPress={() => setAba(id)}
      style={{ flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', backgroundColor: aba === id ? c.ink : 'transparent' }}>
      <T v="small" style={{ fontWeight: '600', color: aba === id ? c.bg : c.muted }}>{titulo}</T>
    </Pressable>
  );
}

export default function ExamesAFazer() {
  const c = usePalette();
  const { eu, resultados, euId } = useAmpla();
  const [aba, setAba] = useState<Aba>('checkup');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<'F' | 'M' | ''>('');
  const [anos, setAnos] = useState('');
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');

  const gruposCheckup = useMemo(() => CHECKUP.map((g) => ({
    grupo: g.grupo,
    itens: g.itens.filter((i) => (!i.sexo || !sexo || i.sexo === sexo) && (!i.idadeMin || !anos || Number(anos) >= i.idadeMin)),
  })).filter((g) => g.itens.length), [sexo, anos]);

  const gruposMinha = useMemo(() => {
    const ss = series(resultados[euId] ?? []);
    const itens: ItemLista[] = ss
      .filter((s) => ['fora', 'limite'].includes(statusDe(s.atual)))
      .map((s) => {
        const st = statusDe(s.atual);
        return { nome: `${s.atual.nome} (repetir)`, motivo: `Último resultado: ${s.atual.valor != null ? fmt(s.atual.valor) : s.atual.valorTexto} ${s.atual.unidade ?? ''} · ${ROTULO[st].toLowerCase()}`, pri: st === 'fora' ? 'p' : 'r' } as ItemLista;
      });
    return itens.length ? [{ grupo: 'Acompanhar', itens }] : [];
  }, [resultados, euId]);

  const grupos = aba === 'checkup' ? gruposCheckup : gruposMinha;
  const chave = (g: string, n: string) => `${aba}|${g}|${n}`;
  const marcado = (g: string, i: ItemLista) => marcados[chave(g, i.nome)] ?? (i.pri !== 's');

  async function gerarPdf() {
    const sel = grupos.map((g) => ({ grupo: g.grupo, itens: g.itens.filter((i) => marcado(g.grupo, i)) })).filter((g) => g.itens.length);
    if (!sel.length) { setMsg('Marque pelo menos um exame.'); return; }
    const titulo = aba === 'checkup' ? `Check-up inicial${nome ? ' · ' + nome : ''}` : eu?.nome ?? 'Minha lista';
    const sub = aba === 'checkup'
      ? [sexo === 'F' ? 'Feminino' : sexo === 'M' ? 'Masculino' : '', anos ? `${anos} anos` : ''].filter(Boolean).join(' · ') || 'Os exames básicos para começar a acompanhar sua saúde de forma contínua.'
      : [eu?.sexo === 'F' ? 'Feminino' : 'Masculino', idade(eu?.nascimento ?? null) ? `${idade(eu?.nascimento ?? null)} anos` : ''].filter(Boolean).join(' · ');
    const html = htmlLista(titulo, sub, sel);
    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Lista de exames', UTI: 'com.adobe.pdf' });
      }
      setMsg('');
    } catch {
      setMsg('Não foi possível gerar o PDF.');
    }
  }

  const input = { borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: c.ink, backgroundColor: c.surface, fontSize: 15 } as const;

  return (
    <Tela>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
        <BotaoAba id="checkup" titulo="Check-up inicial" aba={aba} setAba={setAba} />
        <BotaoAba id="minha" titulo="Minha lista" aba={aba} setAba={setAba} />
      </View>

      <Card>
        <T v="label" cor="muted">Lista de exames</T>
        <T v="h2">{aba === 'checkup' ? 'Check-up inicial' : eu?.nome}</T>
        <T v="small" cor="muted">
          {aba === 'checkup' ? 'Os exames básicos para começar a acompanhar sua saúde de forma contínua.' : 'Exames para repetir, a partir dos seus últimos resultados.'}
        </T>

        {aba === 'checkup' && (
          <View style={{ gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line }}>
            <TextInput value={nome} onChangeText={setNome} placeholder="Nome (opcional)" placeholderTextColor={c.muted} style={input} accessibilityLabel="Nome" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['F', 'M'] as const).map((s) => (
                <Pressable key={s} onPress={() => setSexo(sexo === s ? '' : s)} accessibilityRole="button" accessibilityState={{ selected: sexo === s }}
                  style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: sexo === s ? c.ink : c.line, alignItems: 'center' }}>
                  <T v="small" style={{ fontWeight: '600' }}>{s === 'F' ? 'Feminino' : 'Masculino'}</T>
                </Pressable>
              ))}
              <TextInput value={anos} onChangeText={(t) => setAnos(t.replace(/\D/g, '').slice(0, 3))} placeholder="Idade" placeholderTextColor={c.muted} keyboardType="number-pad" style={[input, { width: 80 }]} accessibilityLabel="Idade" />
            </View>
          </View>
        )}

        {grupos.map((g) => (
          <View key={g.grupo}>
            <T v="label" cor="muted" style={{ marginTop: 6, marginBottom: 4 }}>{g.grupo}</T>
            {g.itens.map((i) => {
              const on = marcado(g.grupo, i);
              return (
                <Pressable key={i.nome} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setMarcados({ ...marcados, [chave(g.grupo, i.nome)]: !on })}
                  style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: c.line, alignItems: 'flex-start' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: on ? c.ink : c.muted, backgroundColor: on ? c.ink : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    {on && <T style={{ color: c.bg, fontSize: 12, fontWeight: '800', lineHeight: 14 }}>✓</T>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="h3">{i.nome}</T>
                    <T v="small" cor="muted">{i.motivo}</T>
                  </View>
                  <Pill status={i.pri === 'p' ? 'fora' : i.pri === 'r' ? 'ok' : 'limite'} texto={PRIORIDADE[i.pri]} />
                </Pressable>
              );
            })}
          </View>
        ))}
        {!grupos.length && <T cor="muted">Nada para repetir agora.</T>}
      </Card>

      <Botao titulo="Gerar PDF para o laboratório" icone="⇩" onPress={gerarPdf} />
      {msg ? <T v="small" cor="bad">{msg}</T> : null}
      <T v="small" cor="muted">Só os itens marcados entram no PDF.</T>
    </Tela>
  );
}
