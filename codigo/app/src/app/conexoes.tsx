import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';

import { Corpo } from '@/components/Corpo';
import { Botao, Card, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import type { Nivel } from '@/lib/saude';
import { useAmpla } from '@/lib/store';

const NIVEIS: { id: Nivel; titulo: string; desc: string }[] = [
  { id: 'nada', titulo: 'Nada', desc: 'Não vê seus exames' },
  { id: 'resumo', titulo: 'Resumo', desc: 'Vê só quantos estão fora ou no limite' },
  { id: 'tudo', titulo: 'Tudo', desc: 'Vê os valores e pode comparar com você' },
];

export default function Conexoes() {
  const c = usePalette();
  const { pessoas, euId, criarConvite, aceitarConvite, definirNivel, removerConexao } = useAmpla();
  const outros = pessoas.filter((p) => p.id !== euId);
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState('');
  const [remover, setRemover] = useState<string | null>(null);

  async function convidar() {
    try {
      const code = await criarConvite();
      const link = Linking.createURL('/conexoes', { queryParams: { convite: code } });
      const texto = `Estou usando a Ampla para acompanhar meus exames. Entre com o código ${code} para nos conectarmos: ${link}`;
      try {
        await Share.share({ message: texto });
      } catch {
        await Clipboard.setStringAsync(texto);
        setMsg('Convite copiado. Cole no WhatsApp.');
        return;
      }
      setMsg(`Convite criado: ${code}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível criar o convite.');
    }
  }

  async function aceitar() {
    if (codigo.trim().length < 4) { setMsg('Digite o código do convite.'); return; }
    try {
      await aceitarConvite(codigo.trim());
      setCodigo('');
      setMsg('Conexão criada.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Código inválido.');
    }
  }

  return (
    <Tela>
      <Card>
        <T v="h2">Convidar</T>
        <T cor="muted">Mande um convite pelo WhatsApp ou qualquer app. A conexão só existe quando a pessoa aceita, e cada um escolhe o que mostra.</T>
        <Botao titulo="Enviar convite" icone="↗" onPress={convidar} />
      </Card>

      <Card>
        <T v="h2">Recebi um código</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={codigo} onChangeText={(t) => setCodigo(t.toUpperCase())} placeholder="Ex.: 7F3A9C21" placeholderTextColor={c.muted} autoCapitalize="characters" accessibilityLabel="Código do convite"
            style={{ flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, backgroundColor: c.surface, fontSize: 15, letterSpacing: 1 }} />
          <Botao titulo="Conectar" onPress={aceitar} />
        </View>
      </Card>
      {msg ? <T v="small" cor="muted">{msg}</T> : null}

      <T v="label" cor="muted">O que cada pessoa vê de você</T>
      {outros.map((p) => (
        <Card key={p.id} borda={p.cor}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Corpo sexo={p.sexo} cabelo={p.cabelo} cor={p.cor} largura={34} sistemas={[]} />
            <View style={{ flex: 1 }}>
              <T v="h3" cor={p.cor}>{p.nome}</T>
              <T v="small" cor="muted">Compartilha com você: {NIVEIS.find((n) => n.id === p.nivelRecebido)?.titulo.toLowerCase()}</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {NIVEIS.map((n) => {
              const on = (p.nivelEnviado ?? 'nada') === n.id;
              return (
                <Pressable key={n.id} onPress={() => definirNivel(p.id, n.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.line, alignItems: 'center' }}>
                  <T v="small" style={{ fontWeight: '700' }}>{n.titulo}</T>
                </Pressable>
              );
            })}
          </View>
          <T v="small" cor="muted">{NIVEIS.find((n) => n.id === (p.nivelEnviado ?? 'nada'))?.desc}</T>
          {remover === p.id ? (
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <Botao titulo="Remover conexão" tipo="secundario" onPress={() => { setRemover(null); removerConexao(p.id); }} />
              <Botao titulo="Cancelar" tipo="secundario" onPress={() => setRemover(null)} />
            </View>
          ) : (
            <Pressable onPress={() => setRemover(p.id)} style={{ alignSelf: 'flex-end' }}>
              <T v="small" cor="muted">Remover conexão</T>
            </Pressable>
          )}
        </Card>
      ))}
      {!outros.length && <T cor="muted">Nenhuma conexão ainda.</T>}
    </Tela>
  );
}
