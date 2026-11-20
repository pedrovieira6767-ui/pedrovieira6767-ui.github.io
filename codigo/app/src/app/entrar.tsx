import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { Botao, Card, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import * as nuvem from '@/lib/nuvem';
import { useAmpla } from '@/lib/store';

export default function Entrar() {
  const c = usePalette();
  const { recarregar } = useAmpla();
  const [criar, setCriar] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const input = { borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, backgroundColor: c.surface, fontSize: 15 } as const;

  if (!nuvem.nuvemConfigurada) {
    return (
      <Tela>
        <Card><T>O servidor ainda não foi configurado. O app segue no modo demonstração.</T></Card>
      </Tela>
    );
  }

  async function enviar() {
    setMsg(''); setOk('');
    if (!email.includes('@') || senha.length < 6) { setMsg('Use um e-mail válido e uma senha com pelo menos 6 caracteres.'); return; }
    try {
      if (criar) {
        const r = await nuvem.criarConta(email.trim(), senha);
        if (r.precisaConfirmar) { setOk('Conta criada. Abra o e-mail que enviamos, toque no link de confirmação e depois entre aqui.'); setCriar(false); return; }
      } else {
        await nuvem.entrar(email.trim(), senha);
      }
      await recarregar();
      router.replace('/');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível entrar.');
    }
  }

  return (
    <Tela>
      <Card>
        <T v="h2">{criar ? 'Criar conta' : 'Entrar na Ampla'}</T>
        <TextInput value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={c.muted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={input} accessibilityLabel="E-mail" />
        <TextInput value={senha} onChangeText={setSenha} placeholder="Senha" placeholderTextColor={c.muted} secureTextEntry autoComplete={criar ? 'new-password' : 'current-password'} style={input} accessibilityLabel="Senha" />
        <Botao titulo={criar ? 'Criar conta' : 'Entrar'} onPress={enviar} />
        {msg ? <T v="small" cor="bad">{msg}</T> : null}
        {ok ? <T v="small" cor="ok">{ok}</T> : null}
        <Pressable onPress={() => { setCriar(!criar); setMsg(''); }} accessibilityRole="button">
          <T v="small" style={{ fontWeight: '600', textAlign: 'center' }}>{criar ? 'Já tenho conta' : 'Criar uma conta'}</T>
        </Pressable>
      </Card>
    </Tela>
  );
}
