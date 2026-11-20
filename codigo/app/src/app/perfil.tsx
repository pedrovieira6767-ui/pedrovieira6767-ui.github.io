import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Corpo } from '@/components/Corpo';
import { Botao, Card, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import * as nuvem from '@/lib/nuvem';
import type { Sexo } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

const CABELOS = ['#1f1a17', '#2f2118', '#5a3a22', '#8a5a2b', '#c9a15b', '#9ca3af'];
const CORES = ['#2f6fde', '#d4407a', '#0d9488', '#9333ea', '#ea580c', '#16a34a'];

function Bolinhas({ cores, valor, onEscolher, rotulo }: { cores: string[]; valor: string; onEscolher: (x: string) => void; rotulo: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <T v="label" cor="muted">{rotulo}</T>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {cores.map((x) => (
          <Pressable key={x} onPress={() => onEscolher(x)} accessibilityRole="radio" accessibilityState={{ selected: valor === x }} accessibilityLabel={`${rotulo} ${x}`}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: x, borderWidth: valor === x ? 3 : 0, borderColor: c.ink }} />
        ))}
      </View>
    </View>
  );
}

export default function Perfil() {
  const { eu } = useAmpla();
  return <Formulario key={eu ? `${eu.id}|${eu.nome}|${eu.sexo}|${eu.nascimento}|${eu.cabelo}|${eu.cor}` : 'novo'} />;
}

function Formulario() {
  const c = usePalette();
  const { eu, modo, salvarPerfil, apagarTudo, restaurarDemo } = useAmpla();
  const [nome, setNome] = useState(eu?.nome ?? '');
  const [sexo, setSexo] = useState<Sexo>(eu?.sexo ?? 'M');
  const [ano, setAno] = useState(eu?.nascimento ? String(eu.nascimento) : '');
  const [cabelo, setCabelo] = useState(eu?.cabelo ?? CABELOS[1]);
  const [cor, setCor] = useState(eu?.cor ?? CORES[0]);
  const [consente, setConsente] = useState(true);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [msg, setMsg] = useState('');

  async function salvar() {
    if (!nome.trim()) { setMsg('Escreva seu nome.'); return; }
    if (modo === 'nuvem' && !consente) { setMsg('Para guardar exames é preciso autorizar o uso dos dados de saúde.'); return; }
    await salvarPerfil({ nome: nome.trim(), sexo, nascimento: ano ? Number(ano) : null, cabelo, cor }, consente);
    router.back();
  }

  const input = { borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, backgroundColor: c.surface, fontSize: 15 } as const;

  return (
    <Tela>
      <Card style={{ alignItems: 'center' }}>
        <Corpo sexo={sexo} cabelo={cabelo} cor={cor} largura={110} />
        <T v="h2" cor={cor}>{nome || 'Seu nome'}</T>
      </Card>
      <Card>
        <TextInput value={nome} onChangeText={setNome} placeholder="Nome" placeholderTextColor={c.muted} style={input} accessibilityLabel="Nome" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['F', 'M'] as const).map((s) => (
            <Pressable key={s} onPress={() => setSexo(s)} accessibilityRole="radio" accessibilityState={{ selected: sexo === s }}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: sexo === s ? 2 : 1, borderColor: sexo === s ? c.ink : c.line, alignItems: 'center' }}>
              <T v="small" style={{ fontWeight: '600' }}>{s === 'F' ? 'Feminino' : 'Masculino'}</T>
            </Pressable>
          ))}
          <TextInput value={ano} onChangeText={(t) => setAno(t.replace(/\D/g, '').slice(0, 4))} placeholder="Ano nasc." placeholderTextColor={c.muted} keyboardType="number-pad" style={[input, { width: 110 }]} accessibilityLabel="Ano de nascimento" />
        </View>
        <T v="small" cor="muted">O sexo define o desenho e as faixas de referência dos exames.</T>
        <Bolinhas rotulo="Cabelo" cores={CABELOS} valor={cabelo} onEscolher={setCabelo} />
        <Bolinhas rotulo="Sua cor" cores={CORES} valor={cor} onEscolher={setCor} />
      </Card>

      {modo === 'nuvem' && (
        <Pressable onPress={() => setConsente(!consente)} accessibilityRole="checkbox" accessibilityState={{ checked: consente }} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: c.ink, backgroundColor: consente ? c.ink : 'transparent', marginTop: 2 }} />
          <T v="small" style={{ flex: 1 }}>
            Autorizo a Ampla a guardar meus exames (dados de saúde) para montar meu painel. Só eu decido quem vê. Posso apagar tudo a qualquer momento.
          </T>
        </Pressable>
      )}

      <Botao titulo="Salvar" onPress={salvar} />
      {msg ? <T v="small" cor="bad">{msg}</T> : null}

      <Card>
        <T v="h3">Seus dados</T>
        {modo === 'demo' ? (
          <>
            <T v="small" cor="muted">Você está no modo demonstração, com pessoas e exames fictícios guardados só neste aparelho.</T>
            <Botao titulo="Restaurar demonstração" tipo="secundario" onPress={restaurarDemo} />
            {nuvem.nuvemConfigurada && <Botao titulo="Entrar com minha conta" tipo="secundario" onPress={() => router.push('/entrar')} />}
          </>
        ) : (
          <Botao titulo="Sair" tipo="secundario" onPress={async () => { await nuvem.sair(); router.replace('/'); }} />
        )}
        {confirmarApagar ? (
          <View style={{ gap: 8 }}>
            <T v="small" cor="bad">Isso apaga seus exames, laudos e conexões. Não dá para desfazer.</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Botao titulo="Apagar tudo" onPress={async () => { await apagarTudo(); setConfirmarApagar(false); router.replace('/'); }} />
              <Botao titulo="Cancelar" tipo="secundario" onPress={() => setConfirmarApagar(false)} />
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmarApagar(true)}>
            <T v="small" cor="bad">Apagar todos os meus dados</T>
          </Pressable>
        )}
      </Card>
    </Tela>
  );
}
