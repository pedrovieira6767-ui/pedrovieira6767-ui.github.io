import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { Botao, Card, Pill, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { lerLaudo } from '@/lib/leitor';
import * as nuvem from '@/lib/nuvem';
import { textoDoPdf } from '@/lib/pdfTexto';
import { dataBR, fmt, numFromInput, ROTULO, Resultado, statusDe } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

type Fase = 'escolher' | 'lendo' | 'conferir' | 'salvando' | 'erro';
type Arquivo = { uri: string; name: string; mimeType?: string | null };

export default function Enviar() {
  const c = usePalette();
  const { modo, adicionarResultados, euId, eu } = useAmpla();
  const [fase, setFase] = useState<Fase>('escolher');
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [lidos, setLidos] = useState<Resultado[]>([]);
  const [coleta, setColeta] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');

  async function escolher() {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.length) return;
    const a = r.assets[0];
    setArquivo({ uri: a.uri, name: a.name, mimeType: a.mimeType });
    setFase('lendo');
    try {
      const texto = await textoDoPdf(a.uri, (a as { file?: Blob }).file ?? null);
      const leitura = lerLaudo(texto, eu?.sexo ?? 'M');
      if (!leitura.resultados.length) throw new Error('Não encontrei exames neste PDF. Envie o arquivo original do laboratório (não uma foto ou digitalização).');
      setLidos(leitura.resultados);
      setColeta(leitura.coletadoEm);
      setEdicao({});
      setFase('conferir');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o laudo.');
      setFase('erro');
    }
  }

  function valoresFinais(): Resultado[] {
    return lidos.map((r) => {
      const t = edicao[r.codigo];
      if (t == null || r.valor == null) return r;
      const v = numFromInput(t);
      return v == null ? r : { ...r, valor: v };
    });
  }

  async function salvar() {
    setFase('salvando');
    try {
      const finais = valoresFinais();
      if (modo === 'nuvem' && arquivo) await nuvem.salvarLeitura(arquivo, coleta, finais);
      await adicionarResultados(finais);
      router.replace({ pathname: '/pessoa/[id]', params: { id: euId } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setFase('erro');
    }
  }

  return (
    <Tela>
      {fase === 'escolher' && (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ color: c.bg, fontSize: 26, fontWeight: '700' }}>↑</T>
          </View>
          <T v="h2">Envie o laudo em PDF</T>
          <T cor="muted" style={{ textAlign: 'center' }}>
            Use o PDF original do laboratório. A Ampla lê os valores aqui mesmo no aparelho e você confere antes de salvar.
          </T>
          <Botao titulo="Escolher PDF" onPress={escolher} />
          {modo === 'demo' && <T v="small" cor="muted" style={{ textAlign: 'center' }}>Modo demonstração: os valores ficam só neste aparelho.</T>}
        </Card>
      )}

      {(fase === 'lendo' || fase === 'salvando') && (
        <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
          <ActivityIndicator color={c.ink} />
          <T v="h3">{fase === 'lendo' ? `Lendo ${arquivo?.name ?? 'laudo'}…` : 'Salvando…'}</T>
        </Card>
      )}

      {fase === 'conferir' && (
        <>
          <Card>
            <T v="h2">Confira os valores</T>
            <T v="small" cor="muted">
              {lidos.length} exames encontrados{coleta ? ` · coleta de ${dataBR(coleta)}` : ''}. Toque num valor para corrigir.
            </T>
            {lidos.map((r) => {
              const st = statusDe(r);
              return (
                <View key={r.codigo} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
                  <T style={{ flex: 1, flexShrink: 1 }} numberOfLines={2}>{r.nome}</T>
                  {r.valor != null ? (
                    <TextInput
                      accessibilityLabel={`Valor de ${r.nome}`}
                      value={edicao[r.codigo] ?? fmt(r.valor)}
                      onChangeText={(t) => setEdicao({ ...edicao, [r.codigo]: t })}
                      keyboardType="decimal-pad"
                      style={{ width: 76, flexGrow: 0, flexShrink: 0, textAlign: 'right', fontWeight: '700', color: c.ink, borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 2 }}
                    />
                  ) : (
                    <T v="small" style={{ fontWeight: '600' }}>{r.valorTexto}</T>
                  )}
                  <T v="small" cor="muted" style={{ width: 50 }} numberOfLines={1}>{r.unidade ?? ''}</T>
                  <Pill status={st} texto={ROTULO[st]} />
                </View>
              );
            })}
          </Card>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Botao titulo="Salvar no meu painel" onPress={salvar} style={{ flex: 1 }} />
            <Botao titulo="Descartar" tipo="secundario" onPress={() => { setLidos([]); setFase('escolher'); }} />
          </View>
        </>
      )}

      {fase === 'erro' && (
        <Card>
          <T v="h2">Não deu certo</T>
          <T cor="muted">{erro}</T>
          <Botao titulo="Tentar de novo" onPress={() => setFase('escolher')} />
        </Card>
      )}
    </Tela>
  );
}
